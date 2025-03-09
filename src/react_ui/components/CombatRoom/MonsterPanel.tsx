import React, { useState } from 'react';
import { CombatState } from '../../../types/combatState';
import { UIAction } from '../../uiTypes';
import { useLoading } from '../../LoadingContext';
import { CharacterType } from '../../../types/constants';
import { convertGameActionToUIAction } from '../../../game_engine/gameEngine';
import Card from '../Card';
import { characterToUICard } from '../../uiTypes';
import CharacterPanel from './CharacterPanel';
import { AbilityModal, getTraitFromAction } from '../Card/abilityCard';
import LongPressButton from '../LongPressButton';
import { Trait } from '../../../types/abilities';

// Action Buttons component for the bottom half
const ActionButtons: React.FC<{
    actions: any[];
    onAction: (action: UIAction) => Promise<void>;
    monsterName: string;
}> = ({ actions, onAction, monsterName }) => {
    const { isLoading } = useLoading();
    const [modalTrait, setModalTrait] = useState<Trait | null>(null);
    
    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto pr-2 h-[calc(100%-2rem)]">
                {actions.map((action, i) => {
                    // Convert CombatGameAction to UIAction
                    const uiAction = convertGameActionToUIAction(action);
                    
                    // Extract trait from the action
                    const trait = getTraitFromAction(action);
                    
                    // Handle long press to show ability card
                    const handleLongPress = () => {
                        if (trait) {
                            setModalTrait(trait);
                        }
                    };
                    
                    // Handle click to execute action
                    const handleClick = async () => {
                        await onAction(uiAction);
                    };
                    
                    return (
                        <div key={i}>
                            <LongPressButton
                                onClick={handleClick}
                                onLongPress={handleLongPress}
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
                            </LongPressButton>
                        </div>
                    );
                })}
            </div>
            
            {/* Ability Modal */}
            {modalTrait && (
                <AbilityModal
                    trait={modalTrait}
                    isOpen={modalTrait !== null}
                    onClose={() => setModalTrait(null)}
                >
                    <div></div>
                </AbilityModal>
            )}
        </>
    );
};

interface MonsterPanelProps {
    combatState?: CombatState;
    onAction: (action: UIAction) => Promise<void>;
    debugEnabled?: boolean;
}

export const MonsterPanel: React.FC<MonsterPanelProps> = ({ 
    combatState,
    onAction,
    debugEnabled
}) => {
    if (!combatState) {
        return (
            <div className="h-full bg-black rounded-lg flex items-center justify-center shadow-lg shadow-black/25 border-2 border-white/40">
                <span className="text-slate-400">No active monster</span>
            </div>
        );
    }

    // Find the monster character
    const monsterCharacter = combatState.characters.find(c => c.type === CharacterType.MONSTER);
    const monsterName = monsterCharacter.name;

    if (!monsterCharacter) {
        return (
            <div className="h-full bg-black rounded-lg flex items-center justify-center shadow-lg shadow-black/25 border-2 border-white/40">
                <span className="text-slate-400">Monster not found</span>
            </div>
        );
    }

    return (
        <CharacterPanel
            topContent={<Card data={characterToUICard(monsterCharacter, 'monster')} />}
            bottomContent={
                <ActionButtons 
                    actions={combatState?.playerActions || []} 
                    onAction={onAction}
                    monsterName={monsterName}
                />
            }
            debugContent={
                <>
                    <h3 className="font-bold mb-2 text-white">Monster</h3>
                    <pre className="text-xs whitespace-pre-wrap text-slate-300">
                        {JSON.stringify(monsterCharacter, null, 2)}
                    </pre>
                </>
            }
            debugEnabled={debugEnabled}
        />
    );
};

export default MonsterPanel;
