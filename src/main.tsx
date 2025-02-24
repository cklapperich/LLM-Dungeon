import React from 'react'
import ReactDOM from 'react-dom/client'
import GameInterface from './react_ui/GameInterface'
import { createTestCombatScenario, createDefaultTestCharacters, createTestGameState } from './testing/stateGenerators'
import { executeActionFromUI } from './game_engine/combatEngine'
import { UIAction } from './react_ui/types/uiTypes'
import { LoadingProvider, useLoading } from './react_ui/context/LoadingContext'
import './index.css'

const GameApp = () => {
  // Initialize test game state with narration disabled
  const [gameState, setGameState] = React.useState(() => {
    return createTestGameState({ narrationEnabled: false });
  });

  const handleToggleNarration = React.useCallback(() => {
    setGameState(prevState => ({
      ...prevState,
      narrationEnabled: !prevState.narrationEnabled
    }));
  }, []);

  const [combatStarted, setCombatStarted] = React.useState(false);

  const initializeCombatState = React.useCallback(async () => {
    const { player, monster } = createDefaultTestCharacters();
    const initialState = await createTestCombatScenario(
      player,
      monster,
      "Corrupted Chapel_3_1",
      { narrationEnabled: gameState.narrationEnabled }
    );
    setGameState(initialState);
    setCombatStarted(true);
  }, [gameState.narrationEnabled]);

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
