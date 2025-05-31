# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Placeholder for future changes

## [8.0.1] - 2024-0MM-DD (Replace with actual date)

### Added
- **Token-Based Import Overhaul:**
    - Successfully implemented robust NPC import from a selected token's GM Notes using the `!5enpcimport` command.
    - The selected token is now automatically linked to the created/updated character sheet (name and `represents` field are set).
    - Token bars (Bar 1 for HP, Bar 2 for AC) are now updated based on the imported JSON data.
    - **Default Token Assignment:** The script now successfully sets the live token as the default token for the character sheet using the `setDefaultTokenForCharacter(charObj, token)` utility function. This was a major enhancement.
- Whispers to GM now use "ImportNPC" as the sender name for consistency.

### Changed
- **Primary Script Command:** Changed from `!importjson` to `!5enpcimport` for uniqueness and clarity. Updated in all relevant script logic and documentation.
- Internal versioning updated to `8.0.1`.

### Fixed
- Essential for token import: The `ImportJSON_Utils.js` `decode()` function was previously (in a prior version leading up to this) updated to correctly handle URL-encoded GM notes, resolving critical parsing errors.

*(Note: Many iterative fixes and refinements to `ImportNpcJson_Token.js` were made during the development of the default token feature.)* 