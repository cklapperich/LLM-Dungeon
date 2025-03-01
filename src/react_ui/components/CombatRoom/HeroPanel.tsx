import React from 'react';
import { CombatState } from '../../../types/combatState';
import { characterToUICard } from '../../uiTypes';
import Card from '../Card';
import { CharacterType } from '../../../types/constants';
import CharacterPanel from './CharacterPanel';
import { Trait } from '../../../types/abilities';

// Simple component to display the selected action with tooltip
const SelectedAction: React.FC<{ action?: Trait }> = ({ action }) => {
  if (!action) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400">
        No action selected
      </div>
    );
  }

  // Create tooltip content with action details
  const tooltipContent = `
    Skill: ${action.skill}
    Modifier: ${action.modifier}
    ${action.priority ? "Priority" : ""}
    
    ${action.description}
  `;

  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-white text-lg">
        Hero is preparing to use{" "}
        <span 
          className="font-bold text-yellow-300 cursor-help" 
          title={tooltipContent}
        >
          {action.name}!
        </span>
      </div>
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
