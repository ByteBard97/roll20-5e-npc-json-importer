// scripts/ImportNpcJson_ScalarAttributes.js
var ImportNpcJson_ScalarAttributes = {
    set: function(charId, d, w, findObjs, createObj, setAttributeDirect, dbg) {
        dbg("Setting scalar attributes via direct API calls...");

        // Basic Identity & Flags
        setAttributeDirect(charId, "character_name", d.name, findObjs, createObj, dbg);
        setAttributeDirect(charId, "npc_name", d.name, findObjs, createObj, dbg);
        setAttributeDirect(charId, "npc", 1, findObjs, createObj, dbg);
        // TODO: Automatically set npc_options-flag to "1" if d.legendary, d.mythic_actions, 
        // or d.lair_actions are present and d.npc_options_flag is not explicitly set to "0".
        // This would prevent the user from needing to manually set it for these cases.
        setAttributeDirect(charId, "npc_options-flag", d.npc_options_flag || "0", findObjs, createObj, dbg);
        setAttributeDirect(charId, "npc_version", "4.2.1", findObjs, createObj, dbg); // Match version from Core
        if (
            d.damage_resistances?.length ||
            d.damage_immunities?.length ||
            d.condition_immunities?.length ||
            d.legendary ||
            d.lair_actions
        ) {
            setAttributeDirect(charId, "npclogic_flag", "on", findObjs, createObj, dbg);
        }

        // Core Info
        if (d.size) setAttributeDirect(charId, "npc_size", d.size, findObjs, createObj, dbg);
        if (d.type) setAttributeDirect(charId, "npc_type", d.type, findObjs, createObj, dbg);
        if (d.alignment) setAttributeDirect(charId, "npc_alignment", d.alignment, findObjs, createObj, dbg);

        // AC/HP/Speed
        if (d.ac !== undefined) {
            if (typeof d.ac === "object") {
                setAttributeDirect(charId, "npc_ac", d.ac.value ?? "", findObjs, createObj, dbg);
                setAttributeDirect(charId, "npc_ac_notes", d.ac.notes ?? "", findObjs, createObj, dbg);
                setAttributeDirect(charId, "npc_actype", d.ac.type || d.ac.notes || "", findObjs, createObj, dbg);
            } else {
                setAttributeDirect(charId, "npc_ac", d.ac, findObjs, createObj, dbg);
                setAttributeDirect(charId, "npc_ac_notes", "", findObjs, createObj, dbg);
                setAttributeDirect(charId, "npc_actype", "", findObjs, createObj, dbg);
            }
        }
        if (d.hp !== undefined) {
            let avgHp = "",
                formula = "";
            if (typeof d.hp === "object") {
                avgHp = d.hp.average ?? "";
                formula = d.hp.formula ?? "";
            } else {
                avgHp = d.hp;
            }
            let hpAttr = findObjs({ _type: "attribute", _characterid: charId, name: "hp" })[0];
            if (!hpAttr) {
                hpAttr = createObj("attribute", { characterid: charId, name: "hp", current: avgHp, max: avgHp });
                dbg(` -> Created Attribute: hp = ${avgHp} / ${avgHp}`);
            } else {
                hpAttr.setWithWorker({ current: avgHp, max: avgHp });
                dbg(` -> Updated Attribute: hp = ${avgHp} / ${avgHp}`);
            }
            setAttributeDirect(charId, "npc_hp", avgHp, findObjs, createObj, dbg);
            setAttributeDirect(charId, "npc_hpbase", avgHp, findObjs, createObj, dbg);
            setAttributeDirect(charId, "npc_hpformula", formula, findObjs, createObj, dbg);
        }
        if (d.speed) setAttributeDirect(charId, "npc_speed", d.speed, findObjs, createObj, dbg);

        // Abilities / Saves / Skills (part of this will be handled by SheetInitializer, ensure no overlap or correct values set here)
        const abilityMap = {
            str: "strength",
            dex: "dexterity",
            con: "constitution",
            int: "intelligence",
            wis: "wisdom",
            cha: "charisma",
        };
        Object.entries(d.abilities || {}).forEach(([k, v]) => {
            const fullKey = abilityMap[k.toLowerCase()] || k;
            setAttributeDirect(charId, fullKey, v, findObjs, createObj, dbg);
            setAttributeDirect(charId, `${fullKey}_base`, v, findObjs, createObj, dbg);
        });
        
        // npc_save_ABILITY_bonus is set here. SheetInitializer will calculate flags and full roll formulas.
        Object.entries(d.saves || {}).forEach(([k, v]) =>
            setAttributeDirect(charId, `npc_save_${abilityMap[k.toLowerCase()] || k}_bonus`, v, findObjs, createObj, dbg)
        );

        // npc_SKILL_bonus, npc_SKILL (numeric), and npc_SKILL_base are set here. SheetInitializer handles flags and rolls.
        Object.entries(d.skills || {}).forEach(([skillName, skillBonusStr]) => {
            const cleanSkillName = skillName.toLowerCase().replace(/\s+/g, "");
            const numericBonus = ImportJSON_Utils.parseBonus(skillBonusStr); // Relies on a utility from ImportJSON_Utils

            setAttributeDirect(charId, `npc_${cleanSkillName}_bonus`, skillBonusStr, findObjs, createObj, dbg);
            setAttributeDirect(charId, `npc_${cleanSkillName}`, numericBonus.toString(), findObjs, createObj, dbg);
            setAttributeDirect(charId, `npc_${cleanSkillName}_base`, skillBonusStr, findObjs, createObj, dbg);
        });

        // Defenses & Misc
        if (d.damage_vulnerabilities)
            setAttributeDirect(charId, "npc_vulnerabilities", d.damage_vulnerabilities, findObjs, createObj, dbg);
        if (d.damage_resistances)
            setAttributeDirect(charId, "npc_resistances", d.damage_resistances, findObjs, createObj, dbg);
        if (d.damage_immunities)
            setAttributeDirect(charId, "npc_immunities", d.damage_immunities, findObjs, createObj, dbg);
        if (d.condition_immunities)
            setAttributeDirect(charId, "npc_condition_immunities", d.condition_immunities, findObjs, createObj, dbg);
        if (d.senses) setAttributeDirect(charId, "npc_senses", d.senses, findObjs, createObj, dbg);
        if (d.languages)
            setAttributeDirect(
                charId,
                "npc_languages",
                d.languages,
                findObjs, createObj, dbg
            );
        if (d.cr !== undefined) setAttributeDirect(charId, "npc_challenge", d.cr, findObjs, createObj, dbg);
        
        // XP: Set from lookup table based on CR, if CR is provided.
        if (d.cr !== undefined && typeof ImportNpcJson_XPTable !== 'undefined' && ImportNpcJson_XPTable.getXP) {
            const xpValue = ImportNpcJson_XPTable.getXP(String(d.cr));
            if (xpValue !== null) {
                setAttributeDirect(charId, "npc_xp", String(xpValue), findObjs, createObj, dbg);
                dbg(` -> Set Attribute: npc_xp = "${xpValue}" from XPTable based on CR: ${d.cr}`);
            } else {
                dbg(` -> WARN: CR "${d.cr}" not found in XPTable. npc_xp not set from table.`);
                // Optionally, if you still want to allow explicit XP from JSON if table lookup fails:
                // if (d.xp !== undefined) setAttributeDirect(charId, "npc_xp", String(d.xp), findObjs, createObj, dbg);
            }
        } else if (d.xp !== undefined) {
            // Fallback to explicit XP from JSON if no CR or XPTable is not available/fails, but JSON provides XP
            setAttributeDirect(charId, "npc_xp", String(d.xp), findObjs, createObj, dbg);
            dbg(` -> Set Attribute: npc_xp = "${d.xp}" directly from JSON (CR lookup failed or table unavailable).`);
        }

        // Spellcasting Ability, Level, Flag, Slots
        const spellAbilityFromJson = d.spellcasting_ability || "None";
        let spellAbilityAttrValue = "None"; // Default

        if (spellAbilityFromJson && spellAbilityFromJson.toLowerCase() !== "none" && spellAbilityFromJson.toLowerCase() !== "") {
            const abilityLc = spellAbilityFromJson.toLowerCase();
            const abilityMap = {
                "strength": "@{strength_mod}",
                "dexterity": "@{dexterity_mod}",
                "constitution": "@{constitution_mod}",
                "intelligence": "@{intelligence_mod}",
                "wisdom": "@{wisdom_mod}",
                "charisma": "@{charisma_mod}"
            };
            if (abilityMap[abilityLc]) {
                spellAbilityAttrValue = abilityMap[abilityLc] + "+"; // Sheet often uses a formula like @{ability_mod}+
            } else {
                spellAbilityAttrValue = spellAbilityFromJson; 
                dbg(`WARN: Non-standard spellcasting_ability '${spellAbilityFromJson}' provided. Using as-is. May not work as expected.`);
            }
        }

        // Try setting with setWithWorker to ensure the @{ability_mod}+ formula sticks
        let scaAttr = findObjs({ _type: "attribute", _characterid: charId, name: "spellcasting_ability" })[0];
        if (!scaAttr) {
            scaAttr = createObj("attribute", { characterid: charId, name: "spellcasting_ability", current: spellAbilityAttrValue });
            dbg(` -> Created Attribute: spellcasting_ability = ${spellAbilityAttrValue}`);
        } else {
            scaAttr.setWithWorker({ current: spellAbilityAttrValue });
            dbg(` -> Updated Attribute with Worker: spellcasting_ability = ${spellAbilityAttrValue}`);
        }

        const isSpellcaster = spellAbilityAttrValue !== "None" && spellAbilityAttrValue !== ""; // Check based on the actual value we are setting

        if (isSpellcaster) {
            setAttributeDirect(charId, "npcspellcastingflag", "1", findObjs, createObj, dbg);
            
            if (d.caster_level !== undefined) {
                setAttributeDirect(charId, "caster_level", String(d.caster_level), findObjs, createObj, dbg);
            } else {
                // Default caster_level to 0 if spellcasting is enabled but level isn't specified
                setAttributeDirect(charId, "caster_level", "0", findObjs, createObj, dbg);
            }

            if (d.spell_slots && typeof d.spell_slots === 'object') {
                for (let i = 1; i <= 9; i++) {
                    const slotKeyJson = String(i);
                    const attributeName = `lvl${i}_slots_total`;
                    if (d.spell_slots[slotKeyJson] !== undefined) {
                        setAttributeDirect(charId, attributeName, String(d.spell_slots[slotKeyJson]), findObjs, createObj, dbg);
                    } else {
                        setAttributeDirect(charId, attributeName, "0", findObjs, createObj, dbg); // Default to 0 if not in JSON for this level
                    }
                }
            } else {
                // If spellcasting is enabled but no d.spell_slots object, zero out all slots.
                for (let i = 1; i <= 9; i++) {
                    setAttributeDirect(charId, `lvl${i}_slots_total`, "0", findObjs, createObj, dbg);
                }
            }

            // Eliminated direct setting of spell_attack_bonus and spell_save_dc
            // as the sheet should calculate these based on spellcasting_ability, ability modifier, and npc_pb.
            // We ensure spellcasting_ability, caster_level, base abilities, and npc_pb (via CR or direct JSON input) are set.

        } else {
            // Not a spellcaster
            setAttributeDirect(charId, "npcspellcastingflag", "0", findObjs, createObj, dbg);
            setAttributeDirect(charId, "caster_level", "", findObjs, createObj, dbg); // Clear caster level
            for (let i = 1; i <= 9; i++) { // Clear all spell slots
                setAttributeDirect(charId, `lvl${i}_slots_total`, "0", findObjs, createObj, dbg);
            }

        }

        // Mythic Actions Flag & Main Description
        let enableMythic = "0";
        let mythicDesc = "";

        try {
            if (d.mythic_actions) {
                // Verify d.mythic_actions is an object before accessing sub-properties
                if (typeof d.mythic_actions === 'object' && d.mythic_actions !== null) {
                    const hasModernActions = d.mythic_actions.actions && Array.isArray(d.mythic_actions.actions) && d.mythic_actions.actions.length > 0;
                    const hasModernDesc = d.mythic_actions.desc && typeof d.mythic_actions.desc === 'string' && d.mythic_actions.desc.trim() !== "";

                    if (hasModernActions || hasModernDesc) {
                        enableMythic = "1";
                        mythicDesc = hasModernDesc ? d.mythic_actions.desc : "";
                        // dbg message can confirm which part triggered it if needed
                    } else {
                        dbg(" -> 'mythic_actions' object found but lacks a 'desc' string or a non-empty 'actions' array. Flag/desc not set from this object alone.");
                    }
                } else {
                    // d.mythic_actions exists but is not an object
                    dbg(` -> WARN: 'mythic_actions' field in JSON is present but not an object (type: ${typeof d.mythic_actions}). Expected an object with 'desc' and/or 'actions' properties as per JSON_STRUCTURE.md.`);
                    w(`⚠️ The 'mythic_actions' field in your JSON is not structured as an object (found type: ${typeof d.mythic_actions}). Mythic description and flag might not be set correctly. Please refer to JSON_STRUCTURE.md.`);
                }
            }

            // Fallback for deprecated 'mythic_actions_description'
            // This applies if 'enableMythic' wasn't set by the modern structure, or if d.mythic_actions wasn't present.
            if (enableMythic !== "1" && d.mythic_actions_description && typeof d.mythic_actions_description === 'string' && d.mythic_actions_description.trim() !== "") {
                enableMythic = "1";
                mythicDesc = d.mythic_actions_description;
                dbg(" -> Using deprecated 'mythic_actions_description' as primary source for mythic description and to enable flag because modern 'mythic_actions' object did not provide sufficient data or was missing/malformed.");
            }
        } catch (error) {
            dbg(`ERROR processing mythic_actions in ScalarAttributes: ${error.message}. Stack: ${error.stack}`);
            w(`❌ An error occurred while processing the 'mythic_actions' data in your JSON: "${error.message}". Mythic actions description and flag will use default values. Please check your JSON structure.`);
            // Reset to defaults in case of error during processing
            enableMythic = "0";
            mythicDesc = "";
        }

        setAttributeDirect(charId, "npc_mythic_actions", enableMythic, findObjs, createObj, dbg);
        if (mythicDesc.trim() !== "") {
            setAttributeDirect(charId, "npc_mythic_actions_desc", mythicDesc, findObjs, createObj, dbg);
        } else if (enableMythic === "1") {
            // If mythic actions are enabled (e.g., by presence of action items but no overall desc from modern structure, or via deprecated field)
            // ensure the description field is at least blanked if not explicitly provided or cleared by an error.
            setAttributeDirect(charId, "npc_mythic_actions_desc", "", findObjs, createObj, dbg);
        }

        // Initiative Dex Tiebreaker
        setAttributeDirect(charId, "init_tiebreaker", d.init_tiebreaker !== undefined ? d.init_tiebreaker : "0", findObjs, createObj, dbg);

        // Legendary Actions Count & Lair Actions Description (actual actions handled in RepeatingSections)
        if (d.legendary && d.legendary.count !== undefined) {
            setAttributeDirect(charId, "npc_legendary_actions", d.legendary.count, findObjs, createObj, dbg);
        }
        if (d.lair_actions && d.lair_actions.desc !== undefined) {
            setAttributeDirect(charId, "npc_lair_actions", d.lair_actions.desc, findObjs, createObj, dbg);
        }

        // Proficiency Bonus from JSON (d.pb) - SheetInitializer calculates if not present
        if (d.pb !== undefined) {
            let pbString = d.pb.toString();
            if (!pbString.startsWith('+') && !pbString.startsWith('-')) {
                const pbNumericAttempt = parseInt(pbString, 10);
                if (!isNaN(pbNumericAttempt) && pbNumericAttempt >= 0) {
                    pbString = `+${pbNumericAttempt}`;
                }
            }
            setAttributeDirect(charId, "npc_pb", pbString, findObjs, createObj, dbg);
            dbg(` -> Set Attribute: npc_pb = "${pbString}" from JSON (used by SheetInitializer if present)`);
        }

        setAttributeDirect(charId, "dtype", "full", findObjs, createObj, dbg); // For Auto Roll Damage & Crit
        dbg(" -> Set dtype = \"full\" for Auto Roll Damage & Crit");

        // Flags for Bonus Actions and Reactions sections visibility
        if (d.bonus_actions && d.bonus_actions.length > 0) {
            setAttributeDirect(charId, "npcbonusactionsflag", "1", findObjs, createObj, dbg);
        } else {
            setAttributeDirect(charId, "npcbonusactionsflag", "0", findObjs, createObj, dbg);
        }

        if (d.reactions && d.reactions.length > 0) {
            setAttributeDirect(charId, "npcreactionsflag", "1", findObjs, createObj, dbg);
        } else {
            setAttributeDirect(charId, "npcreactionsflag", "0", findObjs, createObj, dbg);
        }
        
        setAttributeDirect(charId, "charactersheet_type", "npc", findObjs, createObj, dbg);

        // Set base ability mods (strength_mod, dexterity_mod, etc.)
        // This is also done in SheetInitializer, but setting here ensures they exist if SheetInitializer relies on them early.
        // SheetInitializer will recalculate and set them definitively.
        const abilityShortMap = {
            "strength": d.abilities?.str || 10,
            "dexterity": d.abilities?.dex || 10,
            "constitution": d.abilities?.con || 10,
            "intelligence": d.abilities?.int || 10,
            "wisdom": d.abilities?.wis || 10,
            "charisma": d.abilities?.cha || 10
        };

        Object.entries(abilityShortMap).forEach(([abilityFullName, score]) => {
            const numericScore = parseInt(score, 10);
            const mod = Math.floor((numericScore - 10) / 2);
            // Only set if not already handled by the earlier ability loop to avoid duplicate dbg messages
            // However, SheetInitializer is the final authority for _mod attributes.
            // We ensure _base and the raw score (e.g. "strength") are set from d.abilities.
            // SheetInitializer will then correctly calculate and set "strength_mod".
            // So, we can remove setting _mod here to avoid confusion.
            // setAttributeDirect(charId, `${abilityFullName}_mod`, mod.toString(), findObjs, createObj, dbg);
            // dbg(` -> Pre-set ${abilityFullName}_mod = "${mod}" (SheetInitializer will finalize)`);
        });

        dbg("Scalar attributes setting process completed in ScalarAttributes module.");
    }
};

ImportJSON_Utils.dbg("ImportNpcJson_ScalarAttributes.js populated and loaded.");