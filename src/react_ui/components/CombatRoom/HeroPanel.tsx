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

  // Format effects for tooltip - generic approach that works with any effect type
  const formatEffects = (effects) => {
    if (!effects || effects.length === 0) return "No effects";
    
    return effects.map(effect => {
      const target = effect.target || 'other';
      let effectInfo = `${effect.type} (${target})`;
      
      // Generic approach to display all parameters
      if (effect.params && Object.keys(effect.params).length > 0) {
        const paramDetails = Object.entries(effect.params)
          .filter(([_, value]) => value !== undefined)
          .map(([key, value]) => {
            // Format the parameter name to be more readable
            const formattedKey = key
              .replace(/([A-Z])/g, ' $1') // Add space before capital letters
              .replace(/^./, str => str.toUpperCase()); // Capitalize first letter
            
            // Handle special case for boolean values
            if (typeof value === 'boolean') {
              return formattedKey;
            }
            
            return `${formattedKey}: ${value}`;
          });
        
        if (paramDetails.length > 0) {
          effectInfo += ` (${paramDetails.join(', ')})`;
        }
      }
      
      // Add info about applying on skill check failure if present
      if (effect.applyOnSkillCheckFailure) {
        effectInfo += " [Applies on failure]";
      }
      
      return effectInfo;
    }).join('\n    ');
  };

  // Create tooltip content with action details
  const tooltipContent = `
    Skill: ${action.skill}
    Modifier: ${action.modifier}
    ${action.priority ? "Priority" : ""}
    
    ${action.description}
    
    Effects:
    ${formatEffects(action.effects)}
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
