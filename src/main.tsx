import React from 'react'
import ReactDOM from 'react-dom/client'
import GameInterface from './react_ui/GameInterface'
import { createTestCombatScenario, createDefaultTestCharacters, createTestGameState } from './testing/stateGenerators'
import { executeAction } from './game_engine/gameActions'
import { UIAction } from './react_ui/types/uiTypes'
import { LoadingProvider, useLoading } from './react_ui/context/LoadingContext'
import './index.css'

const GameApp = () => {
  // Initialize test game state
  const [gameState, setGameState] = React.useState(() => {
    // Return empty initial state
    return createTestGameState();
  });

  // Load combat state asynchronously
  React.useEffect(() => {
    async function initGame() {
      const { player, monster } = createDefaultTestCharacters();
      // Use the Corrupted Chapel room for testing
      const initialState = await createTestCombatScenario(player, monster, "Corrupted Chapel_3_1");  // Room ID for Corrupted Chapel at grid position [1,3]
      setGameState(initialState);
    }

    initGame();
  }, []); // Empty dependency array means this runs once on mount

  const { setIsLoading } = useLoading();

  const handleAction = async (action: UIAction) => {
    setIsLoading(true);
    try {
      const result = await executeAction(gameState, action);
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
