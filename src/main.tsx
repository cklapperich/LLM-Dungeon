import React from 'react'
import ReactDOM from 'react-dom/client'
import GameInterface from './react_ui/GameInterface'
import { createTestStateWithCharactersInRoom } from './testing/stateGenerators'
import { executeActionFromUI, addCharacterToRoom } from './game_engine/gameEngine'
import { characterToUICard, UIAction } from './react_ui/uiTypes'
import { LoadingProvider, useLoading } from './react_ui/LoadingContext'
import './index.css'
import { Character } from './types/actor';
import { MiniCard } from './react_ui/components/Card';
import TopBar from './react_ui/components/CombatRoom/TopBar';
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

const GameApp = () => {
  // Initialize test game state with a hero in one room and a monster in another
  const [gameState, setGameState] = React.useState(() => {
    return createTestStateWithCharactersInRoom();
  });
  
// State declarations should be:
  const [selectedHero, setSelectedHero] = React.useState<string | null>(null);
  const [selectedMonster, setSelectedMonster] = React.useState<string | null>(null);
  const [combatStarted, setCombatStarted] = React.useState(false);

  const handleToggleNarration = React.useCallback(() => {
    setGameState(prevState => ({
      ...prevState,
      settings: {
        ...prevState.settings,
        narrationEnabled: !prevState.settings.narrationEnabled
      }
    }));
  }, []);

  const { setIsLoading, isLoading } = useLoading();

  // move the selected characters to the room by calling the gamestate.ts functions to move characters
  const initializeCombatState = React.useCallback(async () => {
    // Prevent multiple clicks by setting loading state immediately
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
      
      setGameState(newState);
      setCombatStarted(true);
    } catch (error) {
      console.error('Error initializing combat:', error);
    } finally {
      setIsLoading(false);
    }
  }, [gameState, selectedHero, selectedMonster, setIsLoading]);

  const handleAction = async (action: UIAction) => {
    setIsLoading(true);
    try {
      const result = await executeActionFromUI(gameState, action);
      if (result.success) {
        setGameState(result.newState);
        
        // If combat has ended, reset UI state
        if (!result.newState.activeCombat) {
          setCombatStarted(false);
          setSelectedMonster(null);
          // Keep selectedHero so the player can use the same hero for the next battle
        }
      } else {
        console.error(result.message);
      }
    } catch (error) {
      console.error('Error executing action:', error);
    } finally {
      setIsLoading(false);
    } 
  };

  return (
    <>
      {!combatStarted ? (
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
      ) : (
        <GameInterface 
          gameState={gameState}
          onAction={handleAction}
          onNavigate={(view) => console.log('Navigate to:', view)}
          onToggleNarration={handleToggleNarration}
          onStartCombat={initializeCombatState}
          combatStarted={combatStarted}
        />
      )}
    </>
  );
};

const App = () => (
  <LoadingProvider>
    <GameApp />
  </LoadingProvider>
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
