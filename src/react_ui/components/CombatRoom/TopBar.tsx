import React from 'react';
import { LogType } from '../../types/uiTypes';

interface TopBarProps {
    turnCounter?: number;
    dayCounter?: number;
    infamy?: number;
    narrationEnabled: boolean;
    onToggleNarration: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ 
    turnCounter = 0,
    dayCounter = 0,
    infamy = 0,
    narrationEnabled = false,
    onToggleNarration
}) => {
    return (
        <div className="bg-slate-800 text-white p-4 flex justify-between items-center shadow-lg shadow-black/25">
            <div className="flex items-center gap-4">
                <span>Turn {turnCounter} - Day {dayCounter}</span>
            </div>
            <div className="flex gap-4 items-center">
                <div className="flex gap-2">
                    <button 
                        onClick={onToggleNarration}
                        className={`px-3 py-1 rounded shadow-lg shadow-black/25 relative
                            border-[3px] border-white/50
                            bg-slate-800 hover:bg-slate-700 active:bg-slate-900`}
                    >
                        Narration: {narrationEnabled ? 'On' : 'Off'}
                    </button>
                    <span className="px-3 py-1 bg-slate-800 rounded shadow-lg shadow-black/25 border-[3px] border-white/50">
                        Infamy: {infamy}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default TopBar;
