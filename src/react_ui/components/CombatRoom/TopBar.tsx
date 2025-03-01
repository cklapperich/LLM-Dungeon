import React from 'react';

interface TopBarProps {
    turnCounter?: number;
    dayCounter?: number;
    infamy?: number;
    narrationEnabled: boolean;
    onToggleNarration: () => void;
    debugEnabled?: boolean;
    onToggleDebug?: () => void;
    encounterInfo?: {
        roomId?: string;
        round?: number;
    };
}

export const TopBar: React.FC<TopBarProps> = ({ 
    turnCounter = 0,
    dayCounter = 0,
    narrationEnabled = false,
    onToggleNarration,
    debugEnabled = false,
    onToggleDebug,
    encounterInfo
}) => {
    return (
        <div className="bg-slate-800 text-white p-4 flex justify-between items-center shadow-lg shadow-black/25">
            <div className="flex items-center gap-4">
                <span>Turn {turnCounter} - Day {dayCounter}</span>
                {encounterInfo && encounterInfo.roomId && (
                    <span className="px-3 py-1 bg-slate-700 rounded shadow-inner shadow-black/25 border border-white/30">
                        Current Encounter: {encounterInfo.roomId} | Round {encounterInfo.round || 1}
                    </span>
                )}
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
                    {onToggleDebug && (
                        <button 
                            onClick={onToggleDebug}
                            className={`px-3 py-1 rounded shadow-lg shadow-black/25 relative
                                border-[3px] border-white/50
                                bg-slate-800 hover:bg-slate-700 active:bg-slate-900`}
                        >
                            Debug: {debugEnabled ? 'On' : 'Off'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TopBar;
