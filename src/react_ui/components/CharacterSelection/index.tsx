import React from 'react';
import { Character } from '../../../types/actor';
import { MiniCard } from '../Card';
import { characterToUICard } from '../../uiTypes';

interface CharacterSelectionProps {
  characters: Record<string, Character>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  label: string;
}

const CharacterSelection: React.FC<CharacterSelectionProps> = ({ 
  characters, 
  selectedId, 
  onSelect, 
  label 
}) => (
  <div className="mb-6 w-full max-w-md">
    <h3 className="text-xl font-semibold mb-3 text-white">{label}</h3>
    <div className="flex flex-wrap gap-2">
      {Object.values(characters).map(character => (
        <div 
          key={character.id}
          onClick={() => onSelect(character.id)}
          className={`cursor-pointer transition-all ${selectedId === character.id ? 'ring-2 ring-white' : ''}`}
          style={{ width: '100px' }}
        >
          <MiniCard 
            data={characterToUICard(character, character.type as 'hero' | 'monster')} 
          />
        </div>
      ))}
    </div>
  </div>
);

export default CharacterSelection;
