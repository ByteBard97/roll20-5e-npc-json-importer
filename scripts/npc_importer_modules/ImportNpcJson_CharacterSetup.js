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