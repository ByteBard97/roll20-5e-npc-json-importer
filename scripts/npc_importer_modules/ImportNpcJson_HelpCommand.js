/* Source: npc_importer_modules/ImportNpcJson_HelpCommand.js */
var ImportNpcJson_HelpCommand = {
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