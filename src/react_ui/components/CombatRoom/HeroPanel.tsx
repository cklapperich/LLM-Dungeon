 import React, { useState } from 'react';
import { CombatState } from '../../../types/combatState';
import { characterToUICard } from '../../uiTypes';
import Card from '../Card';
import { CharacterType } from '../../../types/constants';
import CharacterPanel from './CharacterPanel';
import { Trait } from '../../../types/abilities';
import { AbilityModal } from '../Card/abilityCard';
import LongPressButton from '../LongPressButton';

// Simple component to display the selected action with ability card on long press
const SelectedAction: React.FC<{ action?: Trait }> = ({ action }) => {
  const [showModal, setShowModal] = useState(false);
  
  if (!action) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400">
        No action selected
      </div>
    );
  }

  // Handle long press to show ability card
  const handleLongPress = () => {
    setShowModal(true);
  };
  
  // No action on click for the selected action
  const handleClick = () => {
    // No action needed, just for display
  };

  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-white text-lg">
        Hero is preparing to use{" "}
        <LongPressButton
          onClick={handleClick}
          onLongPress={handleLongPress}
          className="inline font-bold text-yellow-300 cursor-pointer px-1 py-0.5 rounded hover:bg-slate-800"
        >
          {action.name}!
        </LongPressButton>
      </div>
      
      {/* Ability Modal */}
      {action && (
        <AbilityModal
          trait={action}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
        >
          <div></div>
        </AbilityModal>
      )}
    </div>
  );
};

interface HeroPanelProps {
    combatState?: CombatState;
    debugEnabled?: boolean;
}

export const HeroPanel: React.FC<HeroPanelProps> = ({ 
    combatState,
    debugEnabled
}) => {
    if (!combatState) {
        return (
            <div className="h-full bg-black rounded-lg flex items-center justify-center shadow-lg shadow-black/25 border-2 border-white/40">
                <span className="text-slate-400">No active hero</span>
            </div>
        );
    }

    // Find the hero character
    const heroCharacter = combatState.characters.find(c => c.type === CharacterType.HERO);
    
    if (!heroCharacter) {
        return (
            <div className="h-full bg-black rounded-lg flex items-center justify-center shadow-lg shadow-black/25 border-2 border-white/40">
                <span className="text-slate-400">Hero not found</span>
            </div>
        );
    }

    return (
        <CharacterPanel
            topContent={<Card data={characterToUICard(heroCharacter, 'hero')} />}
            bottomContent={
                <SelectedAction action={heroCharacter.selected_action} />
            }
            debugContent={
                <>
                    <h3 className="font-bold mb-2 text-white">Hero</h3>
                    <pre className="text-xs whitespace-pre-wrap text-slate-300">
                        {JSON.stringify(heroCharacter, null, 2)}
                    </pre>
                </>
            }
            debugEnabled={debugEnabled}
        />
    );
};

export default HeroPanel;
