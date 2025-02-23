import { createTrait } from '../types/abilities.ts';
import { Skills } from '../types/skilltypes.ts';
import { EffectType, TargetType, GrappleType } from '../types/constants.ts';

export const slam = createTrait('Slam', {
  description: 'A forceful body slam attack',
  skill: Skills.HEAVY_WEAPONS,
  defenseOptions: [Skills.DODGE_GRACE, Skills.BLOCK_MIGHT],
  requirements: {
  },
    effects: [
      {
        type: EffectType.WOUND,
        params: { value: 1 }
      }
    ]
});

// Export a map of all default abilities
export const grab = createTrait('Grab', {
  description: 'A basic grab attempt',
  skill: Skills.GRAPPLE_MIGHT,
  // No defenseOptions - will use same skill as attacker (grapple[might])
  effects: [
    {
      type: EffectType.GRAPPLE,
      params: { type: GrappleType.GRAB }
    },
    {
      type: EffectType.COOLDOWN,
      params: { 
        duration: 2,
        abilityName: 'Grab'
      }
    }
  ]
});

export const abilities = {
  slam,
  grab
} as const;
