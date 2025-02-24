import React from 'react';
import { GameState } from '../types/gamestate';
import { UIAction } from './types/uiTypes';
import CombatRoom from './components/CombatRoom';

interface UIPrototypeProps {
    gameState: GameState;
    onAction: (action: UIAction) => Promise<void>;
    onNavigate: (view: string) => void;
    onToggleNarration?: () => void;
    onStartCombat?: () => Promise<void>;
    combatStarted?: boolean;
}

const GameInterface: React.FC<UIPrototypeProps> = ({
    gameState,
    onAction,
    onNavigate,
    onToggleNarration,
    onStartCombat,
    combatStarted
}) => {
    return <CombatRoom 
        gameState={gameState}
        onAction={onAction}
        onNavigate={onNavigate}
        onToggleNarration={onToggleNarration}
        onStartCombat={onStartCombat}
        combatStarted={combatStarted}
    />;
};

export default GameInterface;
