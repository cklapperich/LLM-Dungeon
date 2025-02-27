import { createTrait } from '../../types/abilities.ts';
import { Skills } from '../../types/skilltypes.ts';
import { EffectType, GrappleType, RarityType} from '../../types/constants.ts';
import { StatusName } from '../../types/status.ts';

export const slam = createTrait('Slam', {
  description: 'A forceful body slam attack',
  skill: Skills.HEAVY_WEAPONS,
  defenseOptions: [Skills.DODGE_GRACE, Skills.BLOCK_MIGHT],
  requirements: {
    parts: {
    }
  },
    effects: [
      {
        type: EffectType.WOUND,
        params: { value: 1 },
        target: 'other'
      }
    ]
});

// Export a map of all default abilities
export const grab = createTrait('Grab', {
  description: 'A basic grab attempt',
  skill: Skills.GRAPPLE_MIGHT,
  defenseOptions: [Skills.BREAK_FREE_MIGHT, Skills.SLIP_FREE_GRACE],
  requirements: {
    parts: {
    }
  },
    effects: [
      {
        type: EffectType.GRAPPLE,
        params: { type: GrappleType.GRAB },
        target: 'other'
      },
      {
        type: EffectType.STATUS,
        params: {
          type: StatusName.ABILITY_COOLDOWN,
          abilityName: 'Grab',
          duration: 2
        },
        target: 'self',
        applyOnSkillCheckFailure: true
      }
    ]
});

// Hero-only actions
export const hero_actions = { 
  breakFree: createTrait('Break Free', {
    description: 'Attempt to break free using might, freeing all limbs bound during this grapple',
    rarity: RarityType.COMMON,
    skill: Skills.BREAK_FREE_MIGHT,
    defenseOptions: [Skills.GRAPPLE_MIGHT, Skills.GRAPPLE_GRACE],
    effects: [
      {
        type: EffectType.BREAK_FREE,
        params: { type: 'full' },
        target: 'self'
      }
    ]
  }),
  slipFree: createTrait('Slip Free', {
    description: 'Attempt to slip free using grace, freeing all limbs bound during this grapple',
    rarity: RarityType.COMMON,
    skill: Skills.SLIP_FREE_GRACE,
    defenseOptions: [Skills.GRAPPLE_MIGHT, Skills.GRAPPLE_GRACE],
    effects: [
      {
        type: EffectType.BREAK_FREE,
        params: { type: 'full' },
        target: 'self'
      }
    ]
  })
} as const;

// System actions
export const pass = createTrait('Pass', {
    description: 'End your turn without taking any action',
    skill: Skills.NONE,
    defenseOptions: [],
    effects: [
        {
            type: EffectType.ADVANCE_TURN,
            params: {},
            target: 'self'
        }
    ]
});

export const exitCombat = createTrait('Exit Combat', {
    description: 'Exit combat (only available when combat is complete)',
    skill: Skills.NONE,
    defenseOptions: [],
    effects: [
        {
            type: EffectType.END_COMBAT,
            params: {
                outcome: 'exit'
            },
            target: 'self'
        }
    ]
});

export const system_actions = { pass, exitCombat } as const;

export const penetrate = createTrait('Penetrate', {
  description: 'The monster penetrates an orifice with a tongue, phallus, or other appendage.',
  skill: Skills.GRAPPLE_MIGHT,
  defenseOptions: [Skills.BREAK_FREE_MIGHT, Skills.SLIP_FREE_GRACE],
  requirements: {
    parts: {
    },
    statuses: [{
      name: StatusName.GRAPPLED,
      stacks: 1,
      target: 'other'
    }],
    clothing: {
      maxLevel: 0
    }
  },
  effects: [
    {
      type: EffectType.STATUS,
      params: {
        type: StatusName.PENETRATED
      },
      target: 'other'
    },
  ]
});

export const shred = createTrait('Shred', {
  description: 'Tear away at clothing with acid or claw',
  skill: Skills.GRACE,
  defenseOptions: [Skills.DODGE_GRACE],
  requirements: {
    parts: {
    }
  },
  effects: [
    {
      type: EffectType.MODIFY_CLOTHING,
      params: { amount: -1 },
      target: 'other'
    },
    {
      type: EffectType.STATUS,
      params: {
        type: StatusName.ABILITY_COOLDOWN,
        abilityName: 'Shred',
        duration: 2
      },
      target: 'self',
      applyOnSkillCheckFailure: true
    }
  ]
});

export const abilities = {
    slam,
    grab,
    penetrate,
    shred
} as const;
