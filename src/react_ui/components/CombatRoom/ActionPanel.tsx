import React, { useRef, useEffect } from 'react';
import { Book } from 'lucide-react';
import { CombatState, getAllLogsWithRounds, getMonsterCharacterId } from '../../../types/combatState';
import { UIAction } from '../../types/uiTypes';
import { useLoading } from '../../context/LoadingContext';
import { Character } from '../../../types/actor';

interface ActionPanelProps {
    combatState?: CombatState;
    allCharacters: Record<string, Character>;
    onAction: (action: UIAction) => Promise<void>;
}

export const ActionPanel: React.FC<ActionPanelProps> = ({ 
    combatState,
    allCharacters,
    onAction 
}) => {
    const { isLoading } = useLoading();
    const [logType, setLogType] = React.useState<'combat' | 'narration'>('narration');
    const logContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const scrollToBottom = () => {
            if (logContainerRef.current) {
                const element = logContainerRef.current;
                setTimeout(() => {
                    element.scrollTop = element.scrollHeight;
                }, 100);
            }
        };
        scrollToBottom();
    }, [logType, combatState && getAllLogsWithRounds(combatState)]);

    return (
        <div className="w-1/3 bg-black p-6 flex flex-col h-full text-white border-2 border-white/40 rounded-lg">
            {/* Available Actions */}
            <div className="h-[25%] flex flex-col min-h-0 mb-4">
                <h3 className="font-bold mb-2 flex-none">
                    {combatState && allCharacters ? 
                        `What will ${allCharacters[getMonsterCharacterId(combatState, allCharacters)]?.name} do?` 
                        : 'Available Actions'
                    }
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto pr-2 flex-1">
                    {(combatState?.playerActions || []).map((action, i) => (
                        <button
                            key={i}
                            onClick={async () => await onAction(action)}
                            disabled={action.disabled || isLoading}
                            className={`w-full px-4 py-3 rounded flex flex-col items-center justify-center text-center
                                border-[3px] border-white/50 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_2px_4px_rgba(0,0,0,0.2)]
                                bg-slate-800
                                ${action.disabled || isLoading
                                    ? 'opacity-50 text-slate-400 cursor-not-allowed' 
                                    : 'text-white hover:bg-slate-700 active:bg-slate-900'}`}
                        >
                            <div className="w-full">
                                <div className="font-medium">{action.label}</div>
                                {action.disabled && action.tooltip && (
                                    <div className="text-sm mt-1 text-slate-300">{action.tooltip}</div>
                                )}
                            </div>
                        </button>
                     ))}
                </div>
            </div>

            {/* Log Type Toggle */}
            <button 
                className={`mb-4 flex items-center justify-center gap-2 px-4 py-2 rounded
                    border-[3px] border-white/50 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_2px_4px_rgba(0,0,0,0.2)]
                    bg-slate-800 ${
                    isLoading 
                        ? 'opacity-50 text-slate-400 cursor-not-allowed'
                        : 'text-white hover:bg-slate-700 active:bg-slate-900'
                }`}
                disabled={isLoading}
                onClick={() => setLogType(logType === 'combat' ? 'narration' : 'combat')}
            >
                <Book size={16} />
                {logType === 'combat' ? 'Show Narration' : 'Show Combat'}
            </button>

            {/* Log Panel */}
            <div ref={logContainerRef} className="flex-1 bg-black rounded-lg p-4 overflow-y-auto min-h-0 shadow-lg shadow-black/25 border-2 border-white/40">
                <div className="space-y-4">
                    {combatState && (() => {
                        const logs = getAllLogsWithRounds(combatState)
                            .filter(entry => entry.type === logType);
                        
                        // Group logs by round
                        const logsByRound: { [round: number]: typeof logs } = {};
                        logs.forEach(log => {
                            if (!logsByRound[log.round]) {
                                logsByRound[log.round] = [];
                            }
                            logsByRound[log.round].push(log);
                        });

                        return Object.entries(logsByRound).map(([round, entries]) => (
                            <div key={round} className="mb-4">
                                <div className="text-xs text-slate-400 mb-2">Round {round}</div>
                                <div className="space-y-2">
                                    {entries.map((entry, i) => (
                                        <div 
                                            key={`${entry.type}-${round}-${i}`}
                                            className={`text-sm ${logType === 'narration' ? 'italic' : ''}`}
                                        >
                                            {entry.text}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ));
                    })()}
                </div>
            </div>
        </div>
    );
};

export default ActionPanel;
