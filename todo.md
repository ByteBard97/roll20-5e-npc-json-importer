# TODO List - Roll20 5e NPC Importer

## Core Functionality & Bug Fixes

- [x] **Automatically Enable Mythic Actions & Deprecate Flag:**
    - **Status:** COMPLETE (v7.7.19)
    - **Goal:** Remove the need for the `mythic_actions_enabled` flag in the JSON. The script should automatically enable mythic actions (set `npc_mythic_actions` to "1") if `mythic_actions` array or `mythic_actions.desc` (or the old `mythic_actions_description`) is present in the input JSON.
    - **Implementation:** Modified `ImportNpcJson_ScalarAttributes.js`.

- [x] **Improve Inline JSON Chat Command Parsing:**
    - **Status:** COMPLETE (v7.7.20)
    - **Issue:** Original inline JSON parsing (`!importjson %{...}`) was based on an incorrect understanding of the `%{}` wrapper (intended for Ability macros). This caused failures with direct inline JSON.
    - **Fix:** Implemented a robust regex in `ImportNpcJson_Core.js` to handle `!importjson {...}` (bare JSON) and `!importjson '{...}'` (single-quoted JSON) directly from chat. Added `msg.playerid === 'API'` guard to prevent self-echo loops from `sendChat`.
    - **Tested:** Successfully imported simple (Tiny Rat) and complex (Boss Monster) NPCs using the new inline method.

- [x] **Mythic Actions Support (Individual Actions):**
    - **Status:** COMPLETE.
    - **JSON Input:** Array `mythic_actions: [{ name: "Action Name", desc: "Description", attack: {...} }]`. `mythic_actions_enabled` (boolean/string "0"/"1") and `mythic_actions_description` (string) at the top level.
    - **Implementation:** `ImportNpcJson_ScalarAttributes.js` handles the `npc_mythic_actions` checkbox (from `mythic_actions_enabled`) and `npc_mythic_actions_desc` text (from `mythic_actions_description`). `ImportNpcJson_RepeatingSections.js` processes the `mythic_actions` array, creating attributes with the prefix `repeating_npcaction-m_`, reusing logic similar to legendary actions. Cost can be embedded in name or via an optional `cost` field.

- [x] **Initiative Tiebreaker Handling:**
    - **Status:** COMPLETE.
    - **JSON Input:** Top-level field `init_tiebreaker` (e.g., `"@{dexterity}/100"` or `"0"`).
    - **Implementation:** `ImportNpcJson_ScalarAttributes.js` now correctly reads `d.init_tiebreaker` and sets the `init_tiebreaker` attribute.

- [x] **Populate Bio & Info Tab:**
    - **Status:** COMPLETE. Implemented in `ImportNpcJson_CharacterSetup.js`. Requires `bio` field in JSON.

## New Features & Enhancements

- [ ] **Non-Attack Action Damage/Saves (Lower Priority):**
    - **Goal:** Allow actions that are not standard "attacks" (e.g., breath weapons, auras) to specify damage, damage type, and associated saving throw details directly in their JSON object.
    - **JSON Input (Example):** `{ "name": "Pulse", "desc": "Emits a pulse.", "dmg1": "2d6", "type1": "fire", "save_dc": 13, "save_ability": "dexterity" }` (fields directly under the action, not in an `attack` sub-object).
    - **Implementation:** Modify `processAction` in `ImportNpcJson_RepeatingSections.js` to check for these fields if `action.attack` is not present. Populate `baseAttrs` like `attack_damage`, `attack_damagetype`, and append save details to the description or `attack_onhit`. Use `template:dmgaction` or `template:npcaction` as appropriate for the rollbase.

- [x] **Token-based JSON Import:**
    - **Status:** COMPLETE (v7.9.6 - uses `setDefaultTokenForCharacter`)
    - **Functionality:** Allow importing JSON from a selected token's GM Notes.
    - **Invocation:** If `!importjson` is run with a token selected and no other arguments (inline/handout), attempt to read JSON from GM Notes.
    - **Post-Import:** Assign the created/updated character sheet to the token (`represents` field), set token name, and set the default token for the character sheet using the live token's properties (including bars for HP & AC) via `setDefaultTokenForCharacter`.

- [ ] **Performance Optimization:**
    - **Issue:** Script execution can take 5-10 seconds, partly due to a 1-second `setTimeout` in `ImportNpcJson_Builder.js`.
    - **Next Step:** Investigate if the `setTimeout` can be safely reduced or replaced with a more event-driven approach. Profile other parts of the script if significant delays persist.

## Project & Documentation

- [ ] **README.md Enhancements:**
    - **Acknowledge Prior Art:** Add a section acknowledging Zanthox's `ImportStats v1.js` script ([https://github.com/Zanthox/Roll205eSheetImport](https://github.com/Zanthox/Roll205eSheetImport)), explaining how this project differs (JSON input, modularity, direct attribute focus) while thanking for the inspiration.
    - **Link to Forum Post:** Include a link to the relevant Roll20 forum discussion ([https://app.roll20.net/forum/post/10800206/script-importstats-take-monster-stat-blocks-and-import-them-into-roll20-5e-npc-sheets](https://app.roll20.net/forum/post/10800206/script-importstats-take-monster-stat-blocks-and-import-them-into-roll20-5e-npc-sheets)).
    - **Detailed User Instructions:** Expand on setup and usage, catering to less technical users.
    - **Dependency Clarification:** State that the script is currently self-contained (no external Base64 or other API script dependencies for core import).

- [ ] **Project Reorganization (Future Consideration):**
    - **Goal:** Make the script easier for less technical users to install and use.
    - **Possibility:** If future features introduce dependencies, consider offering a dependency-free version and a version that leverages other API scripts for enhanced functionality (e.g., advanced token manipulation with TokenMod).

- [ ] **Troubleshooting Tip for README:** Add a troubleshooting section or note in the usage instructions advising users that if they encounter persistent, inexplicable issues when re-importing into an existing handout (like erroneous warnings or features not updating correctly), they should try importing the JSON into a brand new, empty handout. This can help resolve problems caused by stale data or unusual states in the original handout or its associated character sheet.

## Notes

- **Single-Line Chat Command (`!importjson {...}`):** The existing `!importjson %{json_data}` already supports inline JSON from the chat. The `%{...}` wrapper is generally good for ensuring Roll20 handles the complex string correctly.
- **External Dependencies:** Currently, the script is self-contained. The "Base64" library mentioned by the user is not used by this script bundle.

## Refinements & Nice-to-Haves

*(Please list any refinements or minor improvements here)*

- Add `npc_options_flag: "1"` automatically if legendary/mythic/lair actions present.
- Enhance script error handling and input flexibility:
   - For other types of malformed JSON (e.g., unexpected data types that cannot be easily normalized): Instead of crashing, catch the error, log a descriptive message to the Roll20 API console (mentioning the NPC name and the problematic field), and attempt to continue processing the rest of the NPC's data where possible, or gracefully skip the problematic section.
- **Implement Revealing Module Pattern:** Refactor the script to use a closure/scope (like the Revealing Module Pattern) to prevent namespace collisions with other Roll20 API scripts.
- **Move Chat Listener to `on('ready')`:** Relocate the chat event listener registration (`on('chat:message', ...`) to within an `on('ready', ...)` event handler to improve compatibility with metascripts and ensure the script is fully initialized before processing commands.

- [ ] **Improve Re-import Logic for Existing Characters:**
    - **Issue:** Importing into an existing character sheet (via an existing handout) can sometimes lead to warnings (e.g., erroneous "Lair action data present") or incorrect behavior if the sheet has legacy/stale attributes from previous import attempts. This was observed with the "boss_monster" handout causing issues that a new handout with the exact same JSON did not.
    - **Goal:** Ensure that when re-importing, the script more effectively clears or overwrites attributes it manages, particularly for sections like legendary, mythic, and potentially lair actions (if any explicit handling for clearing old lair action attributes exists). This should prevent stale data from triggering incorrect warnings or behavior on subsequent imports.
    - **Consideration:** Balance thorough clearing with preserving any manual changes a user might have made (though this script primarily focuses on a full overwrite from JSON for script-managed fields). 