// ImportNpcJson_Utils.js
// Establishes the ImportJSON_Utils namespace for helper functions and constants.

var ImportJSON_Utils = {
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
      return this.DEBUG &&
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