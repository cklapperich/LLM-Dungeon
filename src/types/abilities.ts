import { SkillName, Skills } from './skilltypes.js';
import {
  TargetType,
  RarityType,
  type Target,
  type Rarity,
  type RoomAttributeType
} from './constants.js';
import { Effect } from '../game_engine/combat/effect.js';

import { BodyPartType, type BodyPart } from './constants.js';

type StatusRequirement = {
  name: string,
  stacks: number,
  target: 'self' | 'other'
}

type RoomAttributeRequirement = {
  attribute: RoomAttributeType,
  value: number,
  comparison: 'eq' | 'neq' | 'lt' | 'lte' | 'gt' | 'gte'
}

type AbilityRequirements = {
  parts?: Partial<Record<BodyPart, number>>,
  statuses?: StatusRequirement[],
  clothing?: {
    maxLevel: number
  },
  room_attributes?: RoomAttributeRequirement[]
}

// Import event types
import { CombatEventType, DungeonEventType, PhaseChangeSubtype } from '../events/eventTypes';

// More specific event type for passive abilities
type PassiveEventType = {
  type: CombatEventType | DungeonEventType;
  subtype?: string; // For events with subtypes like PHASECHANGE
};

type Trait = {
  name: string;  // Display name shown to players
  description: string;
  rarity: Rarity;

  // Combat mechanics
  skill: SkillName;
  defenseOptions: SkillName[]; // Array of skills the defender can choose from
  modifier: number;
  priority: boolean;
  requirements?: AbilityRequirements;

  // Passive ability properties
  passive?: boolean;  // Whether this trait is a passive ability
  passive_event_type?: PassiveEventType;  // What event type triggers this passive ability
  last_triggered_round?: number;  // Track when this passive was last triggered (for once-per-round limit)

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
    passive: defaults.passive ?? false,
    ...(defaults.passive_event_type && { passive_event_type: defaults.passive_event_type }),
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

/**
 * Check if a passive ability can be triggered in the current round
 * Enforces the once-per-round limit for passive abilities
 */
function canTriggerPassive(trait: Trait, currentRound: number): boolean {
  // If not a passive ability, it can't be triggered as a passive
  if (!trait.passive) return false;

  // If it hasn't been triggered yet or was triggered in a previous round, it can be triggered
  return trait.last_triggered_round === undefined || trait.last_triggered_round < currentRound;
}

/**
 * Mark a passive ability as triggered in the current round
 */
function markPassiveTriggered(trait: Trait, currentRound: number): void {
  if (trait.passive) {
    trait.last_triggered_round = currentRound;
  }
}

// Deep copy a trait
function copyTrait(trait: Trait): Trait {
  return JSON.parse(JSON.stringify(trait));
}

export type {
  Effect,
  AbilityRequirements,
  Trait,
  PassiveEventType
};

export {
  createTrait,
  copyTrait,
  targetsSelf,
  targetsOther,
  canTriggerPassive,
  markPassiveTriggered
};
