import React from 'react';
import { GameState } from '../types/gamestate';
import { UIAction } from './types/uiTypes';
import CombatRoom from './components/CombatRoom';

interface UIPrototypeProps {
    gameState: GameState;
    onAction: (action: UIAction) => Promise<void>;
    onNavigate: (view: string) => void;
}

const GameInterface: React.FC<UIPrototypeProps> = ({
    gameState,
    onAction,
    onNavigate
}) => {
    return <CombatRoom 
        gameState={gameState}
        onAction={onAction}
        onNavigate={onNavigate}
    />;
};

export default GameInterface;
