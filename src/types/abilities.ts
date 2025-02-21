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
  value: number; // Defaults to 1
  skill?: string | null; // Defaults to null
}

type BodyPartRequirements = {
  arms?: number;
  legs?: number;
  mouth?: number;
}

type Trait = {
  id: string;
  name: string;
  description: string;
  rarity: Rarity;
  
  // Combat mechanics
  skill: SkillName;
  defenseOptions: SkillName[]; // Array of skills the defender can choose from
  modifier: number;
  target: Target;
  priority: boolean;
  bodyParts?: BodyPartRequirements;
  
  // What happens on hit
  effects: Effect[];
}

// Create a new trait with default values
function createTrait(id: string, defaults: Partial<Trait> = {}): Trait {
  return {
    id,
    name: defaults.name ?? id,
    description: defaults.description ?? "",
    rarity: defaults.rarity ?? RarityType.COMMON,
    skill: defaults.skill ?? Skills.GRAPPLE_MIGHT,
    defenseOptions: defaults.defenseOptions ?? [], // Empty array means use same skill as attacker
    modifier: defaults.modifier ?? 0,
    target: defaults.target ?? TargetType.OPPONENT,
    priority: defaults.priority ?? false,
    effects: defaults.effects ?? [],
    ...(defaults.bodyParts && { bodyParts: defaults.bodyParts })
  };
}

// Deep copy a trait
function copyTrait(trait: Trait): Trait {
  return JSON.parse(JSON.stringify(trait));
}

// Example trait
const bite = createTrait('bite', {
  name: 'Bite',
  description: 'A sharp bite attack',
  skill: Skills.HEAVY_WEAPONS,
  defenseOptions: [Skills.DODGE_GRACE, Skills.BLOCK_MIGHT], // Defender can use either Dodge or Block
  modifier: 2,
  bodyParts: {
    mouth: 1
  },
  effects: [
    {
      type: EffectType.WOUND,
      value: 1
    }
  ]
});

export type {
  Effect,
  BodyPartRequirements,
  Trait
};

export {
  createTrait,
  copyTrait
};
