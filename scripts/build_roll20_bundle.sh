#!/usr/bin/env bash
# build_roll20_bundle.sh – concatenate modules for Roll20 NPC Importer

set -euo pipefail # fail fast

# Ensure the script runs from its own directory to correctly find JS files
cd "$(dirname "$0")"

# Define the new output filename
OUT="5e_NPC_JSON_Importer.js"
>"$OUT" # truncate / create

echo "// 5e NPC JSON Importer - Generated $(date)" >"$OUT"
echo "// Main script file. Contains all necessary modules.
// Load Order:" >>"$OUT"

echo "(() => { // Start of IIFE wrapper for the entire bundle" >> "$OUT"
echo "\"use strict\";" >> "$OUT"

# Define the subdirectory for the modules
MODULE_SUBDIR="npc_importer_modules"

# The order of these files is critical.
# Paths are now relative to the MODULE_SUBDIR.
FILES=(
  "$MODULE_SUBDIR/ImportNpcJson_Utils.js"
  "$MODULE_SUBDIR/ImportNpcJson_XPTable.js"
  "$MODULE_SUBDIR/ImportNpcJson_HelpCommand.js"
  "$MODULE_SUBDIR/ImportNpcJson_Token.js"
  "$MODULE_SUBDIR/ImportNpcJson_CharacterSetup.js"
  "$MODULE_SUBDIR/ImportNpcJson_ScalarAttributes.js"
  "$MODULE_SUBDIR/ImportNpcJson_SheetInitializer.js"
  "$MODULE_SUBDIR/ImportNpcJson_RepeatingSections.js"
  "$MODULE_SUBDIR/ImportNpcJson_Builder.js"
  "$MODULE_SUBDIR/ImportNpcJson_Core.js"
)

for F in "${FILES[@]}"; do
  if [ -f "$F" ]; then
    echo "// ===== $F =====" >>"$OUT"
    echo "/* Source: $F */" >>"$OUT"
    grep -v -E "^\s*(\"use strict\"|\'use strict\');\s*$" "$F" >>"$OUT"
    echo -e "\n\n" >>"$OUT" # Add a bit more space between files
  else
    echo "Error: Source file $F not found!" >&2
    exit 1
  fi
done

# Add a final log message to the script itself to indicate completion in the Roll20 console
echo "// ===== Script End =====" >> "$OUT"

echo "})(); // End of IIFE wrapper for the entire bundle" >> "$OUT"

echo "Created $OUT – copy-paste its content into the Roll20 API script editor."
echo "Make sure this is the *only* script related to this NPC importer in your Roll20 campaign." 