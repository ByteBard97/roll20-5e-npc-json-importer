// Import JSON v1.0.0 – 5e-NPC importer for Roll20 sheet v4.2+ (2025-05-31)
"use strict";

const ImportNpcJson = (() => { // START REVEALING MODULE PATTERN
    const scriptName = 'ImportNpcJson';
    const version = "1.0.2";
    // This file now primarily handles chat command listening, preprocessing, and global setup.
    // Main build logic is in ImportNpcJson_Builder.js
    // Depends on: 
    //  - ImportNpcJson_Utils.js
    //  - ImportNpcJson_Builder.js
    //  - ImportNpcJson_CharacterSetup.js (indirectly via Builder)
    //  - ImportNpcJson_ScalarAttributes.js (indirectly via Builder)
    //  - ImportNpcJson_SheetInitializer.js (indirectly via Builder)
    //  - ImportNpcJson_RepeatingSections.js (indirectly via Builder)

    // Helpers and constants are expected to be loaded from ImportNpcJson_Utils.js
    // and available under the ImportJSON_Utils namespace.

    /* ------------ preprocess handout text ------------ */
    // This function receives the raw text from the handout and the whisper function.
    // It should call the builder.
    function preprocess(rawText, whisper) {
      const txt = ImportJSON_Utils.decode(ImportJSON_Utils.strip(rawText)).trim();
      if (!txt) {
        return whisper("❌ Handout content was empty after cleanup.");
      }
      ImportJSON_Utils.dbg("Preprocess: Calling Builder.buildNpc with handout text.");
      return ImportNpcJson_Builder.buildNpc(txt, whisper, null, version);
    }

    function handleChatMessage(msg) {
        if (msg.playerid === 'API') return;                 // Prevent self-echo loops
        if (msg.type !== 'api' || !msg.content.startsWith('!5enpcimport')) return;

        const who = msg.who.replace(' (GM)', '');
        // Use a consistent whisper function name, e.g., 'whisper' or 'replyToSender'
        const whisper = (t) => ImportJSON_Utils.global_sendChat('ImportNPC', `/w "${who}" ${t}`);

        // Handle help command first
        if (ImportNpcJson_HelpCommand && typeof ImportNpcJson_HelpCommand.handleHelp === 'function') {
            if (ImportNpcJson_HelpCommand.handleHelp(msg, whisper)) {
                return; // Help command was handled, stop further processing
            }
        }

        // Inline JSON (quoted or bare)
        // Example: !5enpcimport {"name":"Tiny Rat"} or !5enpcimport '{"name":"Tiny Rat"}'
        const jsonMatch = msg.content.match(/!5enpcimport\s+(?:"|')?({[\s\S]*})(?:"|')?/i);
        if (jsonMatch && jsonMatch[1]) {
            ImportJSON_Utils.dbg("Processing inline JSON (via jsonMatch)...");
            return ImportNpcJson_Builder.buildNpc(jsonMatch[1], whisper, null, version);
        }

        // Handout parsing
        // Example: !5enpcimport handout|My Handout Name
        const handoutMatch = msg.content.match(/!5enpcimport\s+handout\|(.+)/i);
        if (handoutMatch && handoutMatch[1]) {
            const handoutName = handoutMatch[1].trim();
            ImportJSON_Utils.dbg(`Processing handout: "${handoutName}"`);
            const h = ImportJSON_Utils.global_findObjs({ type: "handout", name: handoutName })[0];
            if (!h) {
                return whisper(`❌ Handout "${handoutName}" not found.`);
            }
            // Asynchronously get notes, then gmnotes if notes is empty
            h.get("notes", (notes) => {
                const notesContent = notes && notes !== "null" ? notes.trim() : "";
                if (notesContent) {
                    ImportJSON_Utils.dbg(`Found content in handout notes for "${handoutName}".`);
                    return preprocess(notesContent, whisper); // Assuming preprocess calls Builder
                }
                // If notes were empty, try gmnotes
                h.get("gmnotes", (gmnotes) => {
                    const gmnotesContent = gmnotes && gmnotes !== "null" ? gmnotes.trim() : "";
                    if (gmnotesContent) {
                        ImportJSON_Utils.dbg(`Found content in handout GM notes for "${handoutName}".`);
                        return preprocess(gmnotesContent, whisper); // Assuming preprocess calls Builder
                    } else {
                        ImportJSON_Utils.dbg(`No content found in notes or GM notes for handout "${handoutName}".`);
                        return whisper(`❌ Handout "${handoutName}" is empty (checked notes and GM notes).`);
                    }
                });
            });
            return; // Important: return here because the .get calls are async
        }

        // Token-based import
        // Example: !5enpcimport (with a token selected)
        // This condition should be after inline and handout checks, but before the generic error.
        if (msg.selected && msg.selected.length > 0 && msg.content.trim() === "!5enpcimport") {
            ImportJSON_Utils.dbg("Processing token import trigger...");
            let processedToken = false;
            msg.selected.forEach(selected => {
                if (selected._type === 'graphic') {
                    const token = ImportJSON_Utils.global_getObj('graphic', selected._id);
                    if (token) {
                        const gmnotes = token.get('gmnotes');
                        const rawGmnotesForLog = gmnotes ? gmnotes.substring(0, 100) + (gmnotes.length > 100 ? '...' : '') : 'null_or_empty'; // Avoid overly long logs
                        ImportJSON_Utils.dbg(`Raw GM notes from token ${token.id} (first 100 chars): ${rawGmnotesForLog}`);

                        let cleanedGmnotes = gmnotes && gmnotes !== "null" ? ImportJSON_Utils.decode(gmnotes).trim() : "";
                        ImportJSON_Utils.dbg(`Cleaned GM notes for token ${token.id} (after decode & trim): ${cleanedGmnotes ? cleanedGmnotes.substring(0,100) + (cleanedGmnotes.length > 100 ? '...' : '') : 'empty'}`);

                        // Attempt to handle potential double-stringified JSON from GM Notes
                        if (cleanedGmnotes.startsWith('"') && cleanedGmnotes.endsWith('"')) {
                            try {
                                const innerJson = JSON.parse(cleanedGmnotes); // This would parse the outer string layer
                                if (typeof innerJson === 'string') { // Check if the result of the first parse is still a string
                                   ImportJSON_Utils.dbg(`GM notes appeared to be double-stringified. Attempting to parse inner content.`);
                                   cleanedGmnotes = innerJson; // Use the inner string for the actual JSON.parse in the builder
                                }
                            } catch (e) {
                                ImportJSON_Utils.dbg(`Tried to parse presumed double-stringified JSON but failed: ${e.message}`);
                                // If this fails, proceed with cleanedGmnotes as is, Builder will likely fail and report
                            }
                        }

                        if (cleanedGmnotes) {
                            ImportJSON_Utils.dbg(`Final GM notes string being passed to builder for token ${token.id} (first 100 chars): ${cleanedGmnotes ? cleanedGmnotes.substring(0,100) + (cleanedGmnotes.length > 100 ? '...' : '') : 'empty'}`);
                            ImportNpcJson_Builder.buildNpc(cleanedGmnotes, whisper, token.id, version);
                            processedToken = true;
                            return; // Exits forEach early, processing only the first valid token
                        } else {
                            ImportJSON_Utils.dbg(`No GM notes content in selected token ID ${token.id}.`);
                        }
                    }
                }
            });

            if (processedToken) {
                return; // At least one token was processed
            } else {
                return whisper('ℹ️ No JSON data found in the GM Notes of the selected token(s).');
            }
        }

        // If neither inline JSON, handout, nor token import matched
        whisper('❌ Invalid command. Use `!5enpcimport {JSON_DATA}` (optionally quoted), `!5enpcimport handout|Handout Name`, or select a token with JSON in its GM Notes and type `!5enpcimport`.');
    }

    const registerEventHandlers = () => {
        on('chat:message', handleChatMessage);
    };

    on("ready", () => {
        // Populate the global Roll20 functions in ImportJSON_Utils
        ImportJSON_Utils.global_findObjs = findObjs;
        ImportJSON_Utils.global_createObj = createObj;
        ImportJSON_Utils.global_log = log;
        ImportJSON_Utils.global_sendChat = sendChat;
        ImportJSON_Utils.global_getObj = typeof getObj !== 'undefined' ? getObj : null;
        ImportJSON_Utils.global_generateRowID = typeof generateRowID !== 'undefined' ? generateRowID : null; 
        ImportJSON_Utils.global_getAttrByName = typeof getAttrByName !== 'undefined' ? getAttrByName : null; 
        ImportJSON_Utils.global_on = on;

        // Debug log indicating Core and its primary dependency (Utils) are ready.
        // Specific versions/readiness of other modules will be logged by themselves.
        if (ImportJSON_Utils.global_log) { // Check if log is available
            try {
                ImportJSON_Utils.global_log(
                  `-=> ${scriptName} v${version} <=- ready. Core loaded. Utils should be loaded.`
                );
            } catch (e) {
                // If this initial log in on("ready") fails, send a chat message.
                if (ImportJSON_Utils.global_sendChat) {
                    ImportJSON_Utils.global_sendChat("ImportJSON CRITICAL ERROR", `/w gm The API 'log()' function FAILED in on("ready"). Error: ${e.message}. Sandbox might be corrupted.`);
                }
            }
        }
        
        // Whisper to GM that the script is ready
        if (ImportJSON_Utils.global_sendChat) {
            ImportJSON_Utils.global_sendChat(
                scriptName,
                `/w gm ${scriptName} v${version} loaded and ready.`
            );
        }

        // Register chat listener AFTER everything is initialized
        registerEventHandlers();
    }); 

    return {
        // Potentially expose functions if needed by other modules or for testing,
        // though for a bundled script, this might be minimal.
        // For now, keeping it simple and not exposing anything.
    };
})(); // END REVEALING MODULE PATTERN 