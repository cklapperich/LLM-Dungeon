// jsonScriptManager.ts

// Define safe context for script execution
interface ScriptContext {
    source: any;
    target: any;
    state: any;
    getStatus: (character: any, statusName: string) => number;
    hasFlag: (character: any, flagName: string) => boolean;
    random: (min: number, max: number) => number;
    randomChoice: <T>(array: T[]) => T;
    // Add any other safe functions you want to expose
  }
  
  /**
   * Safely executes script from JSON without direct eval()
   * This preserves the namespace and prevents minification issues
   */
  export function executeJsonScript(
    scriptText: string, 
    context: ScriptContext
  ): any {
    // Create a function with explicit parameters for all context values
    // This approach is safer than eval and works better with minification
    const scriptFunction = new Function(
      'source', 
      'target', 
      'state', 
      'getStatus', 
      'hasFlag',
      'random',
      'randomChoice',
      scriptText
    );
    
    // Execute with explicit context
    return scriptFunction(
      context.source,
      context.target,
      context.state,
      context.getStatus,
      context.hasFlag,
      context.random,
      context.randomChoice
    );
  }
  
  // Example usage in your effect handler:
  export const safeScriptHandler = async (effect, source, target, state) => {
    try {
      // Create the safe context with all allowed functions
      const context: ScriptContext = {
        source,
        target,
        state,
        getStatus: (character, statusName) => {
          const status = character.statuses.find(s => s.name === statusName);
          return status ? status.stacks : 0;
        },
        hasFlag: (character, flagName) => !!character.flags[flagName],
        random: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
        randomChoice: (array) => array[Math.floor(Math.random() * array.length)],
      };
      
      // Execute the script with the safe context
      executeJsonScript(effect.params.script, context);
      
      return {
        success: true,
        message: 'Script executed successfully'
      };
    } catch (error) {
      console.error('Script error:', error);
      return {
        success: false,
        message: `Script error: ${error.message}`
      };
    }
  };