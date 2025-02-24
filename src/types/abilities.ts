import { SkillName, Skills } from './skilltypes.js';
import { 
    TargetType, 
    RarityType,
    type Target,
    type Rarity
} from './constants.js';
import { Effect } from '../game_engine/effect.js';

import { BodyPartType, type BodyPart } from './constants.js';

type StatusRequirement = {
  name: string,
  stacks: number,
  target: 'self' | 'other'
}

type BodyPartRequirements = {
  parts?: Partial<Record<BodyPart, number>>,
  statuses?: StatusRequirement[],
  clothing?: {
    maxLevel: number
  }
}

type Trait = {
  name: string;  // Display name shown to players
  description: string;
  rarity: Rarity;
  
  // Combat mechanics
  skill: SkillName;
  defenseOptions: SkillName[]; // Array of skills the defender can choose from
  modifier: number;
  priority: boolean;
  requirements?: BodyPartRequirements;
  
  // What happens on hit
  effects: Effect[];
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
    priority: defaults.priority ?? false,
    effects: defaults.effects ?? [],
    ...(defaults.requirements && { requirements: defaults.requirements })
  };
}

// Helper functions to determine trait targeting
function targetsSelf(trait: Trait): boolean {
  return trait.effects.some(effect => effect.target === 'self');
}

function targetsOther(trait: Trait): boolean {
  return trait.effects.some(effect => effect.target === 'other' || !effect.target); // default is 'other'
}

// Deep copy a trait
function copyTrait(trait: Trait): Trait {
  return JSON.parse(JSON.stringify(trait));
}

export type {
  Effect,
  BodyPartRequirements,
  Trait
};

export {
  createTrait,
  copyTrait,
  targetsSelf,
  targetsOther
};
