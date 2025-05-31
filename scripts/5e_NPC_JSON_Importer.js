// 5e NPC JSON Importer - Generated Sat May 31 01:57:11 PM EDT 2025
// Main script file. Contains all necessary modules.
// Load Order:
(() => { // Start of IIFE wrapper for the entire bundle
"use strict";
// ===== npc_importer_modules/ImportNpcJson_Utils.js =====
/* Source: npc_importer_modules/ImportNpcJson_Utils.js */
// ImportNpcJson_Utils.js
// Establishes the ImportJSON_Utils namespace for helper functions and constants.

const ImportJSON_Utils = {
    DEBUG: true, // Set false to reduce console noise
    DEFAULT_CREATOR: "",

    // Placeholder for Roll20 API functions - to be populated by Core.js on("ready")
    global_findObjs: null,
    global_createObj: null,
    global_log: null,
    global_sendChat: null,
    global_generateRowID: null,
    global_getAttrByName: null,
    global_on: null,

    genRowID: function() {
        // Try to use native function if available
        if (typeof ImportJSON_Utils.global_generateRowID === "function") {
            return ImportJSON_Utils.global_generateRowID();
        }
        // Otherwise generate Roll20-style ID (exactly 20 chars: 1 dash + 19 random chars)
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let result = "-";
        for (let i = 0; i < 19; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    },

    dbg: function(...a) {
      // Use global_log if available, otherwise fallback to console.log for broader compatibility if used outside Roll20
      const logger = typeof ImportJSON_Utils.global_log === 'function' ? ImportJSON_Utils.global_log : console.log;
      return ImportJSON_Utils.DEBUG &&
      logger(
        `[ImportJSON] ${a.map((v) => (typeof v === "string" ? v : JSON.stringify(v))).join(" ")}`,
      );
    },

    strip: function(s) { return (s || "").toString().replace(/<[^>]*>/g, ""); },

    decode: function(s) {
      let txt = (s || "").toString();
      // ❶ first, undo any URI encoding (only tokens need it,
      //    but calling it twice on handout text is harmless)
      try { txt = decodeURIComponent(txt); } catch (_) {}

      // ❷ now your previous HTML-entity / tag stripper
      // Simplified the regex slightly and ensured it operates on the potentially decoded `txt`
      txt = txt.replace(/&lt;/g, '<')
               .replace(/&gt;/g, '>')
               .replace(/<[^>]*?>/g, '') // To strip any HTML tags that might be present after decoding
               .replace(/&quot;/g, '"')
               .replace(/&apos;/g, "'")
               .replace(/&amp;/g, '&')
               .replace(/&nbsp;/g, ' ');
      // The original complex regex for entities like &#x...; and &#...; might still be needed if those appear
      // For now, focusing on the common ones and the URI decode part.
      // If complex entities are still an issue, we can re-integrate the more complex regex part carefully.
      return txt;
    },

    parseBonus: function(bonusStr) {
      if (typeof bonusStr === "number") return bonusStr;
      if (typeof bonusStr === "string") {
        const num = parseInt(bonusStr.replace(/[^-\d]/g, ""), 10);
        return isNaN(num) ? 0 : num;
      }
      return 0;
    },

    getDice: function(dmgStr) {
      if (!dmgStr || typeof dmgStr !== "string") return "";
      const match = dmgStr.match(/^\s*(\d+d\d+(\s*[+-]\s*\d+d\d+)*)/);
      return match ? match[1].trim() : dmgStr.split(" ")[0];
    },

    calculateAverage: function(diceStr) {
        if (!diceStr) return 0;
        const match = diceStr.match(/(\d+)d(\d+)([+-]\d+)?/);
        if (!match) return parseInt(diceStr) || 0;
        
        const numDice = parseInt(match[1]);
        const dieSize = parseInt(match[2]);
        const modifier = parseInt(match[3] || "0");
        
        const avgPerDie = (dieSize + 1) / 2;
        return Math.floor(numDice * avgPerDie + modifier);
    },

    // Moved and modified from ImportNpcJson_Core.js
    setAttributeDirect: function(charId, name, value, findObjsFunc, createObjFunc, dbgFunc) {
        if (value === undefined || value === null) return;
        let attr = findObjsFunc({ _type: "attribute", _characterid: charId, name: name })[0];
        if (attr) {
          attr.setWithWorker({ current: value });
          dbgFunc(` -> Updated Attribute: ${name} = "${value}"`);
        } else {
          attr = createObjFunc("attribute", {
            characterid: charId,
            name: name,
            current: value,
          });
          dbgFunc(` -> Created Attribute: ${name} = "${value}"`);
        }
        return attr;
    },

    // Moved and modified from ImportNpcJson_Core.js
    createLinkedAbility: function(charId, abilityName, description, macroAction, createObjFunc, dbgFunc, isTokenAction = true) {
        dbgFunc(`Creating ability: "${abilityName}" for charId ${charId}`);
        createObjFunc("ability", {
            _characterid: charId,
            name: abilityName,
            description: description || "",
            action: macroAction || "",
            istokenaction: isTokenAction,
        });
    }
};

// Log loading, using the internal dbg which will use global_log once populated
ImportJSON_Utils.dbg("ImportNpcJson_Utils.js Loaded. ImportJSON_Utils namespace created."); 



// ===== npc_importer_modules/ImportNpcJson_XPTable.js =====
/* Source: npc_importer_modules/ImportNpcJson_XPTable.js */
const ImportNpcJson_XPTable = {
    table: {
        // CR: [XP, ProfBonus, AC, HP_Min, HP_Max, AttackBonus, DmgRound_Min, DmgRound_Max, SaveDC]
        "0":    [10,    2, 13, 1,   6,   3, 0,  1,  13],
        "1/8":  [25,    2, 13, 7,   35,  3, 2,  3,  13],
        "1/4":  [50,    2, 13, 36,  49,  3, 4,  5,  13],
        "1/2":  [100,   2, 13, 50,  70,  3, 6,  8,  13],
        "1":    [200,   2, 13, 71,  85,  3, 9,  14, 13],
        "2":    [450,   2, 13, 86,  100, 3, 15, 20, 13],
        "3":    [700,   2, 13, 101, 115, 4, 21, 26, 13],
        "4":    [1100,  2, 14, 116, 130, 5, 27, 32, 14],
        "5":    [1800,  3, 15, 131, 145, 6, 33, 38, 15],
        "6":    [2300,  3, 15, 146, 160, 6, 39, 44, 15],
        "7":    [2900,  3, 15, 161, 175, 6, 45, 50, 15],
        "8":    [3900,  3, 16, 176, 190, 7, 51, 56, 16],
        "9":    [5000,  4, 16, 191, 205, 7, 57, 62, 16],
        "10":   [5900,  4, 17, 206, 220, 7, 63, 68, 16],
        "11":   [7200,  4, 17, 221, 235, 8, 69, 74, 17],
        "12":   [8400,  4, 17, 236, 250, 8, 75, 80, 17],
        "13":   [10000, 5, 18, 251, 265, 8, 81, 86, 18],
        "14":   [11500, 5, 18, 266, 280, 8, 87, 92, 18],
        "15":   [13000, 5, 18, 281, 295, 8, 93, 98, 18],
        "16":   [15000, 5, 18, 296, 310, 9, 99, 104,18],
        "17":   [18000, 6, 19, 311, 325, 10,105,110,19],
        "18":   [20000, 6, 19, 326, 340, 10,111,116,19],
        "19":   [22000, 6, 19, 341, 355, 10,117,122,19],
        "20":   [25000, 6, 19, 356, 400, 10,123,140,19],
        "21":   [33000, 7, 19, 401, 445, 11,141,158,20],
        "22":   [41000, 7, 19, 446, 490, 11,159,176,20],
        "23":   [50000, 7, 19, 491, 535, 11,177,194,20],
        "24":   [62000, 7, 19, 536, 580, 12,195,212,21],
        "25":   [75000, 8, 19, 581, 625, 12,213,230,21],
        "26":   [90000, 8, 19, 626, 670, 12,231,248,21],
        "27":   [105000,8, 19, 671, 715, 13,249,266,22],
        "28":   [120000,8, 19, 716, 760, 13,267,284,22],
        "29":   [135000,9, 19, 760, 805, 13,285,302,22],
        "30":   [155000,9, 19, 805, 850, 14,303,320,23]
    },
    getXP: function(cr) {
        const crString = String(cr);
        const stats = this.getCRBenchmarkStats(crString);
        return stats ? stats.xp : null;
    },
    getCRBenchmarkStats: function(cr) {
        const crString = String(cr);
        let rowData = null;

        if (this.table.hasOwnProperty(crString)) {
            rowData = this.table[crString];
        } else if (crString === "0.125") {
            rowData = this.table["1/8"];
        } else if (crString === "0.25") {
            rowData = this.table["1/4"];
        } else if (crString === "0.5") {
            rowData = this.table["1/2"];
        }

        if (!rowData) return null;

        return {
            cr: crString,
            xp: rowData[0],
            profBonus: rowData[1],
            ac: rowData[2],
            hpMin: rowData[3],
            hpMax: rowData[4],
            attackBonus: rowData[5],
            dmgRoundMin: rowData[6],
            dmgRoundMax: rowData[7],
            saveDC: rowData[8]
        };
    }
};

// Log that the module is loaded (assuming ImportJSON_Utils and its dbg function are available globally when this runs)
// This might need to be called from a central loading script that ensures order.
// For now, let's assume it can be logged if ImportJSON_Utils is already set up.
if (typeof ImportJSON_Utils !== 'undefined' && typeof ImportJSON_Utils.dbg === 'function') {
    ImportJSON_Utils.dbg("ImportNpcJson_XPTable.js (extended) populated and loaded.");
} else {
    // Fallback log if utils isn't ready (e.g. during script startup order)
    // log("ImportNpcJson_XPTable.js loaded (Utils not yet available for dbg).");
} 



// ===== npc_importer_modules/ImportNpcJson_HelpCommand.js =====
/* Source: npc_importer_modules/ImportNpcJson_HelpCommand.js */
/* Source: npc_importer_modules/ImportNpcJson_HelpCommand.js */
const ImportNpcJson_HelpCommand = {
    handleHelp: function(msg, whisper) {
        if (msg.content.trim().toLowerCase() === "!5enpcimport help") {
            const helpText = '📖 **5e NPC JSON Importer Help**<br><br>' +
                '**Commands:**<br>' +
                '- `!5enpcimport handout|Name` - Import from handout<br>' +
                '- `!5enpcimport {...}` - Import inline JSON<br>' +
                '- `!5enpcimport` - Import from selected token\\\'s GM Notes<br>' +
                '- `!5enpcimport help` - Shows this help message<br><br>' +
                '**Examples:**<br>' +
                '- `!5enpcimport handout|Goblin Boss`<br>' +
                '- `!5enpcimport {"name":"Bandit","hp":11,"ac":12}`<br><br>' +
                '**Full docs:** https://github.com/ByteBard97/roll20-5e-npc-json-importer';
            whisper(helpText);
            return true; /* Command was handled */
        }
        return false; /* Command was not handled */
    }
};

if (typeof ImportJSON_Utils !== 'undefined' && typeof ImportJSON_Utils.dbg === 'function') {
    ImportJSON_Utils.dbg("ImportNpcJson_HelpCommand.js loaded.");
} else {
    /* log("ImportNpcJson_HelpCommand.js loaded (Utils not yet available for dbg)."); */
}



// ===== npc_importer_modules/ImportNpcJson_Token.js =====
/* Source: npc_importer_modules/ImportNpcJson_Token.js */
const ImportNpcJson_Token = {
    finaliseToken: function(token, charObj, npcData) {
        if (!token || !charObj) {
            ImportJSON_Utils.dbg("finaliseToken: Token or Character object is missing.");
            return;
        }

        ImportJSON_Utils.dbg(`Finalising token ${token.id} for character ${charObj.id} (${npcData.name})`);

        /* --- 1. nameplate & representation (for the live token) --- */
        token.set({
            represents:        charObj.id,
            name:              charObj.get('name'), // Use character name from sheet
            showname:          true,
            showplayers_name:  true
        });
        ImportJSON_Utils.dbg(` - Live token: Represents character, name set, nameplate shown.`);

        /* --- 2. Bar 1 → independent hit-points (for the live token) --- */
        let hpVal = 0;
        if (npcData.hp) {
            if (typeof npcData.hp === 'object' && npcData.hp.average !== undefined) {
                hpVal = parseInt(npcData.hp.average) || 0;
            } else if (typeof npcData.hp === 'number') {
                hpVal = parseInt(npcData.hp) || 0;
            }
        }
        token.set({
            bar1_link:   '', // No attribute link for independent HP
            bar1_value:  hpVal,
            bar1_max:    hpVal,
            showplayers_bar1: true
        });
        ImportJSON_Utils.dbg(` - Live token: Bar 1 (HP) set to ${hpVal}/${hpVal} (independent), shown to players.`);

        /* --- 3. Bar 2 → armour class (also independent, for the live token) --- */
        let acVal = 0;
        if (npcData.ac) {
            if (typeof npcData.ac === 'object' && npcData.ac.value !== undefined) {
                acVal = parseInt(npcData.ac.value) || 0;
            } else if (typeof npcData.ac === 'number') {
                acVal = parseInt(npcData.ac) || 0;
            }
        }
        token.set({
            bar2_link:   '', // No attribute link
            bar2_value:  acVal,
            bar2_max:    '', // Max is empty for AC as per user request
            showplayers_bar2: true
        });
        ImportJSON_Utils.dbg(` - Live token: Bar 2 (AC) set to ${acVal} (independent), shown to players.`);

        /* --- 4. Make this token the default token for the sheet --- */
        // 4a. Copy the art into the sheet portrait so the bio tab isn't blank
        const liveTokenImgSrc = token.get('imgsrc');
        let fullImgSrc = liveTokenImgSrc;
        if (liveTokenImgSrc) {
            // Ensure the imgsrc is the full version, not thumb or med, for the avatar
            fullImgSrc = liveTokenImgSrc.replace(/\/(med|thumb)\./, '/max.');
            charObj.set('avatar', fullImgSrc);
            ImportJSON_Utils.dbg(` - Character avatar set from token imgsrc: ${fullImgSrc}`);
        } else {
            ImportJSON_Utils.dbg(` - Token imgsrc is empty, character avatar not set.`);
        }

        // 4b. Use the official setDefaultTokenForCharacter utility function
        try {
            // Check if the utility function exists
            if (typeof setDefaultTokenForCharacter === "function") {
                setDefaultTokenForCharacter(charObj, token);
                ImportJSON_Utils.dbg(` - Default token set using setDefaultTokenForCharacter() for character ${charObj.get('name')}`);
            } else {
                // Fallback if the utility function is not available
                ImportJSON_Utils.dbg(` - WARNING: setDefaultTokenForCharacter() not found. Default token not set.`);
                ImportJSON_Utils.global_sendChat('ImportJSON Token Warning', `/w gm ⚠️ setDefaultTokenForCharacter() utility function not available. Default token not set for ${charObj.get('name')}.`);
            }
        } catch (e) {
            ImportJSON_Utils.dbg(` - ERROR setting default token: ${e.message}`);
            ImportJSON_Utils.global_sendChat('ImportJSON Token Error', `/w gm ⚠️ Couldn't set default token for ${charObj.get('name')}: ${e.message}. See API console.`);
        }
        
        ImportJSON_Utils.dbg("Token finalisation complete.");
    }
    // Potentially other token-specific helper functions could go here in the future
};

ImportJSON_Utils.dbg("ImportNpcJson_Token.js populated and loaded."); 



// ===== npc_importer_modules/ImportNpcJson_CharacterSetup.js =====
/* Source: npc_importer_modules/ImportNpcJson_CharacterSetup.js */
// scripts/ImportNpcJson_CharacterSetup.js
const ImportNpcJson_CharacterSetup = {
    createCharacter: function(d, utils) {
        // utils is expected to contain { createObj, findObjs, dbg, DEFAULT_CREATOR }
        const { createObj, findObjs, dbg, DEFAULT_CREATOR } = utils;

        dbg("Creating character object...");
        const char = createObj("character", {
            name: d.name,
            archived: false,
            inplayerjournals: "", // As per original script
            controlledby: DEFAULT_CREATOR, // As per original script
            bio: d.bio || "",
        });

        if (char) {
            dbg(`Character object created with ID: ${char.id}`);
            // Initialize l1mancer_status immediately after creation
            let l1mancerAttr = findObjs({ _type: "attribute", _characterid: char.id, name: "l1mancer_status" })[0];
            if (l1mancerAttr) {
                l1mancerAttr.setWithWorker({ current: "" });
            } else {
                createObj("attribute", { characterid: char.id, name: "l1mancer_status", current: "" });
            }
            dbg(" -> Initial set: l1mancer_status = \"\"");
        } else {
            dbg("ERROR: Failed to create character object.");
            // No need to throw here, let Core handle the error if char is null after the call.
        }
        return char;
    }
};

ImportJSON_Utils.dbg("ImportNpcJson_CharacterSetup.js populated and loaded."); 



// ===== npc_importer_modules/ImportNpcJson_ScalarAttributes.js =====
/* Source: npc_importer_modules/ImportNpcJson_ScalarAttributes.js */
// scripts/ImportNpcJson_ScalarAttributes.js
const ImportNpcJson_ScalarAttributes = {
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



// ===== npc_importer_modules/ImportNpcJson_SheetInitializer.js =====
/* Source: npc_importer_modules/ImportNpcJson_SheetInitializer.js */
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



// ===== npc_importer_modules/ImportNpcJson_RepeatingSections.js =====
/* Source: npc_importer_modules/ImportNpcJson_RepeatingSections.js */
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



// ===== npc_importer_modules/ImportNpcJson_Builder.js =====
/* Source: npc_importer_modules/ImportNpcJson_Builder.js */
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



// ===== npc_importer_modules/ImportNpcJson_Core.js =====
/* Source: npc_importer_modules/ImportNpcJson_Core.js */
// Import JSON v1.0.0 – 5e-NPC importer for Roll20 sheet v4.2+ (2025-05-31)

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



// ===== Script End =====
})(); // End of IIFE wrapper for the entire bundle
