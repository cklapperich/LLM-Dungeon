import React from 'react';
import { GameState as BackendGameState } from '../../../types/gamestate';
import { UIAction } from '../../types/uiTypes';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import CombatArea from './CombatArea';
import ActionPanel from './ActionPanel';

interface CombatRoomProps {
    gameState: BackendGameState;
    onAction: (action: UIAction) => Promise<void>;
    onNavigate: (view: string) => void;
}

export const CombatRoom: React.FC<CombatRoomProps> = ({
    gameState,
    onAction,
    onNavigate
}) => {
    return (
        <div className="h-screen flex">
            {/* Left Sidebar Navigation */}
            <Sidebar onNavigate={onNavigate} />

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Top Bar */}
                <TopBar 
                    turnCounter={gameState.turnCounter}
                    dayCounter={gameState.dayCounter}
                    infamy={gameState.infamy}
                />

                {/* Main Game Area */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Combat View */}
                    <CombatArea 
                        combatState={gameState.activeCombat} 
                        allCharacters={gameState.characters}
                    />

                    {/* Right Side Panel */}
                    <ActionPanel 
                        combatState={gameState.activeCombat ?? undefined}
                        allCharacters={gameState.characters}
                        onAction={onAction}
                    />
                </div>
            </div>
        </div>
    );
};

export default CombatRoom;
