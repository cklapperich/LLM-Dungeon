import { createTrait } from './types/abilities.js';
import { Skills } from './types/skilltypes.js';
import { EffectType, TargetType } from './types/constants.js';

export const slam = createTrait('Slam', {
  description: 'A forceful body slam attack',
  skill: Skills.HEAVY_WEAPONS,
  defenseOptions: [Skills.DODGE_GRACE, Skills.BLOCK_MIGHT],
  bodyParts: {
    arms: 1
  },
    effects: [
      {
        type: 'WOUND',
        value: 1
      }
    ]
});

export const grapple = createTrait('Grapple', {
  description: 'Attempt to grab and hold your opponent',
  skill: Skills.GRAPPLE_MIGHT,
  defenseOptions: [Skills.DODGE_GRACE, Skills.GRAPPLE_GRACE],
  bodyParts: {
    arms: 1
  },
    effects: [
      {
        type: 'GRAPPLE',
        value: 1
      }
    ]
});

export const resist = createTrait('Resist', {
  description: "Brace yourself against grappling attempts. Does nothing if opponent doesn't grapple!",
  skill: Skills.GRAPPLE_MIGHT,
  defenseOptions: [Skills.GRAPPLE_MIGHT],
  priority: true,
  bodyParts: {
    arms: 1
  },
    effects: [
      {
        type: 'STAT_CHANGE',
        value: 4,
        skill: Skills.GRAPPLE_MIGHT
      }
    ]
});

// Export a map of all default abilities
export const abilities = {
  slam,
  grapple,
  resist
} as const;
