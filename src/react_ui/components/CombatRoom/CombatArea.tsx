import React from 'react';
import { Swords } from 'lucide-react';
import { CombatState } from '../../../types/combatState';
import { characterToUICard } from '../../uiTypes';
import { useLoading } from '../../LoadingContext';
import Card from '../Card';

interface CombatAreaProps {
    combatState?: CombatState;
    debugEnabled?: boolean;
}

export const CombatArea: React.FC<CombatAreaProps> = ({ combatState, debugEnabled }) => {
    if (!combatState) {
        return (
            <div className="w-2/3 p-6 bg-black rounded-lg h-full flex flex-col items-center justify-center shadow-lg shadow-black/25 border-2 border-white/40">
                <span className="text-slate-400">No active combat</span>
            </div>
        );
    }

    const { isLoading } = useLoading();

    return (
        <div className="w-2/3 p-6 bg-black rounded-lg h-full flex flex-col relative shadow-lg shadow-black/25 text-white border-2 border-white/40">
                {isLoading && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 rounded-lg">
                        <div className="text-white text-xl flex flex-col items-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-4"></div>
                            <div>Processing action...</div>
                        </div>
                    </div>
                )}
                <h2 className="text-xl font-bold mb-4 text-white">Current Encounter | {combatState.room.id} | Round {combatState.round}</h2>
                
                {/* Conditional rendering based on debug mode */}
                {debugEnabled ? (
                    // Debug View
                    <div className="flex-1 flex gap-4 overflow-auto">
                        {combatState.characters.map((character, index) => (
                            <div key={index} className="flex-1 p-4 bg-black rounded overflow-auto shadow-inner shadow-black/25 border-2 border-white/40">
                                <h3 className="font-bold mb-2 text-white">{index === 0 ? 'Hero' : 'Monster'}</h3>
                                <pre className="text-xs whitespace-pre-wrap text-slate-300">
                                    {JSON.stringify(character, null, 2)}
                                </pre>
                            </div>
                        ))}
                    </div>
                ) : (
                    // Combat View
                    <div className="flex-1 flex justify-center items-center relative">
                        {combatState.characters.map((character, index) => (
                            <div key={index} className="flex-1 w-[47%]">
                                {index > 0 && (
                                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                                    <Swords size={64} className="text-white" />
                                    </div>
                                )}
                                <Card 
                                    data={characterToUICard(
                                        character, 
                                        index === 0 ? 'hero' : 'monster'
                                    )} 
                                />
                            </div>
                        ))}
                    </div>
                )}
        </div>
    );
};

export default CombatArea;
