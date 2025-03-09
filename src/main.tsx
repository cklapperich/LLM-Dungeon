import React from 'react'
import ReactDOM from 'react-dom/client'
import GameInterface from './react_ui/GameInterface'
import { createTestStateWithCharactersInRoom } from './testing/stateGenerators'
import { executeActionFromUI } from './game_engine/gameEngine'
import { UIAction } from './react_ui/uiTypes'
import { LoadingProvider, useLoading } from './react_ui/LoadingContext'
import './index.css'

const GameApp = () => {
  // Initialize loading state
  const { setIsLoading } = useLoading();
  
  // Initialize game state
  const [gameState, setGameState] = React.useState(null);
  const [combatStarted, setCombatStarted] = React.useState(false);
  
  // Load game state asynchronously
  React.useEffect(() => {
    const loadGameState = async () => {
      setIsLoading(true);
      try {
        const initialState = await createTestStateWithCharactersInRoom();
        setGameState(initialState);
      } catch (error) {
        console.error('Error loading game state:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadGameState();
  }, [setIsLoading]);

  // Handle UI actions
  const handleAction = async (action: UIAction) => {
    if (!gameState) return;
    
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

  // Show loading state if game state is not loaded yet
  if (!gameState) {
    return <div className="flex h-screen items-center justify-center bg-slate-900 text-white">
      <p className="text-xl">Loading game...</p>
    </div>;
  }

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
