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