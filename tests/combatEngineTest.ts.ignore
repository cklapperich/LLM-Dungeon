import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { uiEventBus } from '../src/events/eventBus';
import { createNewCombat} from '../src/game_engine/combat/combatEngine';
import { createTestGameState, createDefaultTestCharacters, createTestCombatScenario } from '../src/testing/stateGenerators';
import { generateInitialNarration } from '../src/game_engine/combat/combatNarration';
// Add mockLLMDelay to global scope
declare global {
  var mockLLMDelay: number;
}

// Import the actual module to spy on it
import * as llmModule from '../src/game_engine/llm';

// Mock the LLM module
vi.mock('../src/game_engine/llm', () => {
  return {
    callLLM: vi.fn().mockImplementation((taskType, messages, model) => {
      console.log(`Mock LLM called at: ${new Date().toISOString()}`);
      return new Promise((resolve) => {
        // Configurable delay to simulate LLM response time
        setTimeout(() => {
          console.log(`Mock LLM resolving at: ${new Date().toISOString()}`);
          resolve("This is a mocked LLM response for testing purposes.");
        }, global.mockLLMDelay || 3000); // Default 3 second delay
      });
    }),
    formatSystemPrompt: vi.fn().mockReturnValue("Mocked system prompt"),
    TaskType: { narrate: 'narrate' }
  };
});

describe('Combat Engine Tests', () => {
  // Setup global mock delay variable
  beforeAll(() => {
    global.mockLLMDelay = 3000; // Default 3 second delay
  });

  // Setup and teardown for each test
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up event listeners
    uiEventBus.all.clear();
  });

  it('should call LLM when narration is enabled and COMBAT START event is emitted', async () => {
    // Create test game state with player and monster and narration enabled
    const { player, monster } = createDefaultTestCharacters();
    const gameState = createTestGameState({
      characters: {
        [player.name]: player,
        [monster.name]: monster
      }
    });
    
    // Get a reference to the mocked callLLM function
    const mockedCallLLM = llmModule.callLLM as unknown as ReturnType<typeof vi.fn>;
    
    // Import the logAndEmitEvent function to manually emit a COMBAT START event
    const { logAndEmitCombatEvent: logAndEmitEvent } = await import('../src/game_engine/combat/combatLogManager');
    
    console.log("narration enabled:", gameState.settings.narrationEnabled);
    gameState.settings.narrationEnabled = true;
    const combatState = await createNewCombat(gameState, 'test-room-id');

    console.log('Combat log:', combatState.combatLog)
    gameState.activeCombat = combatState;
    
    // // Manually emit a COMBAT START event
    // const combatStartEvent = {
    //   type: 'COMBAT' as const,
    //   subtype: 'START' as const,
    //   characters: [player, monster],
    //   room_id: 'test-room-id'
    // };
    
    // // Log and emit the event
    // await logAndEmitEvent(combatStartEvent, gameState);
    
    // Verify that the LLM was called for narration
    expect(mockedCallLLM).toHaveBeenCalled();
    expect(mockedCallLLM.mock.calls[0][0]).toBe('narrate');
  });

  // Add a direct test for narration generation
  it('should directly call LLM when generating narration', async () => {
    // Create test game state with player and monster
    const { player, monster } = createDefaultTestCharacters();
    const gameState = createTestGameState({
      characters: {
        [player.name]: player,
        [monster.name]: monster
      },
      narrationEnabled: true
    });
    
    // Get a reference to the mocked callLLM function
    const mockedCallLLM = llmModule.callLLM as unknown as ReturnType<typeof vi.fn>;
    
    // Initialize combat to get a valid combat state
    const combatState = await createNewCombat(gameState, 'test-room-id');
    gameState.activeCombat = combatState;
    
    console.log("About to call generateInitialNarration directly");
    
    // Call narration generation directly
    const narration = await generateInitialNarration(combatState, gameState);
    
    console.log("Generated narration:", narration);
    
    // Verify LLM was called
    expect(mockedCallLLM).toHaveBeenCalled();
    expect(mockedCallLLM.mock.calls[0][0]).toBe('narrate');
  });

  // it('should initialize combat with correct state', async () => {
  //   // Create test game state with player and monster
  //   const { player, monster } = createDefaultTestCharacters();
  //   const gameState = createTestGameState({
  //     characters: {
  //       [player.name]: player,
  //       [monster.name]: monster
  //     }
  //   });
    
  //   console.log(`Starting combat initialization at: ${new Date().toISOString()}`);
    
  //   // Initialize combat
  //   const combatState = await initializeCombat(gameState, 'test-room-id');
    
  //   console.log(`Combat initialization completed at: ${new Date().toISOString()}`);
    
  //   // Verify combat was initialized correctly
  //   expect(combatState).toBeDefined();
  //   expect(combatState.characterIds).toHaveLength(2);
  //   expect(combatState.characterIds).toContain(player.name);
  //   expect(combatState.characterIds).toContain(monster.name);
    
  //   // Verify player actions were set up
  //   expect(combatState.playerActions).toBeDefined();
  //   expect(combatState.playerActions.length).toBeGreaterThan(0);
    
  //   // Verify combat log was initialized
  //   expect(combatState.combatLog).toBeDefined();
  //   expect(combatState.combatLog.length).toBeGreaterThan(0);
    
  //   // Verify room ID was set correctly
  //   expect(combatState.roomId).toBe('test-room-id');
  // });

  // it('should execute a slam action and update state correctly', async () => {
  //   // Create test combat scenario
  //   const { player, monster } = createDefaultTestCharacters();
  //   const gameState = await createTestCombatScenario(player, monster, 'test-room-id');
    
  //   // Set up event listeners
  //   const executionCompleteSpy = vi.fn();
  //   uiEventBus.on('ui:EXECUTION_COMPLETE', executionCompleteSpy);
    
  //   // Get the slam action from the available player actions
  //   const slamAction = gameState.activeCombat.playerActions.find(action => action.type === 'Slam');
  //   expect(slamAction).toBeDefined();
    
  //   console.log(`Starting slam action execution at: ${new Date().toISOString()}`);
  //   console.log('Player actions available:', gameState.activeCombat.playerActions.map(a => a.type));
    
  //   // Execute the slam action
  //   const result = await executeActionFromUI(gameState, slamAction);
    
  //   console.log(`Slam action execution completed at: ${new Date().toISOString()}`);
    
  //   // Verify action execution was successful
  //   expect(result.success).toBe(true);
  //   expect(result.newState).toBeDefined();
    
  //   // Verify EXECUTION_COMPLETE event was emitted
  //   expect(executionCompleteSpy).toHaveBeenCalledTimes(1);
  //   expect(executionCompleteSpy.mock.calls[0][0].success).toBe(true);
    
  //   // Verify the combat state was updated
  //   const updatedCombatState = result.newState.activeCombat;
  //   expect(updatedCombatState.round).toBeGreaterThan(0);
  // });

  // it('should properly resolve promises during combat flow with LLM delay', async () => {
  //   // Create test combat scenario
  //   const { player, monster } = createDefaultTestCharacters();
  //   const gameState = await createTestCombatScenario(player, monster, 'test-room-id');
    
  //   // Set up event listener
  //   const executionCompleteSpy = vi.fn();
  //   uiEventBus.on('ui:EXECUTION_COMPLETE', executionCompleteSpy);
    
  //   // Log the start time
  //   console.log('Starting action execution with delay at:', new Date().toISOString());
    
  //   // Get the slam action from the available player actions
  //   const slamAction = gameState.activeCombat.playerActions.find(action => action.type === 'Slam');
  //   expect(slamAction).toBeDefined();
    
  //   // Execute the slam action
  //   const result = await executeActionFromUI(gameState, slamAction);
    
  //   // Log the end time
  //   console.log('Action execution with delay completed at:', new Date().toISOString());
    
  //   // Verify action execution was successful despite LLM delay
  //   expect(result.success).toBe(true);
  //   expect(executionCompleteSpy).toHaveBeenCalledTimes(1);
    
  //   // The time difference should be at least the mockLLMDelay
  //   // This verifies that the promise was properly awaited
  //   expect(result.newState.activeCombat.round).toBeGreaterThan(0);
  //   });
  });
