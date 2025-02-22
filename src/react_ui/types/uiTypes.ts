import { GameState as BackendGameState, CombatState } from '../../types/gamestate';
import { Character } from '../../types/actor';
import { Trait, BodyPartRequirements, Effect } from '../../types/abilities';
import { SkillName } from '../../types/skilltypes';
import { RarityType, TargetType } from '../../types/constants';
import { 
    Sword, 
    Shield, 
    Book, 
    Home, 
    Library,
    LayoutGrid,
    Binary,
    Menu,
    Swords,
    Sparkles,
    Brain,
    Heart,
    Flame,
    Cross
} from 'lucide-react';

// UI-specific types that transform backend data for display
export interface UICardStats {
    topStats: Array<{
        icon: any;
        value: number;
        label: string;
    }>;
    bottomStats: Array<{
        icon: any;
        value: number;
        label: string;
    }>;
}

export interface UICharacterCard {
    type: string;
    emoji: string;
    backgroundColor: string;
    overlayColor: string;
    borderRadius: string;
    stats: UICardStats;
}

// Base interface for all UI actions
export interface BaseUIAction {
    type: string;
    label: string;
    disabled?: boolean;
    tooltip?: string;
    category: 'trait' | 'system';  // Extend with more categories as needed
}

// For trait-based actions
export interface TraitUIAction extends BaseUIAction {
    category: 'trait';
    trait: {
        description: string;
        rarity: typeof RarityType[keyof typeof RarityType];
        skill: SkillName;
        defenseOptions: SkillName[];
        modifier: number;
        target: typeof TargetType[keyof typeof TargetType];
        priority: boolean;
        bodyParts?: BodyPartRequirements;
        effects: Effect[];
    }
}

// Union type for all UI actions
export type UIAction = BaseUIAction | TraitUIAction;

// Theme configurations
export const CharacterThemes = {
    hero: {
        backgroundColor: 'bg-blue-500',
        overlayColor: 'bg-blue-600',
        borderRadius: 'rounded-l-xl',
        emoji: '🦹‍♂️'
    },
    monster: {
        backgroundColor: 'bg-red-500',
        overlayColor: 'bg-red-600',
        borderRadius: 'rounded-r-xl',
        emoji: '👾'
    }
} as const;

// Transform functions
export function characterToUICard(
    character: Character, 
    type: keyof typeof CharacterThemes = 'hero'
): UICharacterCard {
    const theme = CharacterThemes[type];
    
    return {
        type: character.name.toLowerCase(),
        emoji: theme.emoji,
        backgroundColor: theme.backgroundColor,
        overlayColor: theme.overlayColor,
        borderRadius: theme.borderRadius,
        stats: {
            topStats: [
                { icon: Flame, value: character.vitality, label: 'Vitality' },
                { icon: Cross, value: character.conviction, label: 'Conviction' }
            ],
            bottomStats: [
                { icon: Swords, value: character.might, label: 'Might' },
                { icon: Sparkles, value: character.grace, label: 'Grace' },
                { icon: Brain, value: character.wit, label: 'Wit' },
                { icon: Heart, value: character.will, label: 'Will' }
            ]
        }
    };
}

// Navigation items type
export interface NavItem {
    icon: any;
    label: string;
    view: string;
}

export const navigationItems: NavItem[] = [
    { icon: Home, label: 'Overview', view: 'overview' },
    { icon: Library, label: 'Nursery', view: 'nursery' },
    { icon: LayoutGrid, label: 'Dungeon', view: 'dungeon' },
    { icon: Binary, label: 'Gene Pool', view: 'genes' }
];
