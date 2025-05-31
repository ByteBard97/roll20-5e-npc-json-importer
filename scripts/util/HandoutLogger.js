// Handout Logger Script (v1.1)
// Provides a utility for other API scripts to log messages to a Roll20 Handout.

var HandoutLogger = HandoutLogger || (function() {
    'use strict';

    // --- CONFIGURATION ---
    const HANDOUT_NAME = "API Debug Log"; // The exact name of the handout to use/create
    const LOG_TARGET = "gmnotes";         // Use "gmnotes" (GM only) or "notes" (Player visible if handout shared)
    const ADD_TIMESTAMP = false;           // Prepend ISO timestamp to each log entry?
    const MAX_LOG_LENGTH = 100000;        // Approx max characters before considering truncation (Safety limit)
    const TRUNCATE_AMOUNT = 20000;        // Approx characters to remove from the *start* if MAX_LOG_LENGTH is exceeded
    const CLEAR_ON_STARTUP = false;       // Set to true to wipe the log clean every time the API sandbox restarts
    // --- END CONFIGURATION ---

    const version = '1.1';
    const scriptName = 'HandoutLogger';
    let logHandout = null; // Cached handout object
    let isReady = false;
    let messageQueue = []; // Queue for messages logged before 'ready'

    // Internal log function (avoids potential conflicts if user script also defines 'log')
    const _log = (message) => {
        log(`[${scriptName} v${version}] ${message}`);
    };

    // Finds the specified handout, creates it if missing.
    // Returns the handout object or null if creation/find fails.
    const findOrCreateHandout = () => {
        // Return cached object if it's still valid
        if (logHandout && getObj('handout', logHandout.id)) {
            return logHandout;
        }

        // Reset cache
        logHandout = null;

        // Find handout by name
        let handouts = findObjs({ _type: 'handout', name: HANDOUT_NAME });

        if (handouts.length === 0) {
            // Handout doesn't exist, create it
            _log(`Handout '${HANDOUT_NAME}' not found. Creating...`);
            logHandout = createObj('handout', {
                name: HANDOUT_NAME,
                inplayerjournals: '', // Initially GM only
                controlledby: ''      // Initially GM only
            });

            if (logHandout) {
                // Initialize notes field after creation
                const initMsg = `API Log Initialized (${new Date().toISOString()})<br><hr>`;
                // Small delay to allow object creation to settle before setting notes
                setTimeout(() => {
                    if (logHandout) { // Check again in case handout deleted immediately
                         logHandout.set(LOG_TARGET, initMsg);
                         _log(`Created and initialized handout '${HANDOUT_NAME}'.`);
                    }
                }, 200);
            } else {
                _log(`ERROR: Failed to create handout '${HANDOUT_NAME}'! Check API console for details.`);
                return null; // Failed to create
            }
        } else {
            // Handout(s) found
            if (handouts.length > 1) {
                _log(`WARNING: Multiple handouts found named '${HANDOUT_NAME}'. Using the first one found (ID: ${handouts[0].id}). Ensure handout names are unique for reliable logging.`);
            }
            logHandout = handouts[0]; // Use the first one found
             _log(`Using existing handout '${HANDOUT_NAME}' (ID: ${logHandout.id}).`);
             // Handle clear on startup if configured
             if (CLEAR_ON_STARTUP) {
                 _log(`CLEAR_ON_STARTUP enabled. Clearing log...`);
                 const clearMsg = `API Log Cleared on Startup (${new Date().toISOString()})<br><hr>`;
                 // Use timeout for safety
                 setTimeout(() => {
                    if (logHandout) { logHandout.set(LOG_TARGET, clearMsg); }
                 }, 200);
             }
        }
        return logHandout;
    };

    // Processes the message queue once the API is ready
    const processQueue = () => {
        isReady = true;
        _log(`Processing ${messageQueue.length} queued log messages.`);
        let handout = findOrCreateHandout(); // Ensure handout exists before processing queue
        if (!handout) {
             _log("ERROR: Cannot process queue, log handout unavailable.");
             messageQueue = []; // Clear queue to prevent infinite loops if handout fails creation
             return;
        }
        // Process messages using the public log function
        messageQueue.forEach(entry => logMessage(entry.message, entry.source));
        messageQueue = []; // Clear the queue
    };

    // --- Public Log Function ---
    // message: The string message to log.
    // source: Optional string prefix (e.g., calling script's name)
    const logMessage = (message, source = '') => {
        // If API isn't ready yet, queue the message
        if (!isReady) {
            messageQueue.push({ message, source });
            return;
        }

        let handout = findOrCreateHandout();
        if (!handout) {
            _log(`ERROR: Cannot log message - log handout unavailable. Message: ${message}`);
            return; // Bail if handout is missing
        }

        let prefix = "";
        if (ADD_TIMESTAMP) {
            prefix += `[${new Date().toISOString()}]`;
        }
        if (source) {
            prefix += `${prefix ? ' ' : ''}[${source}]`; // Add space if timestamp also present
        }
        const formattedMessage = `${prefix}${prefix ? ': ' : ''}${message}<br>`; // Add <br> for line breaks

        // Use asynchronous get() for notes/gmnotes as they can be large
        handout.get(LOG_TARGET, (currentNotes) => {
            // Ensure currentNotes is a string, default to empty if null/undefined
            currentNotes = currentNotes || '';

            let newNotes = currentNotes + formattedMessage;

            // Basic length management (prevents infinitely growing handout)
            if (newNotes.length > MAX_LOG_LENGTH) {
                _log(`Log exceeding ${MAX_LOG_LENGTH} chars. Truncating oldest ${TRUNCATE_AMOUNT} chars.`);
                const startIndex = Math.max(0, newNotes.length - (MAX_LOG_LENGTH - TRUNCATE_AMOUNT)); // Keep newer part
                newNotes = `... (Log Truncated) ...<br><hr>` + newNotes.substring(startIndex);
            }

            // Set the updated notes/gmnotes
            // Need to check handout exists *again* inside async callback
            const currentHandout = getObj('handout', handout.id);
            if (currentHandout) {
                currentHandout.set(LOG_TARGET, newNotes);
            } else {
                 _log(`ERROR: Log handout disappeared before notes could be set for message: ${message}`);
                 // Attempt to re-find/create on next log call
                 logHandout = null;
            }
        });
    };

    // --- Event Handlers ---
    on('ready', () => {
        _log(`Ready. Logging to handout: '${HANDOUT_NAME}' -> ${LOG_TARGET}.`);
        // Attempt initial find/create and process queue
        // Use setTimeout to ensure other scripts might have loaded and state is stable
        setTimeout(processQueue, 100);
    });

    // --- Public Interface ---
    // Expose the 'log' function under the 'HandoutLogger' namespace
    return {
        log: logMessage
    };

})(); // End of HandoutLogger IIFE