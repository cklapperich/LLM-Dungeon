import { createTrait } from '../types/abilities.ts';
import { Skills } from '../types/skilltypes.ts';
import { EffectType, TargetType } from '../types/constants.ts';

export const slam = createTrait('Slam', {
  description: 'A forceful body slam attack',
  skill: Skills.HEAVY_WEAPONS,
  defenseOptions: [Skills.DODGE_GRACE, Skills.BLOCK_MIGHT],
  bodyParts: {
    arms: 1
  },
    effects: [
      {
        type: EffectType.WOUND,
        value: 1
      }
    ]
});

// Export a map of all default abilities
export const abilities = {
  slam
} as const;
