/**********************************************************************
 * NPC Sheet Inspector Script v1.5 (2025-05-05)
 * Logs ALL attributes & basic properties of a selected character
 * to the HandoutLogger script for easier review.
 * Uses correct async .get() for bio/gmnotes.
 **********************************************************************/

on('chat:message', msg => {
    if (msg.type !== 'api' || !msg.content.startsWith('!inspectNPC')) return;
    const who = msg.who.replace(' (GM)', '');
    const scriptName = 'NPCInspector';

    if (typeof HandoutLogger === 'undefined' || typeof HandoutLogger.log !== 'function') {
        log(`[${scriptName}] ERROR: HandoutLogger script not found.`);
        sendChat(scriptName, `/w "${who}" ERROR: HandoutLogger script not found. Check API Console.`);
        return;
    }
    const hLog = (message) => HandoutLogger.log(message);

    if (!msg.selected || msg.selected.length !== 1 || msg.selected[0]._type !== 'graphic') {
        sendChat(scriptName, `/w "${who}" ⚠️ Please select exactly one token linked to a character.`);
        return;
    }

    const tokenId = msg.selected[0]._id;
    const token = getObj('graphic', tokenId);
    const charId = token ? token.get('represents') : null;
    if (!charId) {
        sendChat(scriptName, `/w "${who}" ⚠️ Selected token does not represent a character.`);
        return;
    }

    const character = getObj('character', charId);
    if (!character) {
         sendChat(scriptName, `/w "${who}" ⚠️ Character not found (ID: ${charId}).`);
         return;
    }

    const charName = character.get('name');
    hLog(`---=== Inspecting Character: ${charName} (ID: ${charId}) ===---`);
    sendChat(scriptName, `/w "${who}" Inspecting all attributes for ${charName}. Output sent to HandoutLogger.`);

    // --- Log Basic Character Properties (Using Async Get for Bio/GMNotes) ---
    hLog(`--- Basic Character Properties ---`);
    const basicProps = {
        _id: character.id,
        _type: 'character',
        name: character.get('name'),
        avatar: character.get('avatar'),
        archived: character.get('archived'),
        inplayerjournals: character.get('inplayerjournals'),
        controlledby: character.get('controlledby')
    };
    Object.entries(basicProps).forEach(([key, value]) => {
        hLog(`  ${key}: ${JSON.stringify(value)}`);
    });

    // Asynchronously get bio and gmnotes
    character.get('bio', function(bio) {
        let displayValue = bio || '';
        if (displayValue.length > 300) { displayValue = `${displayValue.substring(0, 150)} ... (truncated) ... ${displayValue.substring(displayValue.length - 150)}`; }
        hLog(`  bio: ${JSON.stringify(displayValue)}`);

        character.get('gmnotes', function(gmnotes) {
            displayValue = gmnotes || '';
            if (displayValue.length > 300) { displayValue = `${displayValue.substring(0, 150)} ... (truncated) ... ${displayValue.substring(displayValue.length - 150)}`; }
            hLog(`  gmnotes: ${JSON.stringify(displayValue)}`);
            hLog(` `); // Spacer after basic props

            // --- Log ALL Attributes (Moved inside the innermost callback) ---
            hLog(`--- All Character Attributes ---`);
            const attributes = findObjs({ _type: 'attribute', _characterid: charId });

            if (!attributes || attributes.length === 0) {
                hLog(`  (No attributes found for this character)`);
            } else {
                attributes.sort((a, b) => { /* ... sort logic ... */
                     const nameA = a.get('name').toLowerCase(); const nameB = b.get('name').toLowerCase(); if (nameA < nameB) return -1; if (nameA > nameB) return 1; return 0;
                 });
                attributes.forEach(attr => {
                    const attrName = attr.get('name');
                    const attrCurrent = attr.get('current');
                    const attrMax = attr.get('max');
                    let logLine = `  ${attrName}: "${attrCurrent}"`;
                    if (attrMax !== undefined && attrMax !== null && attrMax !== "") { logLine += ` (Max: "${attrMax}")`; }
                    hLog(logLine);
                });
                hLog(`  (Found ${attributes.length} attributes total)`);
            }
            hLog(` `); // Spacer
            hLog(`---=== End Inspection for: ${charName} ===---`);
            sendChat(scriptName, `/w "${who}" Full attribute dump for ${charName} sent to HandoutLogger.`);
        }); // End gmnotes get callback
    }); // End bio get callback
});

log('[NPCInspector v1.5] Ready. Uses HandoutLogger & Async Get. Use !inspectNPC with a char token selected.');