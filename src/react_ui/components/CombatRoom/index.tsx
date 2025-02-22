import React from 'react';
import { GameState as BackendGameState } from '../../../types/gamestate';
import { UIAction } from '../../types/uiTypes';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import CombatArea from './CombatArea';
import ActionPanel from './ActionPanel';

interface CombatRoomProps {
    gameState: BackendGameState;
    onAction: (action: UIAction) => void;
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
                <div className="flex-1 flex">
                    {/* Combat View */}
                    <CombatArea combatState={gameState.activeCombat} />

                    {/* Right Side Panel */}
                    <ActionPanel 
                        messageLog={gameState.messageLog}
                        legalActions={gameState.activeCombat?.legalActions ?? []}
                        onAction={onAction}
                    />
                </div>
            </div>
        </div>
    );
};

export default CombatRoom;
