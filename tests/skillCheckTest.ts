import { makeSkillCheck, makeOpposedCheck, Difficulty } from '../src/utils/skillCheck.ts';
import { formatRollResult, formatOpposedResult } from '../src/utils/textUI.ts';
import { Skills } from '../src/types/skillNames.ts';

// Example character attributes
const cultist = {
    name: "Shadow Cultist",
    might: 12,
    grace: 14,
    mind: 13,
    will: 11,
    skills: {
        [Skills.LIGHT_WEAPONS]: 4,  // Proficient (+4)
        [Skills.STEALTH]: 4,       // Proficient (+4)
        [Skills.ARCANE_KNOWLEDGE]: 4 // Proficient (+4)
    }
};

// Example 1: Basic unopposed skill check
console.log("Example 1: Basic Might check (no proficiency)");
const basicMightCheck = makeSkillCheck(cultist, Skills.MIGHT);
console.log(formatRollResult(basicMightCheck));
console.log();

// Example 2: Skill check with proficiency
console.log("Example 2: Light Weapons check (with proficiency)");
const lightWeaponsCheck = makeSkillCheck(cultist, Skills.LIGHT_WEAPONS);
console.log(formatRollResult(lightWeaponsCheck));
console.log();

// Example 3: Difficult skill check
console.log("Example 3: Hard Stealth check (with proficiency)");
const hardStealthCheck = makeSkillCheck(cultist, Skills.STEALTH, Difficulty.Hard);
console.log(formatRollResult(hardStealthCheck));
console.log();

// Example 4: Very Hard check without proficiency
console.log("Example 4: Very Hard Mind check (no proficiency)");
const veryHardMindCheck = makeSkillCheck(cultist, Skills.MIND, Difficulty.VeryHard);
console.log(formatRollResult(veryHardMindCheck));
console.log();

// Example 5: Easy check
console.log("Example 5: Easy Arcane Knowledge check (with proficiency)");
const easyArcaneCheck = makeSkillCheck(cultist, Skills.ARCANE_KNOWLEDGE, Difficulty.Easy);
console.log(formatRollResult(easyArcaneCheck));
console.log();

// Example 6: Opposed check with explicit skills (Stealth vs Detection)
console.log("Example 6: Opposed Check - Stealth vs Detection (Explicit)");
const guard = {
    name: "Guard",
    might: 13,
    grace: 12,
    mind: 14,
    will: 12,
    skills: {
        [Skills.TRAP_DETECTION]: 0  // Not proficient
    }
};

const opposedCheck = makeOpposedCheck(
    cultist,
    Skills.STEALTH,
    guard,
    Skills.TRAP_DETECTION
);
console.log(formatOpposedResult(opposedCheck));
console.log();

// Example 7: Opposed check with automatic skill lookup (Intimidation vs Will)
console.log("Example 7: Opposed Check - Intimidation vs Will (Automatic)");
const victim = {
    name: "Merchant",
    might: 10,
    grace: 11,
    mind: 12,
    will: 10,
    skills: {
        [Skills.WILL]: 0  // Not proficient
    }
};

const intimidationCheck = makeOpposedCheck(
    cultist,
    Skills.INTIMIDATION,
    victim  // Will be automatically used as defender's skill
);
console.log(formatOpposedResult(intimidationCheck));
console.log();

// Example 8: Opposed check with attribute vs attribute
console.log("Example 8: Opposed Check - Might vs Might (Automatic)");
const wrestler = {
    name: "Wrestler",
    might: 15,
    grace: 12,
    mind: 10,
    will: 11,
    skills: {
        [Skills.MIGHT]: 4
    }
};

const opposedMightCheck = makeOpposedCheck(
    wrestler,
    Skills.MIGHT,
    cultist  // Will automatically use Might as defender's skill
);
console.log(formatOpposedResult(opposedMightCheck));
