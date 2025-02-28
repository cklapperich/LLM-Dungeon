import React, { useEffect } from 'react';
import { GameState as BackendGameState } from '../../../types/gamestate';
import { UIAction } from '../../uiTypes';
import { useLoading } from '../../LoadingContext';
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
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-900">
            <div className="bg-slate-800 p-8 rounded-lg shadow-lg shadow-black/25">
                <h2 className="text-2xl mb-6 text-center text-white">Combat Setup</h2>
                <button
                    onClick={onStartCombat}
                    disabled={isLoading}
                    className={`bg-slate-800 text-white px-6 py-3 rounded-lg text-lg font-semibold w-full
                        shadow-lg shadow-black/25 relative border-[3px] border-white/50
                        hover:bg-slate-700 active:bg-slate-900 ${
                        isLoading ? 'opacity-50 cursor-not-allowed text-slate-500' : ''
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

    // No longer using event bus for loading state

    // Wrap onAction to set loading state
    const handleAction = async (action: UIAction) => {
        console.log('Setting loading state to true');
        setIsLoading(true);
        try {
            await onAction(action);
            console.log('Action completed, setting loading state to false');
            setIsLoading(false);
        } catch (error) {
            console.error('Error in handleAction:', error);
            setIsLoading(false);
        }
    };

    return (
        <div className="h-screen flex bg-slate-900">
            {/* Left Sidebar Navigation */}
            <Sidebar onNavigate={onNavigate} />

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Top Bar */}
                <TopBar 
                    turnCounter={gameState.turnCounter}
                    dayCounter={gameState.dayCounter}
                    infamy={gameState.infamy}
                    narrationEnabled={gameState.settings.narrationEnabled}
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
                                debugEnabled={debugEnabled}
                            />

                            {/* Right Side Panel */}
                            <ActionPanel 
                                combatState={gameState.activeCombat ?? undefined}
                                allCharacters={{...gameState.heroes, ...gameState.monsters}}
                                onAction={handleAction}
                            />
                        </>
                    ) : (
                        <PreCombatUI
                            onStartCombat={async () => {
                                if (!onStartCombat || isLoading) return;
                                console.log('Starting combat, setting loading state to true');
                                setIsLoading(true);
                                try {
                                    await onStartCombat();
                                    console.log('Combat started, setting loading state to false');
                                    setIsLoading(false);
                                } catch (error) {
                                    // If there's an error, we should set isLoading to false
                                    console.error('Error starting combat:', error);
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
