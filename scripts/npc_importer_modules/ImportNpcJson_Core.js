// Import JSON v1.0.0 – 5e-NPC importer for Roll20 sheet v4.2+ (2025-05-31)
"use strict";

const ImportNpcJson = (() => { // START REVEALING MODULE PATTERN
    const scriptName = 'ImportNpcJson';
    const version = "1.0.3"
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
        
        // Modified check to allow both !5enpcimport and !5enpctest
        if (msg.type !== 'api' || (!msg.content.startsWith('!5enpcimport') && !msg.content.startsWith('!5enpctest'))) return;
    
        const who = msg.who.replace(' (GM)', '');
        const whisper = (t) => ImportJSON_Utils.global_sendChat('ImportNPC', `/w "${who}" ${t}`);
    
        // Test command can now go anywhere since it passes the initial check
        if (msg.content === "!5enpctest" && msg.selected && msg.selected.length > 0) {
            msg.selected.forEach(selected => {
                if (selected._type === 'graphic') {
                    const token = ImportJSON_Utils.global_getObj('graphic', selected._id);
                    if (token) {
                        const raw = token.get('gmnotes');
                        whisper(`=== Token GM Notes Debug ===`);
                        whisper(`Raw length: ${raw ? raw.length : 'null/empty'}`);
                        whisper(`Raw (first 200): ${raw ? raw.substring(0, 200) : 'empty'}`);
                        
                        // Check what type of encoding we have
                        if (raw) {
                            const hasUrlEncoding = raw.includes('%3C') || raw.includes('%3E') || raw.includes('%7B');
                            const hasHtmlEntities = raw.includes('&lt;') || raw.includes('&gt;') || raw.includes('&nbsp;');
                            const hasHtmlTags = raw.includes('<p>') || raw.includes('</p>');
                            
                            whisper(`Has URL encoding: ${hasUrlEncoding}`);
                            whisper(`Has HTML entities: ${hasHtmlEntities}`);
                            whisper(`Has HTML tags: ${hasHtmlTags}`);
                        }
                        
                        const decoded = ImportJSON_Utils.decode(raw);
                        whisper(`Decoded length: ${decoded ? decoded.length : 'empty'}`);
                        whisper(`Decoded (first 200): ${decoded ? decoded.substring(0, 200) : 'empty'}`);
                        
                        // Try to find JSON structure
                        if (decoded) {
                            const jsonStart = decoded.indexOf('{');
                            const jsonEnd = decoded.lastIndexOf('}');
                            whisper(`JSON start index: ${jsonStart}`);
                            whisper(`JSON end index: ${jsonEnd}`);
                            
                            if (jsonStart !== -1 && jsonEnd !== -1) {
                                const extracted = decoded.substring(jsonStart, jsonEnd + 1);
                                whisper(`Extracted JSON length: ${extracted.length}`);
                                whisper(`Extracted JSON (first 100): ${extracted.substring(0, 100)}...`);
                                
                                // Try to parse it
                                try {
                                    const parsed = JSON.parse(extracted);
                                    whisper(`✅ JSON parse SUCCESS! Found creature: ${parsed.name || 'unnamed'}`);
                                } catch (e) {
                                    whisper(`❌ JSON parse failed: ${e.message}`);
                                }
                            }
                        }
                    }
                }
            });
            return;
        }
    
        // Handle help command
        if (ImportNpcJson_HelpCommand && typeof ImportNpcJson_HelpCommand.handleHelp === 'function') {
            if (ImportNpcJson_HelpCommand.handleHelp(msg, whisper)) {
                return;
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
        // Token-based import section (replace the existing section in handleChatMessage)
        if (msg.selected && msg.selected.length > 0 && msg.content.trim() === "!5enpcimport") {
            ImportJSON_Utils.dbg("Processing token import trigger...");
            let processedToken = false;
            
            msg.selected.forEach(selected => {
                if (selected._type === 'graphic') {
                    const token = ImportJSON_Utils.global_getObj('graphic', selected._id);
                    if (token) {
                        const gmnotes = token.get('gmnotes');
                        
                        // Enhanced debugging
                        ImportJSON_Utils.dbg(`Raw GM notes type: ${typeof gmnotes}`);
                        ImportJSON_Utils.dbg(`Raw GM notes length: ${gmnotes ? gmnotes.length : 'null/undefined'}`);
                        ImportJSON_Utils.dbg(`Raw GM notes (first 200 chars): ${gmnotes ? gmnotes.substring(0, 200) + (gmnotes.length > 200 ? '...' : '') : 'null_or_empty'}`);
                        
                        // Check for common encoding patterns
                        if (gmnotes && gmnotes.includes('%3C') && gmnotes.includes('%3E')) {
                            ImportJSON_Utils.dbg(`Detected URL encoding in GM notes`);
                        }
                        if (gmnotes && gmnotes.includes('&lt;') && gmnotes.includes('&gt;')) {
                            ImportJSON_Utils.dbg(`Detected HTML entities in GM notes`);
                        }
                        
                        let cleanedGmnotes = gmnotes && gmnotes !== "null" ? ImportJSON_Utils.decode(gmnotes).trim() : "";
                        ImportJSON_Utils.dbg(`After decode - length: ${cleanedGmnotes.length}`);
                        ImportJSON_Utils.dbg(`After decode - first 200 chars: ${cleanedGmnotes.substring(0, 200)}${cleanedGmnotes.length > 200 ? '...' : ''}`);
                        
                        // Try to extract JSON from the cleaned notes
                        if (cleanedGmnotes) {
                            // Look for JSON structure
                            const jsonStart = cleanedGmnotes.indexOf('{');
                            const jsonEnd = cleanedGmnotes.lastIndexOf('}');
                            
                            if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
                                const extractedJson = cleanedGmnotes.substring(jsonStart, jsonEnd + 1);
                                ImportJSON_Utils.dbg(`Extracted JSON candidate - length: ${extractedJson.length}`);
                                ImportJSON_Utils.dbg(`Extracted JSON candidate - first 100 chars: ${extractedJson.substring(0, 100)}...`);
                                
                                // Validate it's likely JSON
                                if (extractedJson.includes('"name"') || extractedJson.includes("'name'")) {
                                    cleanedGmnotes = extractedJson;
                                    ImportJSON_Utils.dbg(`Using extracted JSON content`);
                                }
                            }
                            
                            // Handle potential double-stringified JSON
                            if (cleanedGmnotes.startsWith('"') && cleanedGmnotes.endsWith('"')) {
                                try {
                                    const innerJson = JSON.parse(cleanedGmnotes);
                                    if (typeof innerJson === 'string') {
                                        ImportJSON_Utils.dbg(`GM notes appeared to be double-stringified. Using inner content.`);
                                        cleanedGmnotes = innerJson;
                                    }
                                } catch (e) {
                                    ImportJSON_Utils.dbg(`Double-stringify check failed: ${e.message}`);
                                }
                            }
                            
                            ImportJSON_Utils.dbg(`Final content being passed to builder - length: ${cleanedGmnotes.length}`);
                            ImportJSON_Utils.dbg(`Final content preview: ${cleanedGmnotes.substring(0, 50)}...`);
                            
                            ImportNpcJson_Builder.buildNpc(cleanedGmnotes, whisper, token.id, version);
                            processedToken = true;
                            return; // Exits forEach early
                        } else {
                            ImportJSON_Utils.dbg(`No GM notes content after cleaning for token ID ${token.id}.`);
                        }
                    }
                }
            });
            
            if (processedToken) {
                return;
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