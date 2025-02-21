import { createTrait, EffectType, TargetType } from './types/abilities.js';
import { Skills } from './types/skilltypes.js';

export const punch = createTrait('punch', {
  name: 'Punch',
  description: 'A basic punch attack',
  skill: Skills.MIGHT,
  opposedSkill: Skills.GRACE,
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

export const grapple = createTrait('grapple', {
  name: 'Grapple',
  description: 'Attempt to grab and hold your opponent',
  skill: Skills.MIGHT,
  opposedSkill: Skills.GRACE,
  bodyParts: {
    arms: 1
  },
  effects: [
    {
      type: EffectType.GRAPPLE,
      value: 1
    }
  ]
});

export const resist = createTrait('resist', {
  name: 'Resist',
  description: "Brace yourself against grappling attempts. Does nothing if oponnent doesn't grapple!",
  skill: Skills.MIGHT,
  opposedSkill: Skills.MIGHT,
  priority: true,
  bodyParts: {
    arms: 1
  },
  effects: [
    {
      type: EffectType.STAT_CHANGE,
      value: 4,
      skill: Skills.MIGHT
    }
  ]
});

// Export a map of all default abilities
export const abilities = {
  punch,
  grapple,
  resist
} as const;
