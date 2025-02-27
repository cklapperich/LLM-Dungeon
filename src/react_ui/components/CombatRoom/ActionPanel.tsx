import React, { useRef, useEffect } from 'react';
import { Book } from 'lucide-react';
import { CombatState, getAllLogsWithRounds } from '../../../types/combatState';
import { UIAction, LogType } from '../../uiTypes';
import { useLoading } from '../../LoadingContext';
import { Character } from '../../../types/actor';
import { CharacterType } from '../../../types/constants';
import { convertGameActionToUIAction } from '../../../game_engine/gameEngine';

// Helper function to get the monster character ID from combat state
function getMonsterCharacterId(combatState: CombatState, allCharacters: Record<string, Character>): string {
    const monster = combatState.characters.find(c => c.type === CharacterType.MONSTER);
    return monster ? monster.id : '';
}

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
    const [logType, setLogType] = React.useState<LogType>('llm_narration');
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
                    {(combatState?.playerActions || []).map((action, i) => {
                        // Convert CombatGameAction to UIAction
                        const uiAction = convertGameActionToUIAction(action);
                        return (
                        <button
                            key={i}
                            onClick={async () => await onAction(uiAction)}
                            disabled={uiAction.disabled || isLoading}
                            className={`w-full px-4 py-3 rounded flex flex-col items-center justify-center text-center
                                border-[3px] border-white/50 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_2px_4px_rgba(0,0,0,0.2)]
                                bg-slate-800
                                ${uiAction.disabled || isLoading
                                    ? 'opacity-50 text-slate-400 cursor-not-allowed' 
                                    : 'text-white hover:bg-slate-700 active:bg-slate-900'}`}
                        >
                            <div className="w-full">
                                <div className="font-medium">{uiAction.name}</div>
                                {uiAction.disabled && uiAction.disabledReason && (
                                    <div className="text-sm mt-1 text-slate-300">{uiAction.disabledReason}</div>
                                )}
                            </div>
                        </button>
                        );
                     })}
                </div>
            </div>

            {/* Log Type Selector */}
            <div className="mb-4 flex rounded-lg shadow-lg shadow-black/25 border-[3px] border-white/50 overflow-hidden">
                <button 
                    onClick={() => setLogType('event')}
                    disabled={isLoading}
                    className={`flex-1 px-3 py-1 flex items-center justify-center gap-2 ${
                        logType === 'event' ? 'bg-slate-600' : 'bg-slate-800 hover:bg-slate-700'
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <Book size={16} />
                    Events
                </button>
                <button 
                    onClick={() => setLogType('debug')}
                    disabled={isLoading}
                    className={`flex-1 px-3 py-1 flex items-center justify-center gap-2 border-l-2 border-white/50 ${
                        logType === 'debug' ? 'bg-slate-600' : 'bg-slate-800 hover:bg-slate-700'
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    Debug
                </button>
                <button 
                    onClick={() => setLogType('llm_context')}
                    disabled={isLoading}
                    className={`flex-1 px-3 py-1 flex items-center justify-center gap-2 border-l-2 border-white/50 ${
                        logType === 'llm_context' ? 'bg-slate-600' : 'bg-slate-800 hover:bg-slate-700'
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    Context
                </button>
                <button 
                    onClick={() => setLogType('llm_narration')}
                    disabled={isLoading}
                    className={`flex-1 px-3 py-1 flex items-center justify-center gap-2 border-l-2 border-white/50 ${
                        logType === 'llm_narration' ? 'bg-slate-600' : 'bg-slate-800 hover:bg-slate-700'
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    Narrative
                </button>
            </div>

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
                                            className={`text-sm ${logType === 'llm_narration' ? 'italic' : ''}`}
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
