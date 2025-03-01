import React, { useRef, useEffect } from 'react';
import { Book } from 'lucide-react';
import { CombatState, getAllLogsWithRounds } from '../../../types/combatState';
import { LogType } from '../../uiTypes';

interface NarrationPanelProps {
    combatState?: CombatState;
}

export const NarrationPanel: React.FC<NarrationPanelProps> = ({ 
    combatState
}) => {
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

    if (!combatState) {
        return (
            <div className="h-full bg-black rounded-lg flex items-center justify-center shadow-lg shadow-black/25 border-2 border-white/40">
                <span className="text-slate-400">No active combat</span>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Log Panel */}
            <div ref={logContainerRef} className="flex-1 overflow-y-auto text-white bg-black rounded-lg p-4 shadow-lg shadow-black/25 border-2 border-white/40 mb-4">
                <div className="space-y-4">
                    {(() => {
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

            {/* Log Type Selector */}
            <div className="flex bg-black rounded-lg shadow-lg shadow-black/25 border-2 border-white/40 overflow-hidden">
                <button 
                    onClick={() => setLogType('event')}
                    className={`flex-1 px-3 py-2 flex items-center justify-center gap-2 ${
                        logType === 'event' ? 'bg-slate-600' : 'bg-slate-800 hover:bg-slate-700'
                    }`}
                >
                    <Book size={16} />
                    Events
                </button>
                <button 
                    onClick={() => setLogType('debug')}
                    className={`flex-1 px-3 py-2 flex items-center justify-center gap-2 border-l-2 border-white/50 ${
                        logType === 'debug' ? 'bg-slate-600' : 'bg-slate-800 hover:bg-slate-700'
                    }`}
                >
                    Debug
                </button>
                <button 
                    onClick={() => setLogType('llm_context')}
                    className={`flex-1 px-3 py-2 flex items-center justify-center gap-2 border-l-2 border-white/50 ${
                        logType === 'llm_context' ? 'bg-slate-600' : 'bg-slate-800 hover:bg-slate-700'
                    }`}
                >
                    Context
                </button>
                <button 
                    onClick={() => setLogType('llm_narration')}
                    className={`flex-1 px-3 py-2 flex items-center justify-center gap-2 border-l-2 border-white/50 ${
                        logType === 'llm_narration' ? 'bg-slate-600' : 'bg-slate-800 hover:bg-slate-700'
                    }`}
                >
                    Narrative
                </button>
            </div>
        </div>
    );
};

export default NarrationPanel;
