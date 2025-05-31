// scripts/ImportNpcJson_RepeatingSections.js
const ImportNpcJson_RepeatingSections = {
    processAll: function(charId, d, utils) {
        // utils is expected to be an object containing all necessary utility functions:
        // { w, findObjs, createObj, setAttributeDirect, createLinkedAbility, genRowID, dbg, parseBonus, getDice, calculateAverage }
        const { w, findObjs, createObj, setAttributeDirect, createLinkedAbility, genRowID, dbg, parseBonus, getDice, calculateAverage } = utils;

        dbg("Processing repeating sections...");
        const rowIdTrackers = {
            traits: [],
            actions: [],
            legendary_actions: [],
            mythic_actions: [],
            bonus_actions: [],
            reactions: []
        };

        // --- Generic Action Processor (used by actions, legendary, mythic) ---
        const processAction = (action, sectionName, trackingArray) => {
            const rowId = genRowID();
            trackingArray.push(rowId);
            dbg(`Adding action to ${sectionName}: repeating_${sectionName}_${rowId}`);
            let actionDisplayName = action.name;
            let originalName = action.name;
            if (sectionName === "npcaction-l" || sectionName === "npcaction-m") {
                if (action.cost !== undefined) {
                    const cost = parseInt(action.cost, 10);
                    if (!isNaN(cost) && cost > 1) {
                        if (!actionDisplayName.toLowerCase().includes(`(costs ${cost} action`)) {
                             actionDisplayName += ` (Costs ${cost} Actions)`;
                        }
                    }
                }
            }
            const baseAttrs = { "attack_crit": "", "attack_crit2": "", "attack_onhit": "", "attack_tohitrange": "+0", "damage_flag": "", "description": action.desc || "", "name": actionDisplayName };
            let isAttack = false;
            if (action.attack) {
                isAttack = true;
                const tohitBonus = parseBonus(action.attack.tohit);
                baseAttrs.attack_tohit = tohitBonus.toString();
                baseAttrs.attack_damage = action.attack.dmg1 || "";
                baseAttrs.attack_damagetype = action.attack.type1 || "";
                baseAttrs.attack_crit = getDice(action.attack.dmg1) || "";
                baseAttrs.attack_flag = "on";
                const tohitString = tohitBonus >= 0 ? `+${tohitBonus}` : `${tohitBonus}`;
                let tohitRange = tohitString;
                let attackDistanceValue = undefined;
                if (action.attack.distance !== undefined) { attackDistanceValue = action.attack.distance; }
                else if (action.attack.range !== undefined) { attackDistanceValue = action.attack.range; }
                else if (action.attack.reach !== undefined) { attackDistanceValue = action.attack.reach; }
                if (attackDistanceValue !== undefined) {
                    if (action.attack.type && action.attack.type.toLowerCase().includes("ranged")) { tohitRange += `, Range ${attackDistanceValue}`; }
                    else if (action.attack.type && action.attack.type.toLowerCase().includes("melee")) { tohitRange += `, Reach ${attackDistanceValue}`; }
                    else { tohitRange += `, ${attackDistanceValue}`; }
                    baseAttrs.attack_range = attackDistanceValue;
                }
                if (action.attack.target) { tohitRange += `, ${action.attack.target}`; baseAttrs.attack_target = action.attack.target; }
                baseAttrs.attack_tohitrange = tohitRange;
                const avg1 = calculateAverage(baseAttrs.attack_damage);
                baseAttrs.attack_onhit = `${avg1} (${baseAttrs.attack_damage}) ${baseAttrs.attack_damagetype} damage`;
                if (action.attack.dmg2) {
                    baseAttrs.attack_damage2 = action.attack.dmg2;
                    baseAttrs.attack_damagetype2 = action.attack.type2 || "";
                    baseAttrs.attack_crit2 = getDice(action.attack.dmg2) || "";
                    const avg2 = calculateAverage(baseAttrs.attack_damage2);
                    baseAttrs.attack_onhit = `${avg1} (${baseAttrs.attack_damage}) ${baseAttrs.attack_damagetype} damage plus ${avg2} (${baseAttrs.attack_damage2}) ${baseAttrs.attack_damagetype2} damage`;
                }
                baseAttrs.damage_flag = `{{damage=1}} {{dmg1flag=1}}${baseAttrs.attack_damage2 ? " {{dmg2flag=1}}" : ""} `;
                if (action.attack.type) baseAttrs.attack_type = action.attack.type;
                baseAttrs.attack_display_flag = "{{attack=1}}"; baseAttrs.attack_options = "{{attack=1}}"; baseAttrs["npc_options-flag"] = "0";
            }
            Object.entries(baseAttrs).forEach(([key, value]) => {
                if (value !== undefined && value !== null) { createObj("attribute", { _characterid: charId, name: `repeating_${sectionName}_${rowId}_${key}`, current: value.toString() }); }
            });
            setAttributeDirect(charId, `repeating_${sectionName}_${rowId}_show_desc`, "1", findObjs, createObj, dbg);
            let rollbase;
            if (isAttack) {
                rollbase = "@{wtype}&{template:npcfullatk} {{attack=1}} @{damage_flag} @{npc_name_flag} {{rname=@{name}}}";
                rollbase += " {{r1=[[@{d20}+(@{attack_tohit}+0)]]}} @{rtype}+(@{attack_tohit}+0)]]}}";
                rollbase += " {{dmg1=[[@{attack_damage}+0]]}} {{dmg1type=@{attack_damagetype}}}";
                if (baseAttrs.attack_damage2) { rollbase += " {{dmg2=[[@{attack_damage2}+0]]}} {{dmg2type=@{attack_damagetype2}}}"; }
                rollbase += " {{crit1=[[@{attack_crit}+0]]}}";
                if (baseAttrs.attack_crit2) { rollbase += " {{crit2=[[@{attack_crit2}+0]]}}"; }
                rollbase += " {{description=@{show_desc}}} @{charname_output}";
            } else { rollbase = "@{wtype}&{template:npcaction} @{npc_name_flag} {{rname=@{name}}} {{description=@{show_desc}}} @{charname_output}"; }
            createObj("attribute", { _characterid: charId, name: `repeating_${sectionName}_${rowId}_rollbase`, current: rollbase });
            const abilityMacro = `%{${charId}|repeating_${sectionName}_${rowId}_rollbase}`;
            createLinkedAbility(charId, originalName, action.desc, abilityMacro, createObj, dbg, true);
        };

        // --- Bonus Action Processor ---
        const processBonusAction = (action, sectionName, trackingArray) => {
            const rowId = genRowID();
            trackingArray.push(rowId); 
            dbg(`Adding bonus action: repeating_npcbonusaction_${rowId}`);
            const regularAttrs = { "attack_crit": "", "attack_crit2": "", "attack_onhit": "", "attack_tohitrange": "+0", "damage_flag": "", "description": action.desc || "", "name": action.name };
            Object.entries(regularAttrs).forEach(([key, value]) => { createObj("attribute", { _characterid: charId, name: `repeating_npcbonusaction_${rowId}_${key}`, current: value }); });
            const wpAttrs = { "wp_attack_crit": "", "wp_attack_crit2": "", "wp_attack_onhit": "", "wp_attack_tohitrange": "+0", "wp_damage_flag": "", "wp_description": action.desc || "", "wp_name": action.name };
            Object.entries(wpAttrs).forEach(([key, value]) => { createObj("attribute", { _characterid: charId, name: `repeating_npcbonusaction_${rowId}_${key}`, current: value }); });
            setAttributeDirect(charId, `repeating_npcbonusaction_${rowId}_show_desc`, "1", findObjs, createObj, dbg);
            const rollbase = "@{wtype}&{template:npcaction} @{npc_name_flag} {{rname=@{name}}} {{description=@{show_desc}}} @{charname_output}";
            const wpRollbase = "@{wtype}&{template:npcaction} @{npc_name_flag} {{rname=@{wp_name}}} {{description=@{show_desc}}} @{charname_output}";
            createObj("attribute", { _characterid: charId, name: `repeating_npcbonusaction_${rowId}_rollbase`, current: rollbase });
            createObj("attribute", { _characterid: charId, name: `repeating_npcbonusaction_${rowId}_wp_rollbase`, current: wpRollbase });
            const abilityMacro = `%{${charId}|repeating_npcbonusaction_${rowId}_wp_rollbase}`;
            createLinkedAbility(charId, action.name, action.desc, abilityMacro, createObj, dbg, true);
        };
        
        // --- Reaction Processor ---
        const processReaction = (reaction, sectionName, trackingArray) => {
            const rowId = genRowID();
            trackingArray.push(rowId); 
            dbg(`Adding reaction: repeating_npcreaction_${rowId}`);
            createObj("attribute", { _characterid: charId, name: `repeating_npcreaction_${rowId}_name`, current: reaction.name });
            const descValue = reaction.desc || "";
            const descAttr = createObj("attribute", { _characterid: charId, name: `repeating_npcreaction_${rowId}_desc`, current: descValue });
            if (descAttr && typeof descAttr.setWithWorker === 'function') { descAttr.setWithWorker({ current: descValue }); }
            else { dbg(`ERROR: Failed to create/setWithWorker reaction desc for repeating_npcreaction_${rowId}_desc`); }
            const rollbase = "@{wtype}&{template:npcaction} @{npc_name_flag} {{rname=@{name}}} {{description=@{show_desc}}} @{charname_output}";
            createObj("attribute", { _characterid: charId, name: `repeating_npcreaction_${rowId}_rollbase`, current: rollbase });
            const abilityMacro = `%{${charId}|repeating_npcreaction_${rowId}_rollbase}`;
            createLinkedAbility(charId, reaction.name, reaction.desc, abilityMacro, createObj, dbg, true);
        };

        // --- Process Traits ---
        try {
            if (d.traits !== undefined && !Array.isArray(d.traits)) {
                dbg("WARN: d.traits in JSON is not an array. Skipping traits processing.");
                w("⚠️ NPC JSON 'traits' section is not an array and will be skipped. Please ensure 'traits' is an array of trait objects.");
            } else if (d.traits && d.traits.length > 0) {
                dbg(`Processing ${d.traits.length} trait(s)...`);
                (d.traits || []).forEach((trait) => { // Default to [] just in case, though Array.isArray was checked
                    const rowId = genRowID();
                    rowIdTrackers.traits.push(rowId);
                    dbg(`Adding trait: repeating_npctrait_${rowId}`);
                    createObj("attribute", { _characterid: charId, name: `repeating_npctrait_${rowId}_name`, current: trait.name });
                    const descValue = trait.desc || "";
                    const descAttr = createObj("attribute", { _characterid: charId, name: `repeating_npctrait_${rowId}_desc`, current: descValue });
                    if (descAttr && typeof descAttr.setWithWorker === 'function') {
                        descAttr.setWithWorker({ current: descValue });
                        dbg(`Created and called setWithWorker on trait desc: repeating_npctrait_${rowId}_desc`);
                    } else {
                        dbg(`ERROR: Failed to create trait desc or call setWithWorker for repeating_npctrait_${rowId}_desc`);
                    }
                });
            }
        } catch (error) {
            dbg(`ERROR processing Traits section: ${error.message}. Stack: ${error.stack}`);
            w(`❌ An error occurred while processing the 'Traits' section: "${error.message}". This section may be incomplete. Please check your JSON.`);
        }

        // --- Process Actions ---
        try {
            if (d.actions !== undefined && !Array.isArray(d.actions)) {
                dbg("WARN: d.actions in JSON is not an array. Skipping actions processing.");
                w("⚠️ NPC JSON 'actions' section is not an array and will be skipped. Please ensure 'actions' is an array of action objects.");
            } else if (d.actions && d.actions.length > 0) {
                dbg(`Processing ${d.actions.length} action(s)...`);
                (d.actions || []).forEach(action => processAction(action, "npcaction", rowIdTrackers.actions));
            }
        } catch (error) {
            dbg(`ERROR processing Actions section: ${error.message}. Stack: ${error.stack}`);
            w(`❌ An error occurred while processing the 'Actions' section: "${error.message}". This section may be incomplete. Please check your JSON.`);
        }

        // --- Process Legendary Actions ---
        try {
            let legendaryActionsArray = [];
            if (d.legendary && typeof d.legendary === 'object') {
                if (d.legendary.actions !== undefined && !Array.isArray(d.legendary.actions)) {
                    dbg("WARN: d.legendary.actions in JSON is not an array. Skipping legendary actions processing.");
                    w("⚠️ NPC JSON 'legendary.actions' section is not an array and will be skipped. Please ensure it's an array of action objects.");
                } else {
                    legendaryActionsArray = d.legendary.actions || [];
                }
            } else if (d.legendary) { // d.legendary exists but is not an object
                 dbg("WARN: d.legendary in JSON is not an object. Skipping legendary actions processing.");
                 w("⚠️ NPC JSON 'legendary' section is not an object. Legendary actions will be skipped.");
            }
            
            if (legendaryActionsArray.length > 0) {
                dbg(`Processing ${legendaryActionsArray.length} legendary action(s)...`);
                legendaryActionsArray.forEach(action => processAction(action, "npcaction-l", rowIdTrackers.legendary_actions));
            }
        } catch (error) {
            dbg(`ERROR processing Legendary Actions section: ${error.message}. Stack: ${error.stack}`);
            w(`❌ An error occurred while processing the 'Legendary Actions' section: "${error.message}". This section may be incomplete. Please check your JSON.`);
        }
        
        // --- Process Mythic Actions --- (already improved, now wrapped in try-catch)
        try {
            if (d.mythic_actions && typeof d.mythic_actions === 'object' && d.mythic_actions.actions) {
                if (!Array.isArray(d.mythic_actions.actions)) {
                    dbg(`WARN: 'd.mythic_actions.actions' in JSON is not an array (type: ${typeof d.mythic_actions.actions}). Skipping mythic actions.`);
                    w(`⚠️ NPC JSON 'mythic_actions.actions' is not an array. Mythic actions will be skipped.`);
                } else if (d.mythic_actions.actions.length > 0) {
                    dbg(`Processing ${d.mythic_actions.actions.length} mythic action(s) from object structure...`);
                    d.mythic_actions.actions.forEach(action => processAction(action, "npcaction-m", rowIdTrackers.mythic_actions));
                }
            } else if (d.mythic_actions && Array.isArray(d.mythic_actions)) { // Fallback for old format
                ImportJSON_Utils.dbg("Warning: d.mythic_actions was an array (old format). Expected an object with a nested 'actions' array. Processing as simple array.");
                w(`⚠️ JSON data for 'Mythic Actions' is in an old array format. Please update to use { "desc": "...", "actions": [...] }.`);
                if (d.mythic_actions.length > 0) {
                    dbg(`Processing ${d.mythic_actions.length} mythic action(s) from old array format...`);
                    d.mythic_actions.forEach(action => processAction(action, "npcaction-m", rowIdTrackers.mythic_actions));
                }
            } else if (d.mythic_actions){ // d.mythic_actions exists but is not an object or not structured correctly
                 dbg(`WARN: 'd.mythic_actions' is present but not an object with an 'actions' array, nor a simple array. Type: ${typeof d.mythic_actions}. Skipping mythic actions.`);
                 w(`⚠️ JSON data for 'Mythic Actions' is not structured correctly and will be skipped.`);
            }
        } catch (error) {
            dbg(`ERROR processing Mythic Actions section: ${error.message}. Stack: ${error.stack}`);
            w(`❌ An error occurred while processing the 'Mythic Actions' section: "${error.message}". This section may be incomplete. Please check your JSON.`);
        }

        // --- Process Bonus Actions ---
        try {
            if (d.bonus_actions !== undefined && !Array.isArray(d.bonus_actions)) {
                dbg("WARN: d.bonus_actions in JSON is not an array. Skipping bonus_actions processing.");
                w("⚠️ NPC JSON 'bonus_actions' section is not an array and will be skipped. Please ensure 'bonus_actions' is an array of action objects.");
            } else if (d.bonus_actions && d.bonus_actions.length > 0) {
                dbg(`Processing ${d.bonus_actions.length} bonus action(s)...`);
                (d.bonus_actions || []).forEach(action => processBonusAction(action, "npcbonusaction", rowIdTrackers.bonus_actions));
            }
        } catch (error) {
            dbg(`ERROR processing Bonus Actions section: ${error.message}. Stack: ${error.stack}`);
            w(`❌ An error occurred while processing the 'Bonus Actions' section: "${error.message}". This section may be incomplete. Please check your JSON.`);
        }

        // --- Process Reactions ---
        try {
            if (d.reactions !== undefined && !Array.isArray(d.reactions)) {
                dbg("WARN: d.reactions in JSON is not an array. Skipping reactions processing.");
                w("⚠️ NPC JSON 'reactions' section is not an array and will be skipped. Please ensure 'reactions' is an array of action objects.");
            } else if (d.reactions && d.reactions.length > 0) {
                dbg(`Processing ${d.reactions.length} reaction(s)...`);
                (d.reactions || []).forEach(reaction => processReaction(reaction, "npcreaction", rowIdTrackers.reactions));
            }
        } catch (error) {
            dbg(`ERROR processing Reactions section: ${error.message}. Stack: ${error.stack}`);
            w(`❌ An error occurred while processing the 'Reactions' section: "${error.message}". This section may be incomplete. Please check your JSON.`);
        }
        
        // Update _reporder attributes
        // This part should be outside the try-catch blocks for individual sections,
        // as it finalizes reporders based on successfully processed items.
        try {
            Object.keys(rowIdTrackers).forEach(trackerKey => {
                const sectionNameForReporder = trackerKey === "legendary_actions" ? "npcaction-l" :
                                              trackerKey === "mythic_actions" ? "npcaction-m" :
                                              trackerKey === "bonus_actions" ? "npcbonusaction" :
                                              trackerKey === "reactions" ? "npcreaction" :
                                              trackerKey === "actions" ? "npcaction" :
                                              `npc${trackerKey.slice(0, -1)}`; // e.g. npctrait from traits
                if (rowIdTrackers[trackerKey].length > 0) { // Only set if there are items
                    setAttributeDirect(charId, `_reporder_repeating_${sectionNameForReporder}`, rowIdTrackers[trackerKey].join(','), findObjs, createObj, dbg);
                }
            });
        } catch (error) {
            dbg(`ERROR updating _reporder attributes: ${error.message}. Stack: ${error.stack}`);
            w(`❌ An error occurred while finalizing repeating section order. Some sections might not appear correctly.`);
        }

        dbg("Repeating sections processing completed.");
    }
};

ImportJSON_Utils.dbg("ImportNpcJson_RepeatingSections.js populated and loaded.");
