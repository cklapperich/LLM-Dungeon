import React from 'react';
import { CombatState } from '../../../types/combatState';
import { characterToUICard } from '../../types/uiTypes';
import { useLoading } from '../../context/LoadingContext';
import Card from '../Card';
import { Character } from '../../../types/actor';

interface CombatAreaProps {
    combatState?: CombatState;
    allCharacters: Record<string, Character>;
    debugEnabled?: boolean;
}

export const CombatArea: React.FC<CombatAreaProps> = ({ combatState, allCharacters, debugEnabled }) => {
    if (!combatState) {
        return (
            <div className="w-2/3 p-6 bg-slate-100">
                <div className="bg-white rounded-lg p-6 h-full flex flex-col items-center justify-center">
                    <span className="text-gray-500">No active combat</span>
                </div>
            </div>
        );
    }

    const { isLoading } = useLoading();

    return (
        <div className="w-2/3 p-6 bg-slate-100">
            <div className="bg-white rounded-lg p-6 h-full flex flex-col relative">
                {isLoading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 rounded-lg">
                        <div className="text-white text-xl">Processing action...</div>
                    </div>
                )}
                <h2 className="text-xl font-bold mb-4">Current Encounter | {combatState.roomId} | Round {combatState.round}</h2>
                
                {/* Combat Stage */}
                {/* Debug View */}
                {debugEnabled && (
                    <div className="mb-4 flex gap-4 overflow-auto">
                        {combatState.characterIds.map((id, index) => (
                            <div key={index} className="flex-1 p-4 bg-slate-100 rounded overflow-auto">
                                <h3 className="font-bold mb-2">{index === 0 ? 'Hero' : 'Monster'}</h3>
                                <pre className="text-xs whitespace-pre-wrap">
                                    {JSON.stringify(allCharacters[id], null, 2)}
                                </pre>
                            </div>
                        ))}
                    </div>
                )}
                
                {/* Combat View */}
                <div className="flex-1 flex justify-center items-center relative">
                    {combatState.characterIds.map((id, index) => (
                        <div key={index} className="flex-1 w-[47%]">
                            {index > 0 && (
                                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                                    <span className="text-5xl font-bold text-slate-700">VS</span>
                                </div>
                            )}
                            <Card 
                                data={characterToUICard(
                                    allCharacters[id], 
                                    index === 0 ? 'hero' : 'monster'
                                )} 
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CombatArea;
