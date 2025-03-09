import { describe, it, expect } from 'vitest';
import { makeOpposedCheck } from '../src/game_engine/utils/skillCheck';
import { SkillNames } from '../src/types/skilltypes';

describe('Opposed Skill Checks', () => {
  it('should correctly select the best defensive skill and include it in the result', () => {
    // Create simple character objects for testing
    const attacker = {
      name: 'Attacker',
      attributes: {
        Might: 10,
        Grace: 12,
        Wit: 8,
        Will: 6
      },
      skills: {},
      statuses: []
    } as any;

    const defender = {
      name: 'Defender',
      attributes: {
        Might: 8,
        Grace: 14,
        Wit: 10,
        Will: 8
      },
      skills: {},
      statuses: []
    } as any;

    // Test an opposed check with defense options
    const result = makeOpposedCheck(
      attacker,
      SkillNames.LIGHT_WEAPONS,
      defender,
      [SkillNames.DODGE, SkillNames.BLOCK]
    );

    // Verify that the result includes the defender's skill
    expect(result.defenderSkill).toBeDefined();
    
    // Since Grace (14) > Might (8), the defender should use Dodge (Grace-based) instead of Block (Might-based)
    expect(result.defenderSkill).toBe(SkillNames.DODGE);
    
    // Verify other properties of the result
    expect(result.attacker).toBeDefined();
    expect(result.defender).toBeDefined();
    expect(typeof result.margin).toBe('number');
    expect(typeof result.attackerWins).toBe('boolean');
  });
});
