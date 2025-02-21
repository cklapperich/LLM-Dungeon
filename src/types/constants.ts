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
    STAT_CHANGE: 'STAT_CHANGE',
    STATUS: 'STATUS',
    HEAL: 'HEAL',
    WOUND: 'WOUND',
    GRAPPLE: 'GRAPPLE',
    CORRUPT: 'CORRUPT'
} as const;

export const LimbType = {
    LEFT_ARM: 'leftArm',
    RIGHT_ARM: 'rightArm',
    LEFT_LEG: 'leftLeg',
    RIGHT_LEG: 'rightLeg',
    MOUTH: 'mouth'
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
export type Limb = typeof LimbType[keyof typeof LimbType];

export const RoomType = {
    EMPTY: 0,
    CORRIDOR: 'corridor',
    CHAMBER: 'chamber'
} as const;

export type RoomTypeValue = typeof RoomType[keyof typeof RoomType];
