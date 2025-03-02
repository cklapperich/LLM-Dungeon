import { Character } from '../types/actor';
export type LogType = 'event' | 'debug' | 'llm_context' | 'llm_narration' | 'prompt';
import { GameState } from '../types/gamestate';
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

export enum UIActionType {
    COMBAT = 'combat',
    DUNGEON = 'dungeon',
    SYSTEM = 'system'
}

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

import { GameAction } from '../types/gamestate';

// Base interface for all UI actions
export interface UIAction {
    name: string;
    context: UIActionType;
    disabled: boolean;
    tooltips: string[];
    disabledReason?: string;
    gameAction: GameAction; // Required reference to the underlying game action
}

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
                { icon: Heart, value: character.vitality.current, label: 'Vitality' },
                { icon: Flame, value: character.conviction.current, label: 'Conviction' },
                { icon: Shield, value: character.armor.current, label: 'Armor' },
            ],
            bottomStats: [
                { icon: Sword, value: character.attributes.Might, label: 'Might' },
                { icon: Wind, value: character.attributes.Grace, label: 'Grace' },
                { icon: Brain, value: character.attributes.Wit, label: 'Wit' },
                { icon: Sparkles, value: character.attributes.Will, label: 'Will' }
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
