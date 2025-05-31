// scripts/ImportNpcJson_SheetInitializer.js
const ImportNpcJson_SheetInitializer = {
    initialize: function(charId, jsonData, w, findObjs_func, setAttributeDirect_func) {
        // The setAttributeDirect_func passed here is the adapter from Core.js (setAttributeDirectForInit)
        // or later, it will be ImportJSON_Utils.setAttributeDirect directly if jsonData and w are also passed to it.
        const setAttributeDirect = setAttributeDirect_func;
        const findObjs = findObjs_func; // This is ImportJSON_Utils.global_findObjs

        // For logging within this module, we use ImportJSON_Utils.dbg directly
        const dbg = ImportJSON_Utils.dbg;

        setAttributeDirect(charId, "l1mancer_status", ""); // Set to empty first
        setAttributeDirect(charId, "version", "4.2.1");
        setAttributeDirect(charId, "sheet_version", "1");
        
        const abilitiesToProcess = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"];
        const abilityShortToLong = {
            "str": "strength", "dex": "dexterity", "con": "constitution",
            "int": "intelligence", "wis": "wisdom", "cha": "charisma"
        };
        let calculatedSavingFlagBits = 0;

        let proficiencyBonus;
        const npcPbAttr = findObjs({ _type: "attribute", _characterid: charId, name: "npc_pb" })[0];

        if (npcPbAttr && npcPbAttr.get("current") !== "") {
            const pbString = npcPbAttr.get("current");
            proficiencyBonus = ImportJSON_Utils.parseBonus(pbString);
            if (!isNaN(proficiencyBonus)) {
                dbg(`Using Proficiency Bonus from npc_pb attribute: ${proficiencyBonus} (from "${pbString}")`);
                // If using npc_pb, set pb_type to custom and store the value in pb and pb_custom
                setAttributeDirect(charId, "pb_type", "custom");
                setAttributeDirect(charId, "pb", proficiencyBonus.toString());
                setAttributeDirect(charId, "pb_custom", proficiencyBonus.toString());
                dbg(` -> Set pb_type=custom, pb=${proficiencyBonus}, pb_custom=${proficiencyBonus} due to npc_pb.`);
            } else {
                dbg(`Invalid npc_pb value "${pbString}". Calculating PB from CR.`);
                proficiencyBonus = null; // Force recalculation
            }
        } else {
            proficiencyBonus = null; // npc_pb not found or empty, so calculate from CR
        }

        if (proficiencyBonus === null) {
            dbg(`npc_pb attribute not found/empty or invalid. Calculating PB from CR.`);
            const d_cr = jsonData.cr !== undefined ? jsonData.cr.toString() : "0"; 

            proficiencyBonus = 2; // Default PB
            if (d_cr) {
                try {
                    let crNum;
                    if (d_cr.includes('/')) {
                        const parts = d_cr.split('/');
                        crNum = parseFloat(parts[0]) / parseFloat(parts[1]);
                    } else {
                        crNum = parseFloat(d_cr);
                    }
                    if (!isNaN(crNum)) {
                        if (crNum >= 17) proficiencyBonus = 6;
                        else if (crNum >= 13) proficiencyBonus = 5;
                        else if (crNum >= 9) proficiencyBonus = 4;
                        else if (crNum >= 5) proficiencyBonus = 3;
                        // Default is 2 for CR 0-4
                    }
                } catch (e) {
                    dbg(`Error parsing CR '${d_cr}': ${e.message}. Defaulting PB to 2.`);
                    proficiencyBonus = 2;
                }
            }
            const pbString = proficiencyBonus >= 0 ? `+${proficiencyBonus}` : `${proficiencyBonus}`;
            // Set npc_pb, and also pb, pb_type, pb_custom
            setAttributeDirect(charId, "npc_pb", pbString);
            setAttributeDirect(charId, "pb_type", "cr"); // PB is derived from CR
            setAttributeDirect(charId, "pb", proficiencyBonus.toString());
            setAttributeDirect(charId, "pb_custom", proficiencyBonus.toString()); // Often mirrors pb
            dbg(`Set npc_pb=${pbString}, pb_type=cr, pb=${proficiencyBonus}, pb_custom=${proficiencyBonus} from CR calculation.`);
        }
        dbg(`Final Proficiency Bonus (numeric): ${proficiencyBonus}`);

        abilitiesToProcess.forEach((abilityLongName, index) => {
            const abilityShortName = Object.keys(abilityShortToLong).find(key => abilityShortToLong[key] === abilityLongName);
            const baseStatValue = (jsonData.abilities && jsonData.abilities[abilityShortName]) ? jsonData.abilities[abilityShortName].toString() : "10";
            const mod = Math.floor((parseInt(baseStatValue) - 10) / 2);
            setAttributeDirect(charId, `${abilityLongName}_mod`, mod.toString());
            dbg(` -> Set ${abilityLongName}_mod = "${mod.toString()}"`);

            const jsonSaveBonusStr = (jsonData.saves && jsonData.saves[abilityShortName]) ? jsonData.saves[abilityShortName] : undefined;
            let finalSaveBonusNumeric;
            let saveFlagValue = "0";
            if (jsonSaveBonusStr !== undefined) {
                finalSaveBonusNumeric = ImportJSON_Utils.parseBonus(jsonSaveBonusStr);
                if (finalSaveBonusNumeric === mod) saveFlagValue = "0";
                else if (finalSaveBonusNumeric === (mod + proficiencyBonus)) saveFlagValue = "1";
                else saveFlagValue = "2";
            } else {
                finalSaveBonusNumeric = mod;
                saveFlagValue = "0";
            }
            if (saveFlagValue !== "0") calculatedSavingFlagBits += Math.pow(2, index);
            const saveBonusDisplayString = finalSaveBonusNumeric >= 0 ? `+${finalSaveBonusNumeric}` : `${finalSaveBonusNumeric}`;
            setAttributeDirect(charId, `${abilityLongName}_save_bonus`, finalSaveBonusNumeric.toString());
            setAttributeDirect(charId, `npc_${abilityShortName}_save`, finalSaveBonusNumeric.toString());
            setAttributeDirect(charId, `npc_${abilityShortName}_save_base`, saveBonusDisplayString);
            setAttributeDirect(charId, `npc_${abilityShortName}_save_flag`, saveFlagValue);
            setAttributeDirect(charId, `npc_${abilityLongName}_save`, finalSaveBonusNumeric.toString()); // Redundant with npc_short_save but often present
            setAttributeDirect(charId, `npc_${abilityLongName}_save_base`, saveBonusDisplayString);
            setAttributeDirect(charId, `npc_${abilityLongName}_save_flag`, saveFlagValue);
            setAttributeDirect(charId, `${abilityLongName}_save_roll`, 
                `@{wtype}&{template:simple} {{rname=^{${abilityLongName}-save-u}}} {{mod=@{${abilityLongName}_save_bonus}}} {{r1=[[@{d20}+@{${abilityLongName}_save_bonus}@{pbd_safe}]]}} @{advantagetoggle}+@{${abilityLongName}_save_bonus}@{pbd_safe}]]}} {{global=@{global_save_mod}}} @{charname_output}`
            );
            dbg(` -> ${abilityLongName} Save: Bonus=${finalSaveBonusNumeric}, Flag=${saveFlagValue}, Base=${saveBonusDisplayString}`);
        });
        setAttributeDirect(charId, "npc_saving_flag", calculatedSavingFlagBits.toString()); 
        dbg(` -> Set Attribute: npc_saving_flag = "${calculatedSavingFlagBits.toString()}"`);
        
        if (jsonData.skills && Object.keys(jsonData.skills).length > 0) {
            setAttributeDirect(charId, "npc_skills_flag", "1"); 
            dbg(" -> Set Attribute: npc_skills_flag = \"1\"");
        } else {
            setAttributeDirect(charId, "npc_skills_flag", "0");
            dbg(" -> Set Attribute: npc_skills_flag = \"0\"");
        }

        const skillsMap = {
            "acrobatics": "dexterity", "animal_handling": "wisdom", "arcana": "intelligence",
            "athletics": "strength", "deception": "charisma", "history": "intelligence",
            "insight": "wisdom", "intimidation": "charisma", "investigation": "intelligence",
            "medicine": "wisdom", "nature": "intelligence", "perception": "wisdom",
            "performance": "charisma", "persuasion": "charisma", "religion": "intelligence",
            "sleight_of_hand": "dexterity", "stealth": "dexterity", "survival": "wisdom"
        };
        
        Object.entries(skillsMap).forEach(([skillName, abilityName]) => {
            const cleanSkillName = skillName.toLowerCase().replace(/\s+/g, "");
            const abilityModAttr = findObjs({ _type: "attribute", _characterid: charId, name: `${abilityName}_mod` })[0];
            const abilityMod = abilityModAttr ? parseInt(abilityModAttr.get("current"), 10) : 0;
            const jsonSkillBonusStr = jsonData.skills ? jsonData.skills[skillName] || jsonData.skills[cleanSkillName] : undefined;
            let finalSkillBonus;
            let skillFlag = "0";
            if (jsonSkillBonusStr !== undefined) {
                finalSkillBonus = ImportJSON_Utils.parseBonus(jsonSkillBonusStr);
                if (finalSkillBonus !== abilityMod) skillFlag = "1"; // Proficient if bonus > ability mod
            } else {
                finalSkillBonus = abilityMod; // Not proficient, bonus is just ability mod
            }
            setAttributeDirect(charId, `${cleanSkillName}_bonus`, finalSkillBonus.toString());
            setAttributeDirect(charId, `npc_${cleanSkillName}_flag`, skillFlag);
            // ScalarAttributes sets npc_SKILL and npc_SKILL_base. SheetInitializer sets _bonus and _flag.
            // We can also set the roll formula here for completeness, though it might be redundant if character sheet does it.
            setAttributeDirect(charId, `${cleanSkillName}_roll`,
                `@{wtype}&{template:simple} {{rname=^{${cleanSkillName}-u}}} {{mod=@{${cleanSkillName}_bonus}}} {{r1=[[@{d20}+@{${cleanSkillName}_bonus}@{pbd_safe}]]}} @{advantagetoggle}+@{${cleanSkillName}_bonus}@{pbd_safe}]]}} {{global=@{global_skill_mod}}} @{charname_output}`
            );
        });
        
        const dexModAttr = findObjs({ _type: "attribute", _characterid: charId, name: "dexterity_mod" })[0];
        const dexMod = dexModAttr ? dexModAttr.get("current") : "0";
        const wisModAttr = findObjs({ _type: "attribute", _characterid: charId, name: "wisdom_mod" })[0];
        const wisMod = wisModAttr ? wisModAttr.get("current") : "0";
        setAttributeDirect(charId, "initiative_bonus", dexMod);
        const perceptionBonusAttr = findObjs({ _type: "attribute", _characterid: charId, name: "perception_bonus"})[0];
        const perceptionBonus = perceptionBonusAttr ? parseInt(perceptionBonusAttr.get("current"), 10) : parseInt(wisMod, 10);
        setAttributeDirect(charId, "passive_wisdom", `${10 + perceptionBonus}`);
        
        // These are placeholders or might be calculated by the sheet based on spellcasting_ability etc.
        // We confirmed earlier that explicitly setting these to 0 if not a spellcaster or letting sheet calculate is better.
        // setAttributeDirect(charId, "spell_attack_bonus", "0"); 
        // setAttributeDirect(charId, "spell_save_dc", "0");

        setAttributeDirect(charId, "charname_output", `{{charname=@{${jsonData.name ? "npc_name" : "character_name"}}}}`); 
        setAttributeDirect(charId, "l1mancer_status", "completed"); 
        dbg('Character sheet initialization attributes set.');

        // Optional/default attributes
        setAttributeDirect(charId, "armorwarningflag", "hide");
        setAttributeDirect(charId, "customacwarningflag", "hide");
        setAttributeDirect(charId, "filter_traits_by", "");
        setAttributeDirect(charId, "invalidXP", "0"); // XP is handled by ScalarAttributes now
        setAttributeDirect(charId, "is_vehicle", "0");
        setAttributeDirect(charId, "showleveler", "0");
        setAttributeDirect(charId, "ui_flags", "");
        setAttributeDirect(charId, "other_tool", "");

        dbg('SheetInitializer: Initialization complete.');
    }
};

ImportJSON_Utils.dbg("ImportNpcJson_SheetInitializer.js populated and loaded."); 