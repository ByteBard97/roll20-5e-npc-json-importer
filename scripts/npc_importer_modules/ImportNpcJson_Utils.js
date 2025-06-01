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
      
      // ❶ Check if it's base64 encoded (starts with our marker)
      if (txt.startsWith('B64:')) {
          try {
              // Remove marker and decode base64
              const base64Content = txt.substring(4);
              txt = atob(base64Content);
              ImportJSON_Utils.dbg(`Base64 decode: Success`);
              return txt; // Base64 content should be clean JSON, no need for further processing
          } catch (e) {
              ImportJSON_Utils.dbg(`Base64 decode failed: ${e.message}. Continuing with regular decode...`);
              // If base64 fails, continue with regular decoding
          }
      }
      
      // ❷ Handle URL encoding with a more robust approach
      // Try full decode first
      try {
          txt = decodeURIComponent(txt);
          ImportJSON_Utils.dbg(`Full URL decode: Success`);
      } catch (e) {
          ImportJSON_Utils.dbg(`Full URL decode failed: ${e.message}. Attempting manual decode...`);
          
          // Manual decode of common URL encoded characters
          txt = txt.replace(/%3A/g, ':')
                   .replace(/%2C/g, ',')
                   .replace(/%20/g, ' ')
                   .replace(/%22/g, '"')
                   .replace(/%7B/g, '{')
                   .replace(/%7D/g, '}')
                   .replace(/%5B/g, '[')
                   .replace(/%5D/g, ']')
                   .replace(/%3C/g, '<')
                   .replace(/%3E/g, '>')
                   .replace(/%26/g, '&')
                   .replace(/%3D/g, '=')
                   .replace(/%2F/g, '/')
                   .replace(/%5C/g, '\\')
                   .replace(/%0A/g, '\n')
                   .replace(/%0D/g, '\r')
                   .replace(/%09/g, '\t');
          
          // Then try a more general pattern for any remaining encoded characters
          txt = txt.replace(/%([0-9A-Fa-f]{2})/g, function(match, hex) {
              try {
                  return String.fromCharCode(parseInt(hex, 16));
              } catch (e) {
                  return match;
              }
          });
          
          ImportJSON_Utils.dbg(`Manual URL decode complete`);
      }
      
      // ❸ Handle HTML entities BEFORE stripping tags
      txt = txt.replace(/&nbsp;/g, ' ')
               .replace(/&lt;/g, '<')
               .replace(/&gt;/g, '>')
               .replace(/&quot;/g, '"')
               .replace(/&apos;/g, "'")
               .replace(/&#39;/g, "'")
               .replace(/&amp;/g, '&');
      
      // ❹ Strip HTML tags
      txt = txt.replace(/<[^>]*?>/g, '');
      
      // ❺ Clean up any remaining whitespace issues
      txt = txt.replace(/\s+/g, ' ').trim();
      
      // ❻ Additional cleanup for common Roll20 artifacts
      // Remove any leading/trailing quotes that might have been added
      if (txt.startsWith('"') && txt.endsWith('"') && txt.length > 2) {
          try {
              // Check if it's a stringified JSON
              const unquoted = JSON.parse(txt);
              if (typeof unquoted === 'string') {
                  txt = unquoted;
              }
          } catch (e) {
              // Not stringified JSON, leave as is
          }
      }
      
      ImportJSON_Utils.dbg(`Decode result (first 200 chars): ${txt.substring(0, 200)}${txt.length > 200 ? '...' : ''}`);
      
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