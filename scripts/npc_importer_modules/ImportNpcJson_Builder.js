// scripts/ImportNpcJson_Builder.js
const ImportNpcJson_Builder = {
    buildNpc: function(rawJson, w, tokenId, scriptVersion) {
        const startTime = Date.now(); // Record start time
        // This function now orchestrates the entire build process.
        // It relies on ImportJSON_Utils for global functions and constants.
        try {
            ImportJSON_Utils.dbg("Attempting to parse JSON...");
            const d = JSON.parse(rawJson);
            if (!d.name) {
                throw Error('JSON missing required "name" property.');
            }
            ImportJSON_Utils.dbg(`Parsed JSON for: "${d.name}"`);

            /* Step 1: Create Character */
            const characterSetupUtils = {
                createObj: ImportJSON_Utils.global_createObj,
                findObjs: ImportJSON_Utils.global_findObjs,
                dbg: ImportJSON_Utils.dbg,
                DEFAULT_CREATOR: ImportJSON_Utils.DEFAULT_CREATOR
            };
            const char = ImportNpcJson_CharacterSetup.createCharacter(d, characterSetupUtils);

            setTimeout(() => {
                if (!char) {
                    // Error was already logged by createCharacter, but we need to stop execution here.
                    w(`❌ Import failed: Character object could not be created. Check API console log.`);
                    return; // Stop further processing if char is null
                }
                ImportJSON_Utils.dbg(`Character created with ID: ${char.id}`);
                // const charName = char.get("name"); // charName not used currently, can be removed or logged if needed

                // Suggested check for avatar before token finalization (though finaliseToken also checks imgsrc)
                if (!char.get('avatar')) {
                    // Check if the avatar was set. It's set within finaliseToken, so this check might be better placed *after* finaliseToken,
                    // or more specifically, check if the source token had an image *before* calling finaliseToken.
                    // For now, placing a general warning here if char.get('avatar') is empty after char creation and before token logic.
                    // This specific check might be redundant if finaliseToken handles it robustly.
                    // Let's refine this: the avatar is set *inside* finaliseToken. 
                    // A more useful check here might be on d.img or token.get('imgsrc') if available early.
                    // However, the LLM suggested it *after* character creation.
                    // The avatar field on the character is set by ImportNpcJson_Token.finaliseToken.
                    // A check here would be premature for char.get('avatar').
                    // Let's check if the source token (if any) has an image instead, or if npcData has an image property.
                    // The provided tokenId is for the live token on the map.
                    if (tokenId) {
                        const sourceTokenForCheck = ImportJSON_Utils.global_getObj('graphic', tokenId);
                        if (sourceTokenForCheck && !sourceTokenForCheck.get('imgsrc')) {
                            w('⚠️ Source token for import has no image (imgsrc). Default token may lack an image if not set from character avatar later.');
                        }
                    } else if (!d.img) { // If not token import, check for a root 'img' property in JSON (hypothetical, not standard in current JSON spec)
                        // w('⚠️ JSON data has no top-level 'img' property. Default token may lack an image if not set from character avatar later.');
                        // This path is less relevant if avatar is always set from live token or a default.
                    }
                }

                // Adapter for setAttributeDirect to be passed to SheetInitializer
                // It must accept charId as its first argument because SheetInitializer now passes it.
                const setAttributeDirectForInit = (idOfChar, attributeName, attributeValue) => {
                    // This adapter now directly calls the main setAttributeDirect utility,
                    // ensuring it passes all necessary arguments including the charId.
                    return ImportJSON_Utils.setAttributeDirect(idOfChar, attributeName, attributeValue, 
                                                            ImportJSON_Utils.global_findObjs, 
                                                            ImportJSON_Utils.global_createObj, 
                                                            ImportJSON_Utils.dbg);
                };

                /* Step 2: Set Scalar Attributes */
                ImportNpcJson_ScalarAttributes.set(
                    char.id, 
                    d, 
                    w, 
                    ImportJSON_Utils.global_findObjs, 
                    ImportJSON_Utils.global_createObj, 
                    ImportJSON_Utils.setAttributeDirect, // Pass the direct util, not the init adapter
                    ImportJSON_Utils.dbg
                );

                /* Step X: Initialize Sheet (Calculated fields, rolls, etc.) */
                ImportJSON_Utils.dbg("Calling SheetInitializer...");
                ImportNpcJson_SheetInitializer.initialize(char.id, d, w, ImportJSON_Utils.global_findObjs, setAttributeDirectForInit);

                // Set rtype and wtype (global roll template settings)
                ImportJSON_Utils.global_createObj("attribute", {
                    _characterid: char.id,
                    name: "rtype",
                    current: "@{advantagetoggle}",
                });
                ImportJSON_Utils.global_createObj("attribute", {
                    _characterid: char.id,
                    name: "wtype",
                    current: "@{whispertoggle}",
                });
                ImportJSON_Utils.dbg("Set rtype/wtype via createObj.");

                /* Step 3: Create Repeating Section Attributes & Abilities */
                const repeatingSectionUtils = {
                    w: w,
                    findObjs: ImportJSON_Utils.global_findObjs,
                    createObj: ImportJSON_Utils.global_createObj,
                    setAttributeDirect: ImportJSON_Utils.setAttributeDirect,
                    createLinkedAbility: ImportJSON_Utils.createLinkedAbility,
                    genRowID: ImportJSON_Utils.genRowID,
                    dbg: ImportJSON_Utils.dbg,
                    parseBonus: ImportJSON_Utils.parseBonus, 
                    getDice: ImportJSON_Utils.getDice, 
                    calculateAverage: ImportJSON_Utils.calculateAverage
                };
                ImportNpcJson_RepeatingSections.processAll(char.id, d, repeatingSectionUtils);

                // Lair actions and spellcasting warnings (as per original script)
                if (d.lair_actions && (!d.legendary || !d.legendary.lair_actions_desc)) { // Adjusted condition slightly if lair actions are processed elsewhere
                    // The original check was `if (d.lair_actions)` which is broad.
                    // If lair actions are only simple descriptions now, this might be okay.
                    // If they are meant to be complex repeating sections, this warning is still valid.
                    // For now, keeping similar to original simple check.
                    // The original script had: `if (d.lair_actions) { w("⚠️ Lair action import not implemented."); }`
                    // And `if (d.lair_actions && d.lair_actions.desc !== undefined)` for npc_lair_actions scalar attribute.
                    // Current repeating section only handles `d.legendary.actions`, not `d.lair_actions` items.
                    // Check if `d.lair_actions` exists and is not just a simple description already handled by ScalarAttributes
                    if(typeof d.lair_actions === 'object' && d.lair_actions.name && d.lair_actions.desc && d.lair_actions.actions) {
                         w("⚠️ Complex Lair action (with sub-actions) import not fully implemented in repeating sections. Description may be set.");
                    } else if (typeof d.lair_actions === 'string') { 
                        // This case might be if npc_lair_actions was set but it was a simple string.
                        // No warning needed as it would have been handled by ScalarAttributes.
                    } else if (d.lair_actions) {
                         w("⚠️ Lair action data present, ensure it was processed as expected (description and/or repeating section).");
                    }
                }
                if (d.spellcasting) {
                    w("⚠️ Spell import not yet implemented.");
                }

                // Output CR Benchmark Stats to GM
                if (d.cr !== undefined && typeof ImportNpcJson_XPTable !== 'undefined' && ImportNpcJson_XPTable.getCRBenchmarkStats) {
                    const benchmarkStats = ImportNpcJson_XPTable.getCRBenchmarkStats(String(d.cr));
                    if (benchmarkStats) {
                        let benchmarkMsg = `<b>CR ${d.cr} Benchmarks:</b><br>`;
                        benchmarkMsg += `&nbsp;&nbsp;<b>XP:</b> ${benchmarkStats.xp}<br>`;
                        benchmarkMsg += `&nbsp;&nbsp;<b>Prof Bonus:</b> +${benchmarkStats.profBonus}<br>`;
                        benchmarkMsg += `&nbsp;&nbsp;<b>AC:</b> ${benchmarkStats.ac}<br>`;
                        benchmarkMsg += `&nbsp;&nbsp;<b>HP:</b> ${benchmarkStats.hpMin}-${benchmarkStats.hpMax}<br>`;
                        benchmarkMsg += `&nbsp;&nbsp;<b>Attack Bonus:</b> +${benchmarkStats.attackBonus}<br>`;
                        benchmarkMsg += `&nbsp;&nbsp;<b>Dmg/Round:</b> ${benchmarkStats.dmgRoundMin}-${benchmarkStats.dmgRoundMax}<br>`;
                        benchmarkMsg += `&nbsp;&nbsp;<b>Save DC:</b> ${benchmarkStats.saveDC}`; 
                        w(benchmarkMsg); // Whisper to GM
                    } else {
                        ImportJSON_Utils.dbg(`Could not retrieve benchmark stats for CR ${d.cr}`);
                    }
                }

                ImportJSON_Utils.dbg("NPC build process completed in Builder module.");
                const endTime = Date.now(); // Record end time
                const duration = endTime - startTime; // Duration in milliseconds

                // If a tokenId was provided, update the token
                if (tokenId) {
                    ImportJSON_Utils.dbg(`Attempting to update token ID: ${tokenId} to represent character ID: ${char.id}`);
                    const tokenToUpdate = ImportJSON_Utils.global_getObj('graphic', tokenId);
                    if (tokenToUpdate) {
                        // Call the token finalisation function from the new Token module
                        ImportNpcJson_Token.finaliseToken(tokenToUpdate, char, d); // d is the parsed JSON (npcData)
                        ImportJSON_Utils.dbg(`Token ${tokenId} finalised for character ${d.name}.`);
                    } else {
                        ImportJSON_Utils.dbg(`Could not find token ID ${tokenId} to update.`);
                        w(`⚠️ Could not find token ID ${tokenId} to link to the imported character.`);
                    }
                }

                w(
                    `✅ Successfully imported <b>${d.name}</b> (ID: ${char.id}) in ${duration}ms. Check attacks/options. Add Lair/Spells manually. (v${scriptVersion})`,
                );
            }, 1000); // Original timeout duration
        } catch (e) {
            ImportJSON_Utils.dbg(`BUILDER ERROR: ${e.message}`);
            if (ImportJSON_Utils.global_log) {
                 ImportJSON_Utils.global_log(e.stack);
            }
            w(`❌ Import failed: ${e.message}. Check API console log.`);
        }
    }
};

// Safeguard against any old, duplicated code that might still try to call finaliseToken on the Builder object.
ImportNpcJson_Builder.finaliseToken = function(){ 
    /* Safeguard: ensure no old calls execute. Use ImportNpcJson_Token.finaliseToken */ 
    ImportJSON_Utils.dbg("Safeguard Triggered: An old reference attempted to call ImportNpcJson_Builder.finaliseToken. This indicates a potential duplicated code block. The call has been nullified. Please ensure all calls use ImportNpcJson_Token.finaliseToken."); 
};

ImportJSON_Utils.dbg("ImportNpcJson_Builder.js populated and loaded."); 