import React from 'react';
import { GameState } from '../types/gamestate';
import { UIAction } from './uiTypes';
import CombatRoom from './components/CombatRoom';
import CharacterSelection from './components/CharacterSelection';
import TopBar from './components/CombatRoom/TopBar';
import { useLoading } from './LoadingContext';
import { addCharacterToRoom } from '../game_engine/gameEngine';

interface GameInterfaceProps {
  gameState: GameState;
  onAction: (action: UIAction) => Promise<void>;
  onNavigate: (view: string) => void;
  onToggleNarration?: () => void;
  onStartCombat?: () => Promise<void>;
  combatStarted?: boolean;
  onStateChange?: (newState: GameState) => void;
}

const GameInterface: React.FC<GameInterfaceProps> = ({
  gameState,
  onAction,
  onNavigate,
  onToggleNarration,
  onStartCombat,
  combatStarted = false,
  onStateChange
}) => {
  // State for character selection
  const [selectedHero, setSelectedHero] = React.useState<string | null>(null);
  const [selectedMonster, setSelectedMonster] = React.useState<string | null>(null);
  const [internalCombatStarted, setInternalCombatStarted] = React.useState(combatStarted);
  const { setIsLoading, isLoading } = useLoading();

  // Use either the prop or internal state for combat started
  const isCombatStarted = combatStarted || internalCombatStarted;

  // Initialize combat state
  const initializeCombatState = React.useCallback(async () => {
    // If onStartCombat is provided, use it
    if (onStartCombat) {
      await onStartCombat();
      return;
    }

    // Otherwise handle it internally
    setIsLoading(true);
    try {
      console.log("Selected hero ID:", selectedHero);
      console.log("Selected monster ID:", selectedMonster);
      
      // Find the hero by ID from any room
      let hero;
      let heroRoom;
      
      // Search through all rooms to find the hero
      for (const roomId in gameState.dungeon.rooms) {
        const room = gameState.dungeon.rooms[roomId];
        const foundHero = room.characters.find(char => char.id === selectedHero);
        if (foundHero) {
          hero = foundHero;
          heroRoom = room;
          break;
        }
      }
      
      if (!hero) {
        console.error("Hero not found with ID:", selectedHero);
        return;
      }
      
      // Get the monster from the monsters object
      const monster = gameState.monsters[selectedMonster];
      if (!monster) {
        console.error("Monster not found with ID:", selectedMonster);
        return;
      }
      
      console.log("Found hero:", hero);
      console.log("Found monster:", monster);
      console.log("Hero room:", heroRoom);
      
      // Move the monster to the hero's room to trigger combat
      let newState = { ...gameState };
      console.log("Moving monster to hero's room", monster, heroRoom);
      newState = await addCharacterToRoom(newState, monster, heroRoom);
      
      if (onStateChange) {
        onStateChange(newState);
      }
      setInternalCombatStarted(true);
    } catch (error) {
      console.error('Error initializing combat:', error);
    } finally {
      setIsLoading(false);
    }
  }, [gameState, selectedHero, selectedMonster, setIsLoading, onStartCombat, onStateChange]);

  // Reset combat when it ends
  React.useEffect(() => {
    if (!gameState.activeCombat && internalCombatStarted) {
      setInternalCombatStarted(false);
      setSelectedMonster(null);
      // Keep selectedHero so the player can use the same hero for the next battle
    }
  }, [gameState.activeCombat, internalCombatStarted]);

  // Handle toggle narration
  const handleToggleNarration = React.useCallback(() => {
    if (onToggleNarration) {
      onToggleNarration();
    }
  }, [onToggleNarration]);

  // Conditional rendering based on combat state
  if (!isCombatStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 p-6">
        <TopBar 
          narrationEnabled={gameState.settings.narrationEnabled}
          onToggleNarration={handleToggleNarration}
          turnCounter={0}
          dayCounter={0}
          infamy={0}
        />
        <div className="bg-slate-800 p-8 rounded-lg shadow-lg max-w-lg w-full mt-4">
          <h2 className="text-2xl font-bold mb-6 text-center text-white">Combat Setup</h2>
          <CharacterSelection 
            characters={gameState.monsters} 
            selectedId={selectedMonster} 
            onSelect={setSelectedMonster}
            label="Select Monster" 
          />
          <CharacterSelection 
            characters={gameState.heroes} 
            selectedId={selectedHero} 
            onSelect={setSelectedHero}
            label="Select Hero" 
          />
          <button 
            onClick={initializeCombatState}
            disabled={!selectedHero || !selectedMonster || isLoading}
            className={`w-full mt-6 px-6 py-3 rounded-lg text-lg font-semibold
              ${!selectedHero || !selectedMonster || isLoading
                ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'}`}
          >
            {isLoading ? 'Initializing Combat...' : 'Begin Combat'}
          </button>
        </div>
      </div>
    );
  }

  // Combat view
  return (
    <CombatRoom 
      gameState={gameState}
      onAction={onAction}
      onNavigate={onNavigate}
      onToggleNarration={handleToggleNarration}
      onStartCombat={initializeCombatState}
      combatStarted={isCombatStarted}
    />
  );
};

export default GameInterface;
