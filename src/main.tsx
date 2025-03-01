import React from 'react'
import ReactDOM from 'react-dom/client'
import GameInterface from './react_ui/GameInterface'
import { createTestStateWithCharactersInRoom } from './testing/stateGenerators'
import { executeActionFromUI } from './game_engine/gameEngine'
import { UIAction } from './react_ui/uiTypes'
import { LoadingProvider, useLoading } from './react_ui/LoadingContext'
import './index.css'

const GameApp = () => {
  // Initialize test game state
  const [gameState, setGameState] = React.useState(() => {
    return createTestStateWithCharactersInRoom();
  });
  
  const [combatStarted, setCombatStarted] = React.useState(false);
  const { setIsLoading } = useLoading();

  // This function is no longer needed as settings are now handled in the Settings component
  // The Settings component directly updates the game state with new settings

  // Handle UI actions
  const handleAction = async (action: UIAction) => {
    setIsLoading(true);
    try {
      const result = await executeActionFromUI(gameState, action);
      if (result.success) {
        setGameState(result.newState);
        
        // If combat has ended, reset UI state
        if (!result.newState.activeCombat && combatStarted) {
          setCombatStarted(false);
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
    <GameInterface 
      gameState={gameState}
      onAction={handleAction}
      onNavigate={(view) => console.log('Navigate to:', view)}
      combatStarted={combatStarted}
      onStateChange={setGameState}
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
