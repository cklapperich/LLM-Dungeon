import React from 'react';
import { GameState as BackendGameState } from '../../../types/gamestate';
import { UIAction } from '../../types/uiTypes';
import { useLoading } from '../../context/LoadingContext';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import CombatArea from './CombatArea';
import ActionPanel from './ActionPanel';

interface CombatRoomProps {
    gameState: BackendGameState;
    onAction: (action: UIAction) => Promise<void>;
    onNavigate: (view: string) => void;
    onToggleNarration?: () => void;
    onStartCombat?: () => Promise<void>;
    combatStarted?: boolean;
}

const PreCombatUI: React.FC<{
    onStartCombat?: () => Promise<void>;
    isLoading: boolean;
}> = ({ onStartCombat, isLoading }) => {
    return (
        <div className="flex-1 flex flex-col items-center justify-center">
            <div className="bg-gray-800 p-8 rounded-lg shadow-lg">
                <h2 className="text-2xl mb-6 text-center">Combat Setup</h2>
                <button
                    onClick={onStartCombat}
                    disabled={isLoading}
                    className={`bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg text-lg font-semibold w-full ${
                        isLoading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                >
                    {isLoading ? 'Initializing...' : 'Start Combat'}
                </button>
            </div>
        </div>
    );
};

export const CombatRoom: React.FC<CombatRoomProps> = ({
    gameState,
    onAction,
    onNavigate,
    onToggleNarration,
    onStartCombat,
    combatStarted = false
}) => {
    const { isLoading, setIsLoading } = useLoading();
    const [debugEnabled, setDebugEnabled] = React.useState(false);

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
                    narrationEnabled={gameState.narrationEnabled}
                    onToggleNarration={onToggleNarration}
                    debugEnabled={debugEnabled}
                    onToggleDebug={() => setDebugEnabled(!debugEnabled)}
                />

                {/* Main Game Area */}
                <div className="flex-1 flex overflow-hidden">
                    {combatStarted ? (
                        <>
                            {/* Combat View */}
                            <CombatArea 
                                combatState={gameState.activeCombat} 
                                allCharacters={gameState.characters}
                                debugEnabled={debugEnabled}
                            />

                            {/* Right Side Panel */}
                            <ActionPanel 
                                combatState={gameState.activeCombat ?? undefined}
                                allCharacters={gameState.characters}
                                onAction={onAction}
                            />
                        </>
                    ) : (
                        <PreCombatUI
                            onStartCombat={async () => {
                                if (!onStartCombat || isLoading) return;
                                setIsLoading(true);
                                try {
                                    await onStartCombat();
                                } finally {
                                    setIsLoading(false);
                                }
                            }}
                            isLoading={isLoading}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default CombatRoom;
