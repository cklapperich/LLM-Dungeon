import { Character } from '../../types/actor';
import { Trait,  Effect } from '../../types/abilities';
import { SkillName } from '../../types/skilltypes';
import { RarityType, TargetType } from '../../types/constants';
import { GameState } from '../../types/gamestate';
import { 
    Sword, 
    Shield, 
    Book, 
    Home, 
    Library,
    LayoutGrid,
    Binary,
    Swords,
    Sparkles,
    Brain,
    Heart,
    Flame,
    Wind
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
    artworkUrl?: string;
}

// Unified interface for all combat actions
export interface CombatUIAction {
    type: string;
    label: string;
    description: string;
    disabled?: boolean;
    tooltip?: string;
    rarity?: typeof RarityType[keyof typeof RarityType];
    skill?: SkillName;
    defenseOptions?: SkillName[];
    modifier?: number;
    priority?: boolean;
    //bodyParts?: BodyPartRequirements;
    effects: Effect[];
}

// For backwards compatibility
export type UIAction = CombatUIAction;

export interface UIActionResult {
    success: boolean;
    newState: GameState;
    message?: string;
}

// Theme configurations
export const CharacterThemes = {
    hero: {
        backgroundColor: 'bg-slate-900',
        overlayColor: 'bg-blue-900',
        borderRadius: 'rounded-l-xl',
        emoji: '🦹‍♂️'
    },
    monster: {
        backgroundColor: 'bg-slate-900',
        overlayColor: 'bg-red-900',
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
        artworkUrl: character.artworkUrl,
        stats: {
            topStats: [
                { icon: Heart, value: character.vitality, label: 'Vitality' },
                { icon: Flame, value: character.conviction, label: 'Conviction' }
            ],
            bottomStats: [
                { icon: Sword, value: character.might, label: 'Might' },
                { icon: Wind, value: character.grace, label: 'Grace' },
                { icon: Brain, value: character.wit, label: 'Wit' },
                { icon: Sparkles, value: character.will, label: 'Will' }
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
