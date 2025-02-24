export enum ModifierType {
  SKILL = 'skill',
  ATTRIBUTE = 'attribute',
  FLAG = 'flag'
}

export enum StatusSource {
  SYSTEM = 'system',
  SELF = 'self',
  OTHER = 'other'
}

// Common status names for reference/type safety
export enum StatusName {
  HEAT = 'heat',
  SLOW = 'slow',
  WEAKEN = 'weaken',
  GRAPPLED = 'grappled',
  BOUND_ARMS = 'bound_arms',
  BOUND_LEGS = 'bound_legs',
  BOUND_MOUTH = 'bound_mouth',
  BOUND_TAIL = 'bound_tail',
  BOUND_MONSTER_PART = 'bound_monster_part',
  PENETRATED = 'penetrated',
  INSEMINATED = 'inseminated',
  ABILITY_COOLDOWN = 'cooldown',
  EXHAUSTION = 'exhaustion'
}

export interface ModifierResult {
  skill_modifiers: Record<string, number>;
  attribute_modifiers: Record<string, number>;
}

export interface Status {
  id: string;
  name: string;
  source: StatusSource;
  sourceAbility?: string;
  sourceEffect?: string;
  duration?: number;
  stacks: number;
  max_stacks: number;
  is_negative: boolean;
  params: Record<string, any>;
}

export interface BuiltInStatus {
  name: string;
  defaultParams: Record<string, any>;
  getModifiers: (status: Status, gameState: any) => ModifierResult;
  createInstance: (params?: Record<string, any>) => Status;
}

export interface StatusCreationJson {
  type: string;  // Must reference a built-in status
  params?: Record<string, any>;
  source?: StatusSource;
  sourceAbility?: string;
  sourceEffect?: string;
  duration?: number;
  stacks?: number;
}
