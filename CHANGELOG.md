# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Placeholder for future changes

## [1.0.2] - 2025-05-31

### Changed
- **Script Scoping and Initialization:**
    - Refactored the entire script bundle to be wrapped in an Immediately Invoked Function Expression (IIFE), ensuring all internal modules (`ImportJSON_Utils`, `ImportNpcJson_Builder`, etc.) are privately scoped and do not pollute the global Roll20 API script namespace. This significantly improves robustness and prevents potential collisions with other API scripts.
    - Moved the chat event listener registration (`on('chat:message', ...)`) into the main `on('ready', ...)` event handler. This aligns with best practices for Roll20 API scripts, ensuring the script is fully initialized before processing commands and improving compatibility with potential metascript integrations.
    - Standardized module definitions to use `const` instead of `var` for better block scoping within the IIFE.
    - Updated `ImportNpcJson_Core.js` to include `scriptName` and `version` constants and a `registerEventHandlers` function for cleaner organization, following patterns suggested by the Roll20 community.

### Fixed
- Resolved an issue where the `ImportJSON_Utils.dbg()` function would cause a `TypeError` due to `this.DEBUG` being undefined when `dbg` was called from a different context. The `dbg` function now directly references `ImportJSON_Utils.DEBUG`.

### Acknowledgements
- Special thanks to **timmaugh** (Roll20 Forum Champion, API Scripter) for their invaluable suggestions regarding script scoping (IIFE/Revealing Module Pattern) and `on('ready')` event handling, which led to the significant structural improvements in this version.

## [1.0.0] - 2025-05-31

### Added
- **Token-Based Import Overhaul:**
    - Successfully implemented robust NPC import from a selected token's GM Notes using the `!5enpcimport` command.
    - The selected token is now automatically linked to the created/updated character sheet (name and `represents` field are set).
    - Token bars (Bar 1 for HP, Bar 2 for AC) are now updated based on the imported JSON data.
    - **Default Token Assignment:** The script now successfully sets the live token as the default token for the character sheet using the `setDefaultTokenForCharacter(charObj, token)` utility function. This was a major enhancement.
- Whispers to GM now use "ImportNPC" as the sender name for consistency.

### Changed
- **Primary Script Command:** Changed from `!importjson` to `!5enpcimport` for uniqueness and clarity. Updated in all relevant script logic and documentation.
- Internal versioning updated to `1.0.0`.

### Fixed
- Essential for token import: The `ImportJSON_Utils.js` `decode()` function was previously (in a prior version leading up to this) updated to correctly handle URL-encoded GM notes, resolving critical parsing errors.

*(Note: Many iterative fixes and refinements to `ImportNpcJson_Token.js` were made during the development of the default token feature.)* 