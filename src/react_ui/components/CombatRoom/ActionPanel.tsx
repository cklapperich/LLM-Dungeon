import React, { useRef, useEffect } from 'react';
import { Book } from 'lucide-react';
import { CombatState, getAllLogsWithRounds } from '../../../types/combatState';
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
    
    // Log combat state and actions whenever they change
    React.useEffect(() => {
        console.log('ActionPanel received combatState:', combatState);
        console.log('Available actions:', combatState?.playerActions);
    }, [combatState]);
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
        <div className="w-1/3 bg-slate-200 p-6 flex flex-col h-full">
            {/* Available Actions */}
            <div className="h-[25%] flex flex-col min-h-0 mb-4">
                <h3 className="font-bold mb-2 flex-none">Available Actions</h3>
                <div className="grid grid-cols-2 auto-rows-fr gap-2 overflow-y-auto pr-2 flex-1">
                    {(combatState?.playerActions || []).map((action, i) => (
                        <button
                            key={i}
                            onClick={async () => await onAction(action)}
                            disabled={action.disabled || isLoading}
                            className={`w-full h-full p-2 rounded flex flex-col items-center justify-center text-center
                                ${action.disabled || isLoading
                                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                                    : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                        >
                            <div className="w-full overflow-hidden">
                                <div className="truncate">{action.label}</div>
                                {action.disabled && action.tooltip && (
                                    <div className="text-sm truncate">{action.tooltip}</div>
                                )}
                            </div>
                        </button>
                     ))}
                </div>
            </div>

            {/* Log Type Toggle */}
            <button 
                className={`mb-4 flex items-center justify-center gap-2 px-4 py-2 rounded w-full ${
                    isLoading 
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                        : 'bg-slate-300 hover:bg-slate-400'
                }`}
                disabled={isLoading}
                onClick={() => setLogType(logType === 'combat' ? 'narration' : 'combat')}
            >
                <Book size={16} />
                {logType === 'combat' ? 'Show Narration' : 'Show Combat'}
            </button>

            {/* Log Panel */}
            <div ref={logContainerRef} className="flex-1 bg-white rounded-lg p-4 overflow-y-auto min-h-0">
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
                                <div className="text-xs text-gray-500 mb-2">Round {round}</div>
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
