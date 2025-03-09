import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Sword, Shield, Zap, Circle, Star, Crown } from 'lucide-react';
import { Trait } from '../../../types/abilities';
import { SkillName } from '../../../types/skilltypes';
import { CombatGameAction } from '../../../types/gamestate';
import { Effect } from '../../../game_engine/combat/effect';

// Expanded Skill to Icon mapping
const SkillIcons: Record<string, React.FC<{ size?: number; className?: string }>> = {
  Stealth: EyeOff,
  Perception: Eye,
  "Strong Grapple": Sword,
  "Quick Grapple": Zap,
  "Light Weapons": Sword,
  "Heavy Weapons": Sword,
  Block: Shield,
  Dodge: EyeOff,
  Parry: Shield
};

// Mapping for rarity icons and colors
const rarityMapping: Record<string, { 
  icon: React.FC<{ size?: number; className?: string }>, 
  color: string, 
  borderColor: string 
}> = {
  common: { 
    icon: Circle,
    color: "text-blue-500",
    borderColor: "border-blue-500"
  },
  rare: { 
    icon: Star,
    color: "text-orange-500",
    borderColor: "border-green-500"
  },
  legendary: { 
    icon: Crown,
    color: "text-red-500",
    borderColor: "border-red-500"
  }
};

// Event type and subtype mapping to readable text
const eventTypeMapping: Record<string, Record<string, string>> = {
  "PHASECHANGE": {
    "START": "Start of Combat",
    "END": "End of Combat",
    "default": "Phase Change"
  },
  "TURN": {
    "START": "Start of Turn",
    "END": "End of Turn",
    "default": "During Turn"
  },
  "ACTION": {
    "BEFORE": "Before Action",
    "AFTER": "After Action",
    "default": "During Action"
  },
  "default": {
    "default": "Passive Effect"
  }
};

// Function to get readable event timing text
const getEventTimingText = (eventtype?: string, subtype?: string): string => {
  if (!eventtype) return "Always Active";
  
  const eventCategory = eventTypeMapping[eventtype] || eventTypeMapping["default"];
  return subtype ? (eventCategory[subtype] || eventCategory["default"]) : eventCategory["default"];
};

// Function to highlight status effects in a description
const highlightStatusesInDescription = (description: string): React.ReactNode => {
  // List of status effects to highlight
  const statusEffects = [
    'Ambushed', 'Grappled', 'Bound', 'Penetrated', 
    'Inseminated', 'Slow', 'Weaken', 'Heat'
  ];
  
  // Create a regex pattern that matches any of the status effects
  const pattern = new RegExp(`\\b(${statusEffects.join('|')})\\b`, 'g');
  
  // Split the description by the pattern and map the parts
  const parts = description.split(pattern);
  
  return parts.map((part, index) => {
    // Check if this part is a status effect
    if (statusEffects.includes(part)) {
      return <span key={index} className="text-amber-300 font-semibold">{part}</span>;
    }
    return part;
  });
};

// Helper function to highlight numeric values
const highlightNumericValue = (value: number | string): React.ReactNode => {
  return <span className="text-amber-300 font-semibold">{value}</span>;
};

// Helper function for pluralization
const pluralize = (count: number, singular: string, plural?: string): string => {
  return count === 1 ? singular : (plural || `${singular}s`);
};

// Function to format effect descriptions in a user-friendly way
const formatEffectDescription = (effect: Effect): React.ReactNode => {
  const effectType = effect.type;
  const target = effect.target || "the target";
  const params = effect.params || {};
  
  switch (effectType) {
    case "STATUS":
      return <>Apply <span className="text-amber-300 font-semibold">{params.type}</span> to {target}</>;
    case "WOUND":
      return <>Deal {highlightNumericValue(params.value)} damage to {target}</>;
    case "HEAL":
      return <>Heal {highlightNumericValue(params.value)} health to {target}</>;
    case "GRAPPLE":
      return <>Grapple {target} with <span className="text-amber-300 font-semibold">{params.type || 'grab'}</span></>;
    case "PENETRATE":
      return <>Penetrate {target}</>;
    case "MODIFY_CLOTHING":
      const amount = Number(params.amount);
      if (amount < 0) {
        const absAmount = Math.abs(amount);
        return <>Tear {highlightNumericValue(absAmount)} {pluralize(absAmount, 'point')} of clothing</>;
      } else {
        return <>Repair {highlightNumericValue(amount)} {pluralize(amount, 'point')} of clothing</>;
      }
    case "BREAK_FREE":
      return <>Break free from grapple</>;
    case "CORRUPT":
      return <>Corrupt {target}</>;
    case "ADVANCE_TURN":
      return <>Advance to next turn</>;
    case "END_COMBAT":
      return <>End combat ({params.reason ? <span className="text-amber-300 font-semibold">{params.reason}</span> : 'unspecified'})</>;
    case "SCRIPT":
      return <>Run script: <span className="text-amber-300 font-semibold">{params.name || 'unnamed'}</span></>;
    default:
      return <>{effectType} {Object.keys(params).length > 0 ? 
        Object.entries(params).map(([k, v], idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && ', '}
            {k}: <span className="text-amber-300 font-semibold">{v}</span>
          </React.Fragment>
        )) : ''} to {target}</>;
  }
};

interface AbilityCardProps {
  trait: Trait;
  className?: string;
}

const AbilityCard: React.FC<AbilityCardProps> = ({ trait, className = '' }) => {
  // Using a 3.5:2.5 aspect ratio
  const cardWidth = 250;
  const cardHeight = 350;
  
  // Get the appropriate icon components
  const SkillIcon = SkillIcons[trait.skill] || EyeOff;
  const DefenseIcon = trait.defenseOptions.length > 0 && SkillIcons[trait.defenseOptions[0]] ? 
    SkillIcons[trait.defenseOptions[0]] : Eye;
  
  // Get rarity styling and icon
  const rarityInfo = rarityMapping[trait.rarity] || rarityMapping.common;
  const RarityIcon = rarityInfo.icon;
  
  // Determine if this is a passive or active ability
  const isPassive = trait.passive === true;
  
  // Get readable event timing
  const eventTimingText = isPassive && trait.passive_event_type ? 
    getEventTimingText(trait.passive_event_type.type, trait.passive_event_type.subtype) : 
    null;
  
  return (
    <div 
      className={`inline-block ${className} ${rarityInfo.borderColor} border-4 rounded-lg`} 
      style={{ width: cardWidth, height: cardHeight }}
    >
      {/* Card with gradient background */}
      <div 
        className="bg-gradient-to-b from-purple-900 to-purple-950 text-white rounded-md overflow-hidden h-full"
      >
        {/* Card Header with Name, Type Badge and Rarity Icon */}
        <div className="p-2 bg-gradient-to-r from-purple-800 to-indigo-900 border-b border-amber-500">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="font-bold text-lg mr-2">{trait.name}</div>
              {/* Action/Passive badge moved to same line as title */}
              {isPassive ? (
                <div className="inline-block px-2 py-0.5 bg-blue-800 rounded-full text-xs text-blue-200">
                  Passive - {eventTimingText || "Always Active"}
                </div>
              ) : (
                <div className="inline-block px-2 py-0.5 bg-blue-800 rounded-full text-xs text-blue-200">
                  Action
                </div>
              )}
            </div>
            {/* Rarity icon with original colors */}
            <div>
              {/* Render appropriate icon based on rarity */}
              {trait.rarity === 'common' && <Circle className="w-5 h-5 text-blue-500" fill="currentColor" />}
              {trait.rarity === 'rare' && <Star className="w-5 h-5 text-orange-500" />}
              {trait.rarity === 'legendary' && <Crown className="w-5 h-5 text-red-500" />}
              
              {/* Default case if rarity is not recognized */}
              {(!trait.rarity || (trait.rarity !== 'common' && trait.rarity !== 'rare' && trait.rarity !== 'legendary')) && 
                <Circle className="w-5 h-5 text-blue-500" fill="currentColor" />
              }
            </div>
          </div>
          
          {/* Body Part Requirements */}
          <div className="flex flex-wrap gap-1 mt-1 justify-end">
            {trait.requirements?.parts && Object.entries(trait.requirements.parts).map(([part, count]) => (
              <div key={part} className="flex items-center bg-indigo-800 px-2 py-0.5 rounded-full text-xs">
                <span>{
                  part === "wing" ? "🦋" : 
                  part === "webspinner" ? "🕸️" : 
                  part === "claw" ? "🐾" : 
                  part === "fang" ? "🦷" : 
                  part === "tentacle" ? "🦑" : 
                  part
                }</span>
                {count > 1 && <span className="ml-1">x{count}</span>}
              </div>
            ))}
          </div>
        </div>
        
        {/* Card Body */}
        <div className="p-3 text-sm relative" style={{ height: 'calc(100% - 56px)' }}>
          {/* Skill Check - Moved up directly beneath the gold border */}
          <div className="p-2 bg-indigo-950 rounded-lg border border-indigo-700 mb-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <SkillIcon size={14} className="text-amber-500 mr-1" />
                <span className="text-amber-500 font-medium">{trait.skill}</span>
              </div>
              <div className="flex items-center">
                <span className="text-purple-300 font-mono font-bold">
                  {trait.modifier >= 0 ? `+${trait.modifier}` : trait.modifier}
                </span>
              </div>
            </div>
            {trait.defenseOptions.length > 0 && (
              <div className="flex items-center text-xs text-gray-300">
                <span>vs</span>
                <div className="ml-2 flex items-center">
                  <DefenseIcon size={14} className="text-amber-500 mr-1" />
                  <span className="text-amber-500">{trait.defenseOptions[0]}</span>
                </div>
              </div>
            )}
          </div>
          
          <p className="mb-4">
            {highlightStatusesInDescription(trait.description)}
          </p>
          
          {/* Effects section - Removed "Effects:" text */}
          {trait.effects.length > 0 && (
            <div className="mt-2 text-xs">
              <ul className="list-disc pl-4 space-y-1">
                {trait.effects.map((effect, index) => (
                  <li key={index} className="text-gray-200">
                    {formatEffectDescription(effect)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Modal component that shows the ability card
interface AbilityModalProps {
  trait: Trait;
  children: React.ReactNode;
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export const AbilityModal: React.FC<AbilityModalProps> = ({ 
  trait, 
  children,
  className = '',
  isOpen = false,
  onClose
}) => {
  const [showModal, setShowModal] = useState(isOpen);
  
  // Update internal state when prop changes
  useEffect(() => {
    setShowModal(isOpen);
  }, [isOpen]);
  
  // Handle click outside to close the modal
  const handleBackdropClick = () => {
    setShowModal(false);
    if (onClose) onClose();
  };
  
  // Prevent clicks on the card from closing the modal
  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Method to manually open the modal (for external triggers)
  const openModal = () => {
    setShowModal(true);
  };

  return (
    <>
      <div className={`inline-block ${className}`}>
        {children}
      </div>
      
      {showModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fadeIn"
          onClick={handleBackdropClick}
        >
          <div 
            onClick={handleCardClick}
            className="animate-scaleIn"
          >
            <AbilityCard trait={trait} />
          </div>
        </div>
      )}
    </>
  );
};

// Helper function to extract trait from UIAction
export const getTraitFromAction = (action: any): Trait | null => {
  if (!action) return null;
  
  // If it's a CombatGameAction, get the trait directly
  if (action.type === 'combat' && action.trait) {
    return action.trait;
  }
  
  // If it's a UIAction with a gameAction property
  if (action.gameAction && action.gameAction.type === 'combat') {
    return (action.gameAction as CombatGameAction).trait;
  }
  
  return null;
};

export default AbilityCard;
