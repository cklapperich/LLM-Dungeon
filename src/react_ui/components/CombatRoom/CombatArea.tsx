import React from 'react';
import { CombatState } from '../../../types/gamestate';
import { characterToUICard } from '../../types/uiTypes';
import Card from '../Card';

interface CombatAreaProps {
    combatState?: CombatState;
}

export const CombatArea: React.FC<CombatAreaProps> = ({ combatState }) => {
    if (!combatState) {
        return (
            <div className="w-2/3 p-6 bg-slate-100">
                <div className="bg-white rounded-lg p-6 h-full flex flex-col items-center justify-center">
                    <span className="text-gray-500">No active combat</span>
                </div>
            </div>
        );
    }

    const { characters, activeCharacterIndex } = combatState;

    return (
        <div className="w-2/3 p-6 bg-slate-100">
            <div className="bg-white rounded-lg p-6 h-full flex flex-col">
                <h2 className="text-xl font-bold mb-4">Combat Room</h2>
                
                {/* Combat Stage */}
                <div className="flex-1 flex justify-center items-center relative">
                    {characters.map((character, index) => (
                        <React.Fragment key={index}>
                            {index > 0 && (
                                <div className="absolute left-1/2 -translate-x-1/2 z-10">
                                    <span className="text-4xl font-bold text-slate-700">VS</span>
                                </div>
                            )}
                            <Card 
                                data={characterToUICard(
                                    character, 
                                    index === 0 ? 'hero' : 'monster'
                                )} 
                            />
                        </React.Fragment>
                    ))}
                </div>

                {/* Combat Info */}
                <div className="mt-4 text-gray-600">
                    <div>Turn: {combatState.round}</div>
                    <div>Room: {combatState.roomId}</div>
                </div>
            </div>
        </div>
    );
};

export default CombatArea;
