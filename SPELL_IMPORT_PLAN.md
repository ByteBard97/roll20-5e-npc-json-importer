## Roll20 5e NPC Importer – Spellbook Auto-Population Roadmap

_Last updated: 2025-06-18_

This document captures the complete design agreed upon for adding **automatic spellbook population** to the importer, plus a stand-alone fixer script that can retrofit spells onto NPCs you already imported with older versions.

---

### 1  Data Contract in NPC JSON

```jsonc
"spells": {
  "cantrips": ["fire bolt", "mage hand"],
  "1": ["shield", "magic missile"],
  "2": ["misty step"]
}
```
• Optional. If omitted, importer will fall back to parsing the plain-text Spellcasting trait.
• Keys: `cantrips` or string numbers `"1"-"9"`.
• Values: array of spell names (mixed case is fine).

### 2  Parsing Spell Names From the Trait (fallback path)

1. Locate the `Spellcasting` trait (`repeating_npctrait_*` row with `name === "Spellcasting"`).
2. Collapse newlines → spaces for simpler regex.
3. Regex to carve out each block:

```js
const blockRx = /\b(?:cantrips?|at will|[1-9](?:st|nd|rd|th)\s+level).*?:\s*([^\.]+)/gi;
```
4. Split each captured fragment on commas, semicolons, or " or ":

```js
fragment.split(/\s*(?:,|;| or )\s*/);
```
5. Derive a provisional `levelKey` from the heading (`cantrip|1…9`).  You can correct it later with the API's `spellData.level`.
6. Clean each name (`*italics*`, extra quotes, smart apostrophes → plain string).

### 3  New Module: `ImportNpcJson_SpellImporter.js`

```js
const ImportNpcJson_SpellImporter = {
  importSpellsForCharacter(charId, npcJson, whisperFn) { … },
  importSpellsForExistingCharacter(charId, whisperFn) { … } // Trait-only path
};
```

Internal helpers:

| Function | Purpose |
|----------|---------|
| `collectSpellNames(src)` | Flatten & de-duplicate into `[ {name, levelKeyHint} ]`. |
| `slugify(name)` | Lower-case, spaces→dashes, strip punctuation ("Fire Bolt" → "fire-bolt"). |
| `fetchSpell(slug)` | Fetches `https://www.dnd5eapi.co/api/spells/${slug}` with caching. Returns `null` on error/404. |
| `createSpellbookEntry(charId, spellData, levelKey)` | Writes all `repeating_spell-<level>_…` attributes. |
| `maybeCreateAttackEntry(charId, spellData, rowId)` | If `attack_type` present, creates the matching `repeating_attack_…` row & token action. |
| `spellExists(charId, name)` | Quick scan to avoid duplicates when rerunning. |

Implementation notes:
• Use `ImportJSON_Utils.genRowID()` for Row IDs.
• Level mapping: `levelKey = (spellData.level === 0 ? "cantrip" : String(spellData.level))`.
• Cache object lives on module‐level: `const CACHE = {};` (key = slug).
• Respect Roll20 limits: keep per-minute API calls low; whisper failures.

### 4  Integration Points

1. **During import** (inside `ImportNpcJson_Builder.buildNpc`):

```js
if (d.spells || traitHasSpellList(d)) {
  ImportNpcJson_SpellImporter.importSpellsForCharacter(char.id, d, w);
}
```

2. **Retro-fixer chat command**

```js
!5enpcimport spells   // operates on all selected tokens
```

Hook in `handleChatMessage` (Core) to iterate over selected tokens → their represented characters → call `importSpellsForExistingCharacter`.

### 5  Duplicate Detection

Before creating a new spell row, search:

```js
findObjs({
  _type: "attribute",
  _characterid: charId,
  name: new RegExp(`^repeating_spell-${levelKey}_[^-]+_spellname$`)
}).some(a => a.get("current").toLowerCase() === name.toLowerCase());
```

### 6  Edge-Case Handling

| Issue | Strategy |
|-------|----------|
| Spell not found / typo | Skip, whisper warning. |
| Duplicate across trait & JSON | Dedup map by lower-case name. |
| 3/day each etc. | Treat as `cantrip` / level-agnostic; API level overrides. |
| Healing spells | Use `heal_at_slot_level` as Damage substitute; omit dmg fields. |
| Non-SRD spells | Create placeholder spellbook row with only `spellname`, `spelldescription = "(not in SRD)"`. |

### 7  Roll-out Checklist

- [ ] Write `ImportNpcJson_SpellImporter.js` and include it in `build_roll20_bundle.sh` _before_ Core.
- [ ] Add chat command logic in `ImportNpcJson_Core.js`.
- [ ] Modify Builder to invoke spell importer automatically.
- [ ] Test on a fresh import (JSON with structured `spells`).
- [ ] Test on an existing NPC token (`!5enpcimport spells`).
- [ ] Stress-test cache and API rate limits.

---

### 8  Future Ideas

1. **Dry-run mode** – `!5enpcimport spells --dry` shows what would be added without touching the sheet.
2. **Pre-warm cache** – On API sandbox start, fetch the `/api/spells` list once, then lazy-load details.
3. **Internationalisation** – Map accented quotes / localisation variants to base English slugs.
4. **Better `rollbase` construction** – Improve the attack macro template to fully emulate sheet-generated strings.

---

> You can use this file as the authoritative spec when you revisit the project. All code changes should reference the section numbers above so reviewers know what part of the design they implement. 