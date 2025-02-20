import { RollResult, OpposedCheckResult } from '../types/skilltypes.js';

/**
 * Format a skill check result for display
 */
export function formatRollResult(result: RollResult): string {
    const successText = result.success ? "SUCCESS" : "FAILURE";
    const criticalText = result.isCriticalSuccess ? " (CRITICAL SUCCESS!)" :
                        result.isCriticalFailure ? " (CRITICAL FAILURE!)" : "";
    
    return `Roll: ${result.roll} vs ${result.attribute} = ${successText}${criticalText}\n` +
           `Margin: ${result.margin} (${result.intensity})` +
           (result.description ? `\n${result.description}` : '');
}

/**
 * Format an opposed check result for display
 */
export function formatOpposedResult(result: OpposedCheckResult): string {
    return "Attacker:\n" +
           formatRollResult(result.attacker) + "\n\n" +
           "Defender:\n" +
           formatRollResult(result.defender) + "\n\n" +
           `Winner: ${result.attackerWins ? "Attacker" : "Defender"}`;
}
