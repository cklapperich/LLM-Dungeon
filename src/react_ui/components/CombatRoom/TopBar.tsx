import React from 'react';
import { GameState as BackendGameState } from '../../../types/gamestate';

interface TopBarProps {
    turnCounter?: number;
    dayCounter?: number;
    infamy?: number;
    narrationEnabled?: boolean;
    onToggleNarration?: () => void;
    debugEnabled?: boolean;
    onToggleDebug?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ 
    turnCounter = 0,
    dayCounter = 0,
    infamy = 0,
    narrationEnabled = false,
    onToggleNarration,
    debugEnabled = false,
    onToggleDebug
}) => {
    return (
        <div className="bg-slate-800 text-white p-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
                <span>Turn {turnCounter} - Day {dayCounter}</span>
            </div>
            <div className="flex gap-4 items-center">
                <div className="flex gap-2">
                    <button 
                        onClick={onToggleNarration}
                        className={`px-3 py-1 rounded ${narrationEnabled ? 'bg-green-600' : 'bg-red-600'}`}
                    >
                        Narration: {narrationEnabled ? 'On' : 'Off'}
                    </button>
                    <button 
                        onClick={onToggleDebug}
                        className={`px-3 py-1 rounded ${debugEnabled ? 'bg-green-600' : 'bg-red-600'}`}
                    >
                        Debug: {debugEnabled ? 'On' : 'Off'}
                    </button>
                    <span>Infamy: {infamy}</span>
                </div>
            </div>
        </div>
    );
};

export default TopBar;
