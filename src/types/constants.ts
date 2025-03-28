// Constants/Enums for the game system
export const TargetType = {
    SELF: 'self',
    OPPONENT: 'opponent'
} as const;

export const RarityType = {
    COMMON: 'common',
    RARE: 'rare',
    LEGENDARY: 'legendary'
} as const;

export const EffectType = {
    STATUS: 'STATUS',
    HEAL: 'HEAL',
    WOUND: 'WOUND',
    GRAPPLE: 'GRAPPLE',
    CORRUPT: 'CORRUPT',
    BREAK_FREE: 'BREAK_FREE',
    ADVANCE_TURN: 'ADVANCE_TURN',
    END_COMBAT: 'END_COMBAT',
    MODIFY_CLOTHING: 'MODIFY_CLOTHING',
    SCRIPT: 'SCRIPT',
    PENETRATE: 'PENETRATE'
} as const;

export const BodyPartType = {
    ARM: 'arm',
    LEG: 'leg',
    MOUTH: 'mouth',
    TONGUE: 'tongue',
    TAIL: 'tail',
    TENTACLE: 'tentacle',
    HOOF: 'hoof',
    HORN: 'horn',
    CLAW: 'claw',
    VENOM_INJECTOR: 'venom_injector',  // stingers/fangs/quills
    BRAIN: 'brain',
    WEBSPINNER: 'webspinner',
    WING: 'wing',
    GILL: 'gill',
    ROOT: 'root',
    REACTOR_CORE: 'reactor_core',
    POUCH: 'pouch',
    SPORE: 'spore',
    OVIPOSITOR: 'ovipositor'
} as const;

export enum RoomCapacity {
    SMALL = 1,    // Can fit size 1 monster
    MEDIUM = 2,   // Can fit size 1-2 monsters
    LARGE = 3     // Can fit size 1-3 monsters
}

export enum MonsterSize {
    SMALL = 1,    // Fits in any room
    MEDIUM = 2,   // Needs MEDIUM or LARGE room
    LARGE = 3     // Only fits in LARGE room
}

// Type helpers for the constants
export type Target = typeof TargetType[keyof typeof TargetType];
export type Rarity = typeof RarityType[keyof typeof RarityType];
export type EffectTypes = typeof EffectType[keyof typeof EffectType];

export const IntensityType = {
    CRITICAL_SUCCESS: 'critical_success',
    SOLID_SUCCESS: 'solid_success',
    MINIMAL_SUCCESS: 'minimal_success',
    MINIMAL_FAILURE: 'minimal_failure',
    SOLID_FAILURE: 'solid_failure',
    CRITICAL_FAILURE: 'critical_failure'
} as const;

export type IntensityTypes = typeof IntensityType[keyof typeof IntensityType];
export type BodyPart = typeof BodyPartType[keyof typeof BodyPartType];

export const RoomType = {
    EMPTY: 0,
    CORRIDOR: 'corridor',
    CHAMBER: 'chamber'
} as const;

export const CharacterType = {
    HERO: 'hero',
    MONSTER: 'monster'
} as const;

export type RoomTypeValue = typeof RoomType[keyof typeof RoomType];
export type CharacterTypeValue = typeof CharacterType[keyof typeof CharacterType];

// Combat state flags
export const CombatFlags = {
    GRAPPLED: 'grappled',
    PENETRATED: 'penetrated'
} as const;

export const GrappleType = {
    GRAB: 'grab',
    PENETRATE: 'penetrate'
} as const;

export type CombatFlagTypes = typeof CombatFlags[keyof typeof CombatFlags];
export type GrappleTypes = typeof GrappleType[keyof typeof GrappleType];

export const EventContext = {
    STATUS: 'status'
} as const;

export type EventContextType = typeof EventContext[keyof typeof EventContext];

export const LightLevel = {
    DARK: 1,
    DIM: 2,
    BRIGHT: 3
} as const;

export type LightLevelType = typeof LightLevel[keyof typeof LightLevel];

export const MoistureLevel = {
    DRY: 1,
    DAMP: 2,
    FLOODED: 3
} as const;

export type MoistureLevelType = typeof MoistureLevel[keyof typeof MoistureLevel];

export const CeilingHeight = {
    LOW: 1,
    NORMAL: 2,
    HIGH: 3
} as const;

export type CeilingHeightType = typeof CeilingHeight[keyof typeof CeilingHeight];

export const RoomAttribute = {
    LIGHT_LEVEL: 'light_level',
    MOISTURE: 'moisture',
    CEILING_HEIGHT: 'ceiling_height'
} as const;

export type RoomAttributeType = typeof RoomAttribute[keyof typeof RoomAttribute];

export const CombatEndReason = {
    DEATH: 'death',
    BREEDING: 'breeding',
    ESCAPE: 'escape',
    SURRENDER: 'surrender'
} as const;

export type CombatEndReasonType = typeof CombatEndReason[keyof typeof CombatEndReason];
