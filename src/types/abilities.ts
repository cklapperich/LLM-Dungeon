import { SkillName, Skills } from './skilltypes.js';
import { 
    TargetType, 
    RarityType, 
    EffectType,
    type Target,
    type Rarity,
    type EffectTypes
} from './constants.js';

type Effect = {
  type: EffectTypes;
  params: Record<string, any>;  // Different params for different effect types
}

type Requirements = {
  limbs?: {
    arms?: number;
    legs?: number;
    mouth?: number;
  }
}

type Trait = {
  name: string;
  description: string;
  rarity: Rarity;
  
  // Combat mechanics
  skill: SkillName;
  defenseOptions: SkillName[]; // Array of skills the defender can choose from
  modifier: number;
  target: Target;
  priority: boolean;
  requirements?: Requirements;
  
  // What happens on hit
  effects: Effect[];

  // Cooldown tracking
  cooldown?: {
    duration: number;  // How many rounds the cooldown lasts
    current: number;   // Current rounds remaining on cooldown
  }
}

// Create a new trait with default values
function createTrait(name: string, defaults: Partial<Trait> = {}): Trait {
  return {
    name,
    description: defaults.description ?? "",
    rarity: defaults.rarity ?? RarityType.COMMON,
    skill: defaults.skill ?? Skills.GRAPPLE_MIGHT,
    defenseOptions: defaults.defenseOptions ?? [], // Empty array means use same skill as attacker
    modifier: defaults.modifier ?? 0,
    target: defaults.target ?? TargetType.OPPONENT,
    priority: defaults.priority ?? false,
    effects: defaults.effects ?? [],
    ...(defaults.requirements && { requirements: defaults.requirements }),
    ...(defaults.cooldown && { cooldown: { ...defaults.cooldown, current: 0 } })
  };
}

// Deep copy a trait
function copyTrait(trait: Trait): Trait {
  return JSON.parse(JSON.stringify(trait));
}

const defaultDefenseOptions=["Dodge[Grace]","Block[Might"];
// Example trait
const bite = createTrait('Bite', {
  description: 'A sharp bite attack',
  skill: Skills.HEAVY_WEAPONS,
  defenseOptions: [Skills.DODGE_GRACE, Skills.BLOCK_MIGHT], // Defender can use either Dodge or Block
  modifier: 2,
  requirements: {
    limbs: {
      mouth: 1
    }
  },
    effects: [
      {
        type: EffectType.WOUND,
        params: { value: 1 }
      }
    ]
});

export type {
  Effect,
  Requirements,
  Trait
};

export {
  createTrait,
  copyTrait,
  defaultDefenseOptions
};
