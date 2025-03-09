import { loadAbility } from '../abilityManager';

// Ability ID constants
export const ABILITY_IDS = {
  // Core abilities
  SLAM: 'core.slam',
  GRAB: 'core.grab',
  PENETRATE: 'core.penetrate',
  SHRED: 'core.shred',
  
  // Bodypart abilities
  CEILING_DROP: 'wings.ceiling_drop',
  
  // Hero abilities
  BREAK_FREE: 'hero.break_free',
  SLIP_FREE: 'hero.slip_free',
  
  // System actions
  PASS: 'system.pass',
  EXIT_COMBAT: 'system.exit_combat'
};

// Helper functions to load abilities by ID
export function getMonsterAbility(id: string) {
  return loadAbility(id);
}

export function getHeroAbility(id: string) {
  return loadAbility(id);
}

export function getSystemAction(id: string) {
  return loadAbility(id);
}

// For backward compatibility
export const system_actions = {
  get pass() { return loadAbility(ABILITY_IDS.PASS); },
  get exitCombat() { return loadAbility(ABILITY_IDS.EXIT_COMBAT); }
};

export const default_hero_abilities = {
  get breakFree() { return loadAbility(ABILITY_IDS.BREAK_FREE); },
  get slipFree() { return loadAbility(ABILITY_IDS.SLIP_FREE); }
};

export const default_monster_abilities = {
  get slam() { return loadAbility(ABILITY_IDS.SLAM); },
  get grab() { return loadAbility(ABILITY_IDS.GRAB); },
  get penetrate() { return loadAbility(ABILITY_IDS.PENETRATE); },
  get shred() { return loadAbility(ABILITY_IDS.SHRED); },
  get ceilingDrop() { return loadAbility(ABILITY_IDS.CEILING_DROP); }
};
