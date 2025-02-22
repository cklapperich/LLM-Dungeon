import React from 'react'
import ReactDOM from 'react-dom/client'
import claraJson from '../data/monsters/clara.json'
import greenSlimeJson from '../data/monsters/green_slime.json'
import GameInterface from './react_ui/GameInterface'
import { createTestGameState, GamePhase } from './types/gamestate'
import { MonsterSize, RarityType, TargetType } from './types/constants'
import { loadMonster } from './game_engine/utils/dataLoader'
import { getLegalActions } from './game_engine/combat'
import { Skills } from './types/skilltypes'
import './index.css'

// Create characters from data
const hero = loadMonster(claraJson);
const monster = loadMonster(greenSlimeJson);

// Create a test game state
const testGameState = createTestGameState({
  turnCounter: 1,
  dayCounter: 1,
  infamy: 100,
  messageLog: [
    { sender: 'system', content: 'Combat initialized...', timestamp: Date.now() },
    { sender: 'assistant', content: 'Monster appears!', timestamp: Date.now() }
  ],
  activeCombat: {
    roomId: 'test-room',
    characters: [hero, monster],
    round: 1,
    isComplete: false,
    activeCharacterIndex: 0,
    current_turn: 'player',
    legalActions: [], // Will be populated by getLegalActions
    actionResults: []
  },
  currentPhase: 'combat' as GamePhase
});

// Populate legal actions for combat state
if (testGameState.activeCombat) {
  const actions = getLegalActions(testGameState.activeCombat.characters[0], testGameState.activeCombat);
  testGameState.activeCombat.legalActions = actions;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GameInterface 
      gameState={testGameState}
      onAction={(action) => console.log('Action:', action)}
      onNavigate={(view) => console.log('Navigate to:', view)}
    />
  </React.StrictMode>
)
