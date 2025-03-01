import React from 'react';
import { GameState } from '../types/gamestate';
import { UIAction } from './uiTypes';
import CombatRoom from './components/CombatRoom';
import CharacterSelection from './components/CharacterSelection';
import Sidebar from './components/Sidebar';
import { useLoading } from './LoadingContext';
import { addCharacterToRoom } from '../game_engine/gameEngine';
import { saveSettings } from '../game_engine/settings';

interface GameInterfaceProps {
  gameState: GameState;
  onAction: (action: UIAction) => Promise<void>;
  onNavigate: (view: string) => void;
  onStartCombat?: () => Promise<void>;
  combatStarted?: boolean;
  onStateChange?: (newState: GameState) => void;
}

const GameInterface: React.FC<GameInterfaceProps> = ({
  gameState,
  onAction,
  onNavigate,
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

  // Narration is now handled in the Settings component

  // Render the main interface with global sidebar
  return (
    <div className="flex h-screen bg-slate-900">
      {/* Global Sidebar with Settings */}
      <Sidebar 
        onNavigate={onNavigate} 
        settings={gameState.settings}
        onSettingsChange={(newSettings) => {
          // Update game state with new settings
          if (onStateChange) {
            onStateChange({
              ...gameState,
              settings: newSettings
            });
          }
          
          // Save settings to localStorage
          saveSettings(newSettings);
        }}
      />
      
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className="bg-slate-800 text-white p-4 flex justify-between items-center shadow-lg shadow-black/25">
          <div className="flex items-center gap-4">
            <span>Turn {gameState.turnCounter} - Day {gameState.dayCounter}</span>
            {gameState.activeCombat && (
              <span className="px-3 py-1 bg-slate-700 rounded shadow-inner shadow-black/25 border border-white/30">
                Current Encounter: {gameState.activeCombat.room.id} | Round {gameState.activeCombat.round || 1}
              </span>
            )}
          </div>
        </div>
        
        {/* Main content area */}
        {!isCombatStarted ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <div className="bg-slate-800 p-8 rounded-lg shadow-lg max-w-lg w-full">
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
        ) : (
          <CombatRoom 
            gameState={gameState}
            onAction={onAction}
            onNavigate={onNavigate}
            onStartCombat={initializeCombatState}
            combatStarted={isCombatStarted}
          />
        )}
      </div>
    </div>
  );
};

export default GameInterface;
