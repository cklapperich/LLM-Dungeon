import { describe, test, expect, beforeEach, vi } from 'vitest';
import { Character } from '../types/actor';
import { CombatState } from '../types/combatState';
import { executeTrait } from '../game_engine/combat/traitExecutor';
import { loadAbility } from '../game_engine/abilityManager';
import { StatusName } from '../types/status';
import { CharacterType } from '../types/constants';

// Mock the log function to capture logs
const logs: string[] = [];
vi.mock('../game_engine/combat/combatLogManager', () => ({
  logAndEmitCombatEvent: vi.fn().mockImplementation((event) => {
    logs.push(JSON.stringify(event));
    return Promise.resolve();
  })
}));

describe('Defensive Skill Checks', () => {
  let werewolf: Character;
  let clara: Character;
  let state: CombatState;

  beforeEach(() => {
    // Create a simplified werewolf character
    werewolf = {
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
    clara = {
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
    state = {
      characters: [werewolf, clara],
      activeCharacterIndex: 0,
      round: 1,
      isComplete: false,
      room: { name: 'Test Room' },
      playerActions: []
    } as CombatState;

    // Clear logs
    logs.length = 0;
  });

  test('Werewolf should use Dodge when Clara attacks', async () => {
    // Load the stab ability for Clara
    const stabAbility = loadAbility('hero.stab');
    
    // Add dodge_stance to werewolf's traits
    const dodgeStanceAbility = loadAbility('core.dodge_stance');
    werewolf.traits.push(dodgeStanceAbility);
    
    // First, have the werewolf use dodge_stance
    await executeTrait(dodgeStanceAbility, werewolf, clara, state);
    
    // Check if the werewolf has the skill_boost status
    const skillBoostStatus = werewolf.statuses.find(s => 
      s.name === StatusName.SKILL_BOOST && s.params.skill === 'Dodge'
    );
    
    expect(skillBoostStatus).toBeDefined();
    expect(skillBoostStatus?.params.value).toBe(6);
    
    // Now have Clara use stab on the werewolf
    await executeTrait(stabAbility, clara, werewolf, state);
    
    // Check the logs to see if a defensive skill check was made
    const defensiveCheckLog = logs.find(log => 
      log.includes('"is_opposed":true') && 
      log.includes('"actor":"Clara"') && 
      log.includes('"target":"Werewolf Elite"')
    );
    
    expect(defensiveCheckLog).toBeDefined();
    
    // Parse the log to check if the werewolf's dodge was used
    const logObj = JSON.parse(defensiveCheckLog);
    expect(logObj.opposed_result).toBeDefined();
    
    // The werewolf should have a high dodge value due to the skill boost
    const werewolfDodgeValue = logObj.opposed_result.attribute;
    expect(werewolfDodgeValue).toBeGreaterThanOrEqual(16 + 6); // Grace + Dodge boost
  });
});
