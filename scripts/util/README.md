# Utility Scripts for Roll20 API Development

This directory contains utility scripts that were primarily used for debugging and developing the main 5e NPC JSON Importer script. They can also be useful for other Roll20 API script development or for in-depth inspection of character sheet data.

**These scripts are NOT required for the core functionality of the `5e_NPC_JSON_Importer.js` script.**

## Scripts

### 1. `HandoutLogger.js`

*   **Purpose:** Provides a centralized way for API scripts to log messages to a designated Roll20 Handout. This is useful for debugging and tracking script execution, especially for complex operations or when `log()` messages in the API console become too noisy or ephemeral.
*   **How it Works:**
    *   It creates (if it doesn't exist) a Handout named "API Debug Log" (by default, configurable in the script).
    *   Other scripts can call `HandoutLogger.log("Your message here", "OptionalSourceScript")` to append messages to this handout.
    *   Messages are typically written to the "gmnotes" section of the handout, visible only to the GM.
    *   Includes features like optional timestamps, log truncation to prevent the handout from becoming excessively large, and a queue for messages logged before the API is fully ready.
*   **Usage:**
    1.  Install `HandoutLogger.js` as an API script in your Roll20 game.
    2.  In your other API scripts, you can then log messages like this:
        ```javascript
        if (typeof HandoutLogger !== 'undefined' && typeof HandoutLogger.log === 'function') {
            HandoutLogger.log("This is a test message from MyScript.", "MyScript");
        } else {
            log("MyScript: HandoutLogger is not available.");
        }
        ```

### 2. `InspectNPC.js`

*   **Purpose:** A debugging tool to dump all attributes and basic properties of a character sheet associated with a selected token. This is extremely helpful for understanding the underlying data structure of a character sheet, especially when trying to figure out which attributes to set or modify with an API script.
*   **Dependency:** Requires `HandoutLogger.js` to be installed and running.
*   **How it Works:**
    *   Listens for the chat command `!inspectNPC`.
    *   When the command is used, it expects exactly one token to be selected on the VTT.
    *   It retrieves the character sheet linked to the selected token.
    *   It then iterates through all attributes of that character sheet and logs their names, current values, and max values (if applicable) to the "API Debug Log" handout via `HandoutLogger.js`.
    *   It also logs basic character properties like name, ID, avatar URL, etc.
*   **Usage:**
    1.  Ensure `HandoutLogger.js` is installed.
    2.  Install `InspectNPC.js` as an API script.
    3.  In Roll20, select a token that represents a character.
    4.  Type `!inspectNPC` in the chat.
    5.  Open the "API Debug Log" handout (usually in the Journal tab). The GM Notes section will contain a detailed dump of the character's attributes and properties.

## Note for Users of `5e_NPC_JSON_Importer.js`

While these utility scripts were instrumental in developing the importer, you do not need to install or use `HandoutLogger.js` or `InspectNPC.js` to simply use the `5e_NPC_JSON_Importer.js` to import your NPC statblocks. The importer is self-contained. These utilities are provided for those who might be curious about the development process or wish to use them for their own Roll20 scripting projects. 