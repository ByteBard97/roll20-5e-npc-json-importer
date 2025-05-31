# Handoff Document - Roll20 5e NPC Importer

## Project Goal

To develop and refine a Roll20 API script (`5e_NPC_JSON_Importer.js`) that imports D&D 5th Edition NPC data from a custom JSON format into the official 'D&D 5e by Roll20' character sheet. The script should handle a wide variety of NPC attributes, repeating sections, token integration (including default token assignment), and provide a user-friendly experience.

## Current Status (End of Session - YYYY-MM-DD)

*   **Latest Script Version:** `8.0.1` (Command changed to `!5enpcimport`)
*   **Recent Key Script Changes (since v7.7.22_decode_fix):**
    *   **Command Change:** The primary script command has been changed from `!importjson` to `!5enpcimport` for uniqueness and clarity.
    *   **Token Import Overhaul & Default Token Success:**
        *   Successfully implemented robust token-based import (`!5enpcimport` with a selected token reading from GM Notes).
        *   The selected token is now correctly linked to the created/updated character sheet (name and `represents` field are set).
        *   Token bars (Bar 1 for HP, Bar 2 for AC) are updated based on the imported JSON data.
        *   **Crucially, the script now successfully sets the live token as the default token for the character sheet using the `setDefaultTokenForCharacter(charObj, token)` utility function.** This resolves a long-standing major issue.
    *   Multiple iterative refinements to the `ImportNpcJson_Token.js` module's `finaliseToken` function to achieve the above.
    *   The `ImportJSON_Utils.js` `decode()` function was previously updated to correctly handle URL-encoded GM notes, which was essential for token import.
*   **README.md:**
    *   Significantly updated to accurately reflect the new token import capabilities, including default token assignment and bar updates.
    *   Added sections on leveraging LLMs for NPC creation and future potential for MCP server integration.
*   **todo.md:**
    *   Marked the "Token-based JSON Import" feature as complete.
*   **Last User Test Results (with v8.0.1):**
    *   User confirmed successful import using the token-based method.
    *   Default token is correctly assigned to the character sheet.
    *   Token name and bars (HP/AC) are updated as expected.
    *   Inline JSON and Handout-based imports continue to function.

## Key Files & Structure

*   **Main User-Facing Script:** `scripts/5e_NPC_JSON_Importer.js` (This is the bundled script for Roll20).
*   **Source Modules:** Located in `scripts/npc_importer_modules/`.
    *   `ImportNpcJson_Core.js`: Handles chat commands (now `!5enpcimport`), versioning, and initial setup.
    *   `ImportNpcJson_Builder.js`: Orchestrates the NPC creation process.
    *   `ImportNpcJson_Token.js`: Handles all token-related logic, including linking, bar updates, and default token assignment.
    *   `ImportJSON_Utils.js`: Utility functions, including the crucial `decode` function.
    *   `ImportNpcJson_CharacterSetup.js`: Character object creation.
    *   `ImportNpcJson_ScalarAttributes.js`: Handles non-repeating attributes.
    *   `ImportNpcJson_SheetInitializer.js`: Handles sheet worker triggers and calculated fields.
    *   `ImportNpcJson_RepeatingSections.js`: Handles actions, traits, legendary, mythic actions, etc.
    *   `ImportNpcJson_XPTable.js`: XP and CR benchmark data.
*   **Build Script:** `scripts/build_roll20_bundle.sh`.
*   **Test NPCs:** Located in `test_npcs/`.
*   **Task List:** `todo.md`.
*   **READMEs:** Main `README.md` and `scripts/util/README.md`.
*   **JSON Specification:** `JSON_STRUCTURE.md`.

## Instructions for Next AI Assistant / Next Development Phase

1.  **Acknowledge User & Goal:** Inform the user you are picking up based on this handoff note. The primary goal of token import with default token assignment has been achieved. The script command is now `!5enpcimport`.
2.  **Confirm Script Version:** User should be on/rebuild to get version `8.0.1` (which includes the command change).
3.  **Next Phase: Cleanup and Polishing**
    *   The immediate next phase of development is focused on general cleanup, code polishing, addressing remaining `todo.md` items, and improving overall robustness and user experience.
    *   **Key areas to discuss with the user for this phase (referencing `todo.md` and recent development):**
        *   **Code Review & Refinement:**
            *   Review all modules, especially `ImportNpcJson_Token.js` and `ImportNpcJson_Builder.js`, for clarity, consistency, and removal of any dead code or excessive/outdated comments from the iterative debugging process.
            *   Ensure `ImportJSON_Utils.dbg` messages are still relevant, provide clear information, and are not overly verbose for settled functionality.
        *   **Address `todo.md` items:**
            *   "Non-Attack Action Damage/Saves" feature.
            *   "Performance Optimization" (e.g., the `setTimeout` in `ImportNpcJson_Builder.js`).
            *   "Fix Spell Attack & Save DC Calculation" (re-evaluate if still an issue, or if a reliable scripted nudge is needed).
            *   "Automatically Set `npc_options-flag`" (if still relevant).
            *   "Refinements & Nice-to-Haves" (e.g., enhanced error handling/messaging to user).
            *   "Re-import Logic for Existing Characters" (clarify behavior, improve if needed).
        *   **Documentation:**
            *   Final review of `README.md` for any further enhancements or clarifications.
            *   Consider adding a troubleshooting tip to the README about re-importing into a new handout/token if issues occur (as noted in `todo.md`).
            *   Ensure `JSON_STRUCTURE.md` is fully up-to-date with any implicit changes or best practices discovered.
        *   **Error Handling:** Review overall error handling. Are messages to the user clear and actionable? Are critical errors logged appropriately?

Good luck! 