import React from 'react'
import ReactDOM from 'react-dom/client'
import GameInterface from './react_ui/GameInterface'
import { createTestStateWithSeparateCharacters } from './testing/stateGenerators'
import { executeActionFromUI, moveCharacterToRoom } from './game_engine/gameEngine'
import { UIAction } from './react_ui/uiTypes'
import { LoadingProvider, useLoading } from './react_ui/LoadingContext'
import './index.css'

const GameApp = () => {
  // Initialize test game state with a hero in one room and a monster in another
  const [gameState, setGameState] = React.useState(() => {
    return createTestStateWithSeparateCharacters();
  });

  const handleToggleNarration = React.useCallback(() => {
    setGameState(prevState => ({
      ...prevState,
      settings: {
        ...prevState.settings,
        narrationEnabled: !prevState.settings.narrationEnabled
      }
    }));
  }, []);

  const [combatStarted, setCombatStarted] = React.useState(false);

  const initializeCombatState = React.useCallback(async () => {
    try {
      // Get the hero and a room with the hero
      const hero = Object.values(gameState.characters).find(char => char.type === 'hero');
      const heroRoom = Object.values(gameState.dungeon.rooms).find(room => 
        room.characters.some(char => char.id === hero?.id)
      );
      
      if (!hero || !heroRoom) {
        console.error('Hero or hero room not found');
        return;
      }
      
      // Find a monster and its room
      const monster = Object.values(gameState.characters).find(char => char.type === 'monster');
      const monsterRoom = Object.values(gameState.dungeon.rooms).find(room => 
        room.id !== heroRoom.id && room.characters.some(char => char.id === monster?.id)
      );
      
      if (!monster || !monsterRoom) {
        console.error('Monster or monster room not found');
        return;
      }
      
      // Move the monster to the hero's room to trigger combat
      const newState = { ...gameState };
      await moveCharacterToRoom(newState, monster, heroRoom);
      
      setGameState(newState);
      setCombatStarted(true);
    } catch (error) {
      console.error('Error initializing combat:', error);
    }
  }, [gameState]);

  const { setIsLoading } = useLoading();

  const handleAction = async (action: UIAction) => {
    setIsLoading(true);
    try {
      const result = await executeActionFromUI(gameState, action);
      if (result.success) {
        setGameState(result.newState);
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
    <GameInterface 
      gameState={gameState}
      onAction={handleAction}
      onNavigate={(view) => console.log('Navigate to:', view)}
      onToggleNarration={handleToggleNarration}
      onStartCombat={initializeCombatState}
      combatStarted={combatStarted}
    />
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
