import React from 'react';
import { GameState as BackendGameState } from '../../../types/gamestate';
import { UIAction } from '../../uiTypes';
import { useLoading } from '../../LoadingContext';
import TopBar from './TopBar';
import CombatArea from './CombatArea';

interface CombatRoomProps {
    gameState: BackendGameState;
    onAction: (action: UIAction) => Promise<void>;
    onNavigate: (view: string) => void;
    onStartCombat?: () => Promise<void>;
    combatStarted?: boolean;
    debugEnabled?: boolean;
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
    onStartCombat,
    combatStarted = false,
    debugEnabled = false
}) => {
    const { isLoading, setIsLoading } = useLoading();

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
        // Set absolute height constraint on the top-level container
        <div className="flex flex-col bg-slate-900 h-screen overflow-hidden">
            {/* Main Game Area - takes remaining height with overflow hidden */}
            <div className="flex-1 flex overflow-hidden min-h-0">
                {combatStarted ? (
                    /* Combat View with 3-column layout */
                    <CombatArea 
                        combatState={gameState.activeCombat}
                        debugEnabled={debugEnabled}
                        onAction={handleAction}
                    />
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
    );
};

export default CombatRoom;
