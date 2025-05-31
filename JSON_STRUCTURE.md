# Roll20 5e NPC Importer: JSON Structure Guide

This document details the expected JSON structure for importing NPCs into the Roll20 5e character sheet using the `5e_NPC_JSON_Importer.js` script.

Please refer to this guide when creating your JSON data to ensure compatibility and successful imports.

## General Notes

*   **Case Sensitivity:** Field names (keys) are generally case-sensitive as processed by JavaScript. It's best to stick to the exact casing shown.
*   **Data Types:** Ensure values match the expected data types (string, number, boolean, object, array).
*   **Optional vs. Required:** Fields marked as optional can be omitted. If omitted, the script may use a default value or simply not set the corresponding sheet attribute.
*   **Examples:** Examples provided are illustrative. Your actual data will vary.

---

## Top-Level Fields

This section describes fields expected directly under the root JSON object.

### `name`
*   **Data Type:** `String`
*   **Required:** Yes
*   **Description:** The name of the NPC. This will populate the character name and NPC name fields on the sheet.
*   **Example:** `"name": "Town Guard"`

### `size`
*   **Data Type:** `String`
*   **Required:** No
*   **Description:** The creature's size category (e.g., "Medium", "Large", "Tiny"). Populates `npc_size`.
*   **Example:** `"size": "Medium"`

### `type`
*   **Data Type:** `String`
*   **Required:** No
*   **Description:** The creature's type (e.g., "humanoid (human)", "construct", "fiend (devil)"). Populates `npc_type`.
*   **Example:** `"type": "humanoid (human)"`

### `alignment`
*   **Data Type:** `String`
*   **Required:** No
*   **Description:** The creature's alignment (e.g., "Lawful Good", "Chaotic Neutral", "Unaligned"). Populates `npc_alignment`.
*   **Example:** `"alignment": "Lawful Neutral"`

### `ac`
*   **Data Type:** `Object` or `Number`
*   **Required:** No
*   **Description:** Armor Class. 
    *   If a `Number` (e.g., `16`), it sets `npc_ac`.
    *   If an `Object`, it can have:
        *   `value` (`Number`): The AC value.
        *   `notes` (`String`, Optional): Description of armor (e.g., "natural armor", "shield").
        *   `type` (`String`, Optional): Alternative to `notes` for describing armor type.
*   **Example (Number):** `"ac": 18`
*   **Example (Object):** `"ac": { "value": 15, "notes": "natural armor" }`
*   **Example (Object with string value):** `"ac": { "value": 21, "type": "Plate Armor, Shield" }`

### `hp`
*   **Data Type:** `Object` or `Number`
*   **Required:** No
*   **Description:** Hit Points.
    *   If a `Number` (e.g., `45`), it sets the average/current/max HP.
    *   If an `Object`, it should have:
        *   `average` (`Number`): The average HP value.
        *   `formula` (`String`, Optional): The dice formula for HP (e.g., "6d8 + 12").
*   **Example (Number):** `"hp": 75`
*   **Example (Object):** `"hp": { "average": 52, "formula": "8d8 + 16" }`
*   **Example (Object with numeric average):** `"hp": { "average": 350, "formula": "20d20+140" }`

### `speed`
*   **Data Type:** `String`
*   **Required:** No
*   **Description:** The creature's speed(s) (e.g., "30 ft.", "30 ft., fly 60 ft."). Populates `npc_speed`.
*   **Example:** `"speed": "30 ft., climb 30 ft."`

### `abilities`
*   **Data Type:** `Object`
*   **Required:** Yes (for a functional NPC)
*   **Description:** Contains the six ability scores. Keys are short, lowercase ability names. Values are `Number`.
*   **Structure:**
    *   `str` (`Number`): Strength score.
    *   `dex` (`Number`): Dexterity score.
    *   `con` (`Number`): Constitution score.
    *   `int` (`Number`): Intelligence score.
    *   `wis` (`Number`): Wisdom score.
    *   `cha` (`Number`): Charisma score.
*   **Example:** `"abilities": { "str": 16, "dex": 12, "con": 14, "int": 10, "wis": 11, "cha": 8 }`

### `saves`
*   **Data Type:** `Object`
*   **Required:** No
*   **Description:** Saving throw bonuses. Keys are short, lowercase ability names. Values are strings representing the bonus (e.g., "+5", "-1").
*   **Structure:** Keys like `str`, `dex`, `con`, `int`, `wis`, `cha`.
*   **Example:** `"saves": { "dex": "+4", "wis": "+3" }`

### `skills`
*   **Data Type:** `Object`
*   **Required:** No
*   **Description:** Skill bonuses. Keys are lowercase skill names (spaces removed, e.g., "animalhandling", "sleightofhand"). Values are strings representing the bonus (e.g., "+7", "+0").
*   **Example:** `"skills": { "perception": "+5", "stealth": "+2", "athletics": "+6" }`

### `damage_vulnerabilities`
*   **Data Type:** `String`
*   **Required:** No
*   **Description:** A comma-separated string of damage types the creature is vulnerable to.
*   **Example:** `"damage_vulnerabilities": "bludgeoning, slashing"`

### `damage_resistances`
*   **Data Type:** `String`
*   **Required:** No
*   **Description:** A comma-separated string of damage types the creature is resistant to.
*   **Example:** `"damage_resistances": "fire, poison"`

### `damage_immunities`
*   **Data Type:** `String`
*   **Required:** No
*   **Description:** A comma-separated string of damage types the creature is immune to.
*   **Example:** `"damage_immunities": "cold, lightning, necrotic from nonmagical attacks"`

### `condition_immunities`
*   **Data Type:** `String`
*   **Required:** No
*   **Description:** A comma-separated string of conditions the creature is immune to.
*   **Example:** `"condition_immunities": "charmed, frightened, exhaustion"`

### `senses`
*   **Data Type:** `String`
*   **Required:** No
*   **Description:** Special senses and passive Perception (e.g., "darkvision 60 ft., passive Perception 15").
*   **Example:** `"senses": "blindsight 30 ft., darkvision 120 ft., passive Perception 17"`

### `languages`
*   **Data Type:** `String`
*   **Required:** No
*   **Description:** A comma-separated string of languages known by the creature.
*   **Example:** `"languages": "Common, Draconic, telepathy 60 ft."`

### `cr`
*   **Data Type:** `String` or `Number`
*   **Required:** No
*   **Description:** Challenge Rating (e.g., "1/2", "5", "20"). Used to set `npc_challenge` and look up XP.
*   **Example:** `"cr": "3"`

### `xp`
*   **Data Type:** `String` or `Number`
*   **Required:** No (Calculated from `cr` if `cr` is provided and found in the XPTable; otherwise, this value is used directly if present).
*   **Description:** Experience points for defeating the creature. Populates `npc_xp`.
*   **Example:** `"xp": 700`

### `pb`
*   **Data Type:** `String` or `Number`
*   **Required:** No (Calculated from `cr` by sheet workers if not provided).
*   **Description:** Proficiency Bonus (e.g., "+2", `3`). Populates `npc_pb`. If provided, ensure it includes a sign for positive numbers (e.g., `"+3"`).
*   **Example:** `"pb": "+3"`

### `bio`
*   **Data Type:** `String`
*   **Required:** No
*   **Description:** The biography or descriptive text for the NPC. Populates the main bio/info field on the character sheet.
*   **Example:** `"bio": "A grizzled veteran of many battles, known for a stern demeanor but a fair heart."`

### `spellcasting_ability`
*   **Data Type:** `String`
*   **Required:** No (but needed for spellcasting functionality)
*   **Description:** The ability used for spellcasting (e.g., "Intelligence", "Wisdom", "Charisma", or "None"). Populates `spellcasting_ability` on the sheet, which sheet workers use to calculate spell attack and DC.
*   **Example:** `"spellcasting_ability": "Intelligence"`
*   **Note on Spell Attack & Save DC:** While some external JSON formats or monster blocks might include top-level `spell_attack_bonus` or `spell_save_dc` fields, this import script *does not* directly use them. These values are expected to be calculated by the Roll20 sheet workers based on the `spellcasting_ability`, proficiency bonus (`pb`), and relevant ability modifier.

### `caster_level`
*   **Data Type:** `Number`
*   **Required:** No (Defaults to 0 if `spellcasting_ability` is set but this is omitted).
*   **Description:** The creature's caster level. Populates `caster_level`.
*   **Example:** `"caster_level": 7`

### `spell_slots`
*   **Data Type:** `Object`
*   **Required:** No (but typically provided if the creature is a spellcaster with spell slots).
*   **Description:** Defines the total number of spell slots per spell level.
*   **Structure:** Keys are strings representing the spell level ("1" through "9"). Values are numbers representing total slots for that level.
*   **Example:** `"spell_slots": { "1": 4, "2": 3, "3": 3, "4": 1 }` (omitted levels default to 0 slots).
*   **Note on Individual Spell Lists:** The script does not currently parse detailed spell lists from a nested object (e.g., a `spells_prepared` object with arrays of spells per level). Information about spells known or prepared is typically included as plain text within the description (`desc`) of a "Spellcasting" `trait`.

### `init_tiebreaker`
*   **Data Type:** `String`
*   **Required:** No (Defaults to "0")
*   **Description:** Value for the initiative tiebreaker. To use Dexterity, set to `"@{dexterity}/100"`.
*   **Example for Dex tiebreaker:** `"init_tiebreaker": "@{dexterity}/100"`
*   **Example for no tiebreaker:** `"init_tiebreaker": "0"`

### `legendary`
*   **Data Type:** `Object`
*   **Required:** No
*   **Description:** Contains legendary action information.
*   **Structure:**
    *   `count` (Number): The number of legendary actions the creature can take. Populates `npc_legendary_actions`.
    *   `actions` (Array<Object>): An array of legendary action objects. See **Repeating Sections: Legendary Actions** for the structure of these objects.
*   **Example:** `"legendary": { "count": 3, "actions": [ /* ... legendary action objects ... */ ] }`

### `mythic_actions`
*   **Data Type:** `Object`
*   **Required:** No
*   **Description:** Contains Mythic Action information. This section is intended to be used for Lair Actions, as the Roll20 5e sheet does not have a dedicated Lair Action UI but does have a Mythic Action section that can be repurposed.
*   **Structure:**
    *   `desc` (String, Required): The overall description for the mythic/lair actions, often detailing when they can be used (e.g., "On initiative count 20 (losing initiative ties)..."). This populates the main description field for the mythic action section on the sheet (`npc_mythic_actions_desc`).
    *   `actions` (Array<Object>, Required): An array of mythic/lair action objects that will be created as repeating entries in the mythic actions section of the sheet.
        *   **Object Structure (for each mythic/lair action):**
            *   `name` (String, Required): The name of the mythic/lair action.
            *   `desc` (String, Required): The description of the mythic/lair action.
*   **Example (for Lair Actions):**
    ```json
    "mythic_actions": {
      "desc": "On initiative count 20 (losing initiative ties), the Devourer can take a lair action to cause one of the following effects; it can't use the same effect two rounds in a row:",
      "actions": [
        {
          "name": "Grasping Shadows",
          "desc": "Grasping tendrils of shadow erupt from a point on the ground the Devourer can see within 120 feet..."
        },
        {
          "name": "Psychic Dissonance",
          "desc": "A wave of psychic dissonance washes over a 60-foot radius sphere..."
        }
      ]
    }
    ```

--- 

## Repeating Sections Fields

These fields are typically arrays of objects, where each object defines an item in a repeating section on the character sheet (e.g., an action, a trait).

### `traits`
*   **Data Type:** `Array<Object>`
*   **Required:** No
*   **Description:** An array of trait objects. Each object defines a special trait or ability.
*   **Object Structure (for each trait):**
    *   `name` (String, Required): The name of the trait.
    *   `desc` (String, Required): The description of the trait.
    *   `source` (String, Optional): The source of the trait (e.g., "Racial Trait").
    *   `source_type` (String, Optional): The type of source (e.g., "Monster Feature").
*   **Example:** 
    ```json
    "traits": [
        {
            "name": "Magic Resistance",
            "desc": "The creature has advantage on saving throws against spells and other magical effects."
        },
        {
            "name": "Immutable Form",
            "desc": "The creature is immune to any spell or effect that would alter its form.",
            "source": "Monster Manual",
            "source_type": "Creature Trait"
        }
    ]
    ```

### `actions`
*   **Data Type:** `Array<Object>`
*   **Required:** No
*   **Description:** An array of action objects. These are the standard actions a creature can take.
*   **Object Structure (for each action):** See **Action Object Structure** section below.

### `bonus_actions`
*   **Data Type:** `Array<Object>`
*   **Required:** No
*   **Description:** An array of bonus action objects. The script will set `npcbonusactionsflag` to "1" if this array is present and not empty.
*   **Object Structure (for each action):** See **Action Object Structure** section below.

### `reactions`
*   **Data Type:** `Array<Object>`
*   **Required:** No
*   **Description:** An array of reaction objects. The script will set `npcreactionsflag` to "1" if this array is present and not empty.
*   **Object Structure (for each action):** See **Action Object Structure** section below.

### `legendary.actions` (nested)
*   **Data Type:** `Array<Object>` (This array is a property of the top-level `legendary` object)
*   **Required:** No (but required if `legendary.count` > 0 and you want to define legendary actions).
*   **Description:** An array of legendary action objects. The items in this array follow the **Action Object Structure** detailed below.
*   **Note on `cost`:** While the **Action Object Structure** allows for a `cost` field, the current script primarily expects cost information (e.g., "(Costs 2 Actions)") to be part of the action's `name` or `desc` for display on the sheet. A separate `cost` field in the JSON is noted but not directly used by the script to format the cost string on the sheet.

<!-- Note: The individual actions within the top-level `mythic_actions.actions` array also follow the Action Object Structure. -->
<!-- No separate H3 for `mythic_actions` is needed here under Repeating Sections as its structure is defined under Top-Level Fields. -->

--- 

## Action Object Structure

This structure is used for objects within the `actions` (standard actions), `bonus_actions`, `reactions`, `legendary.actions` (nested array), and the `actions` array within the top-level `mythic_actions` object.

*   `name` (String, Required): The name of the action.
*   `desc` (String, Optional): The description of the action. For attacks, this often includes hit effects or alternative uses.
*   `attack` (Object, Optional): If the action involves an attack roll, this object contains attack details.
    *   `type` (String, Required if `attack` object present): Must be exactly `"Melee"` or `"Ranged"`. This determines the prefix in the attack display (e.g., "Melee Weapon Attack:" or "Ranged Spell Attack:") and is used by the script to determine if it's a melee or ranged type for other logic.
    *   `tohit` (String, Required if `attack` object present): The attack bonus, including sign (e.g., `"+7"`, `"-1"`).
    *   `distance` (String, Optional but typical for attacks): Preferred field for reach (for melee) or range (for ranged) of the attack (e.g., `"5 ft."`, `"60 ft."`, `"30/120 ft."`). The script will also accept `range` or `reach` as keys if `distance` is not found.
    *   `target` (String, Optional): The target of the attack (e.g., `"one target"`, `"one creature"`).
    *   `dmg1` (String, Optional): The primary damage roll (e.g., `"1d8+4"`, `"2d10"`).
    *   `type1` (String, Optional): The type of the primary damage (e.g., `"slashing"`, `"fire"`).
    *   `dmg2` (String, Optional): Secondary damage roll (e.g., for versatile weapons or additional effects).
    *   `type2` (String, Optional): Type of the secondary damage.
    *   `versatile_dmg1` (String, Optional): Damage if a melee weapon is used with two hands (specific to versatile property). The script may attempt to parse this and include it in the `desc` or `attack_onhit`.
    *   `save_dc` (Number, Optional): If the action forces a save (associated with an attack or as a rider effect).
    *   `save_ability` (String, Optional): The ability for the saving throw (e.g., `"Dexterity"`, `"Constitution"`).
    *   `save_effect` (String, Optional): Description of the effect on a failed save, or half damage on success.
*   `cost` (Number, Optional): For Legendary or Mythic actions, the number of actions this costs. While this field can be present, the current script expects cost information (e.g., "(Costs 2 Actions)") to be included in the action's `name` or `desc` for display on the character sheet.

*   **Example (Melee Attack Action):**
    ```json
    {
        "name": "Scimitar",
        "attack": {
            "type": "Melee",
            "tohit": "+5",
            "distance": "5 ft.", 
            "target": "one target",
            "dmg1": "1d6+3",
            "type1": "slashing"
        },
        "desc": "Hit: 6 (1d6 + 3) slashing damage."
    }
    ```

*   **Example (Ranged Spell Attack Action using `range` key):**
    ```json
    {
        "name": "Fire Bolt",
        "attack": {
            "type": "Ranged",
            "tohit": "+7",
            "range": "120 ft.", 
            "target": "one creature or object",
            "dmg1": "2d10",
            "type1": "fire"
        },
        "desc": "Hit: 11 (2d10) fire damage. A flammable object hit by this spell ignites if it isn\'t being worn or carried."
    }
    ```

*   **Example (Non-Attack Action with Save):**
    ```json
    {
        "name": "Frightful Presence",
        "desc": "Each creature of the dragon\'s choice that is within 120 feet of the dragon and aware of it must succeed on a DC 19 Wisdom saving throw or become frightened for 1 minute. A creature can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success."
    }
    ```

*   **Example (Legendary Action with Cost in Name and separate `cost` field for data):**
    ```json
    {
        "name": "Tail Attack (Costs 2 Actions)", 
        "cost": 2,
        "attack": {
            "type": "Melee",
            "tohit": "+11",
            "distance": "15 ft.",
            "target": "one target",
            "dmg1": "2d8+6",
            "type1": "bludgeoning"
        },
        "desc": "Hit: 15 (2d8 + 6) bludgeoning damage."
    }
    ```

*(This guide will be expanded with more details and edge cases as needed.)*