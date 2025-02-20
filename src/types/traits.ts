// Constants/Enums
const TargetType = {
    SELF: 'self',
    OPPONENT: 'opponent'
  } as const;
  
  const RarityType = {
    COMMON: 'common',
    RARE: 'rare',
    LEGENDARY: 'legendary'
  } as const;
  
  const EffectType = {
    STAT_CHANGE: 'stat_change',
    STATUS: 'status',
    HEAL: 'heal',
    WOUND: 'wound',
    GRAPPLE: 'grapple',
    CORRUPT: 'corrupt'
  } as const;
  
  type Target = typeof TargetType[keyof typeof TargetType];
  type Rarity = typeof RarityType[keyof typeof RarityType];
  type EffectTypes = typeof EffectType[keyof typeof EffectType];
  
  type Effect = {
    type: EffectTypes;
    value: number; // Defaults to 1
    skill?: string | null; // Defaults to null
    opposedSkill?: string | null; // Defaults to null
  }
  
  type Trait = {
    id: string;
    name: string;
    description: string;
    rarity: Rarity;
    
    // Combat mechanics
    skill: string;
    opposedSkill: string;
    modifier: number;
    target: Target;
    
    // Visual
    artworkUrl: string;
    
    // What happens on hit
    effects: Effect[];
  }
  
  // Example trait
  const bite: Trait = {
    id: 'bite',
    name: 'Bite',
    description: 'A sharp bite attack',
    rarity: RarityType.COMMON,
    
    skill: 'might',
    opposedSkill: 'grace',
    modifier: 2,
    target: TargetType.OPPONENT,
    
    artworkUrl: '/assets/traits/bite.png',
    
    effects: [
      {
        type: EffectType.WOUND,
        value:1
      }
    ]
  }