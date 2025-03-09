/**
 * This is a simple demonstration script that shows how defensive skill checks work
 * after the fix to the traitExecutor.ts file.
 * 
 * It simulates a combat between Clara and the Werewolf Elite, focusing on the defensive skill checks.
 */
import { Character } from '../types/actor';
import { CombatState } from '../types/combatState';
import { executeTrait } from '../game_engine/combat/traitExecutor';
import { loadAbility } from '../game_engine/abilityManager';
import { StatusName } from '../types/status';
import { CharacterType } from '../types/constants';

// Override the log function to print to console
import * as combatLogManager from '../game_engine/combat/combatLogManager';
const originalLogFunction = combatLogManager.logAndEmitCombatEvent;

// @ts-ignore - Override the function for this test
combatLogManager.logAndEmitCombatEvent = async (event) => {
  console.log(JSON.stringify(event, null, 2));
  return Promise.resolve();
};

async function runDemo() {
  console.log("=== WEREWOLF DEFENSE DEMONSTRATION ===");
  
  // Create a simplified werewolf character
  const werewolf: Character = {
    name: 'Werewolf Elite',
    type: CharacterType.MONSTER,
    attributes: {
      Might: 16,
      Grace: 16,
      Wit: 8,
      Will: 6
    },
    vitality: { max: 3, current: 3 },
    conviction: { max: 3, current: 3 },
    armor: { max: 0, current: 0 },
    statuses: [],
    traits: [],
    skills: {}
  } as Character;

  // Create a simplified Clara character
  const clara: Character = {
    name: 'Clara',
    type: CharacterType.HERO,
    attributes: {
      Might: 14,
      Grace: 14,
      Wit: 12,
      Will: 10
    },
    vitality: { max: 3, current: 3 },
    conviction: { max: 3, current: 3 },
    armor: { max: 2, current: 2 },
    statuses: [],
    traits: [],
    skills: {}
  } as Character;

  // Create a simplified combat state
  const state: CombatState = {
    characters: [werewolf, clara],
    activeCharacterIndex: 0,
    round: 1,
    isComplete: false,
    room: { name: 'Test Room' },
    playerActions: []
  } as CombatState;

  // Load abilities
  console.log("\n1. Loading abilities...");
  const stabAbility = loadAbility('hero.stab');
  const dodgeStanceAbility = loadAbility('core.dodge_stance');
  
  console.log("\nStab ability:");
  console.log(JSON.stringify(stabAbility, null, 2));
  
  console.log("\nDodge Stance ability:");
  console.log(JSON.stringify(dodgeStanceAbility, null, 2));
  
  // Add dodge_stance to werewolf's traits
  werewolf.traits.push(dodgeStanceAbility);
  
  // First scenario: Clara attacks without werewolf using dodge stance
  console.log("\n\n2. SCENARIO 1: Clara attacks without werewolf using dodge stance");
  console.log("Clara uses Stab on Werewolf Elite");
  await executeTrait(stabAbility, clara, werewolf, state);
  
  // Reset werewolf's health
  werewolf.vitality.current = 3;
  werewolf.statuses = [];
  
  // Second scenario: Werewolf uses dodge stance first, then Clara attacks
  console.log("\n\n3. SCENARIO 2: Werewolf uses dodge stance, then Clara attacks");
  console.log("Werewolf Elite uses Dodge Stance");
  await executeTrait(dodgeStanceAbility, werewolf, clara, state);
  
  // Check if the werewolf has the skill_boost status
  const skillBoostStatus = werewolf.statuses.find(s => 
    s.name === StatusName.SKILL_BOOST && s.params.skill === 'Dodge'
  );
  
  console.log("\nWerewolf Elite's statuses after using Dodge Stance:");
  console.log(JSON.stringify(werewolf.statuses, null, 2));
  
  console.log("\nClara uses Stab on Werewolf Elite (who now has Dodge boost)");
  await executeTrait(stabAbility, clara, werewolf, state);
  
  // Restore the original log function
  // @ts-ignore
  combatLogManager.logAndEmitCombatEvent = originalLogFunction;
  
  console.log("\n=== DEMONSTRATION COMPLETE ===");
}

// Run the demo
runDemo().catch(console.error);
