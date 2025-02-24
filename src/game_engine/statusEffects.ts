import { Status, StatusSource, BuiltInStatus, StatusCreationJson, ModifierResult, StatusName } from '../types/status';
import { Skills } from '../types/skilltypes';
import { BodyPartType } from '../types/constants';

const BINDABLE_PARTS = [
    BodyPartType.ARM,
    BodyPartType.LEG, 
    BodyPartType.MOUTH,
    BodyPartType.TAIL
] as const;

// Collection of all built-in status effects
export const StatusEffects: Record<string, BuiltInStatus> = {
    [StatusName.GRAPPLED]: {
        name: StatusName.GRAPPLED,
        defaultParams: {
            boundDuringGrapple: Object.fromEntries(
                BINDABLE_PARTS.map(part => [part, [] as string[]])
            )
        },
        getModifiers: (status: Status): ModifierResult => {
            const modifiers: Record<string, number> = {};
            
            // Apply -2 penalty to all skills except break free/slip free
            Object.values(Skills).forEach(skill => {
                if (skill !== Skills.BREAK_FREE_MIGHT && 
                    skill !== Skills.SLIP_FREE_GRACE && 
                    skill !== Skills.NONE) {
                    modifiers[skill] = -2;
                }
            });

            return {
                skill_modifiers: modifiers,
                attribute_modifiers: {}
            };
        },
        createInstance: (params?: Record<string, any>): Status => {
            return {
                id: crypto.randomUUID(),
                name: StatusName.GRAPPLED,
                source: StatusSource.SYSTEM,
                stacks: 1,
                max_stacks: 1,
                is_negative: true,
                params: {
                    boundDuringGrapple: Object.fromEntries(
                        BINDABLE_PARTS.map(part => [part, [] as string[]])
                    ),
                    ...params
                }
            };
        }
    },
    [StatusName.BOUND_ARMS]: {
        name: StatusName.BOUND_ARMS,
        defaultParams: {},
        getModifiers: (status: Status): ModifierResult => ({
            skill_modifiers: {},
            attribute_modifiers: {}
        }),
        createInstance: (params?: Record<string, any>): Status => ({
            id: crypto.randomUUID(),
            name: StatusName.BOUND_ARMS,
            source: StatusSource.SYSTEM,
            stacks: params?.stacks ?? 1,
            max_stacks: 2,
            is_negative: true,
            params: { ...params }
        })
    },
    [StatusName.BOUND_LEGS]: {
        name: StatusName.BOUND_LEGS,
        defaultParams: {},
        getModifiers: (status: Status): ModifierResult => ({
            skill_modifiers: {},
            attribute_modifiers: {}
        }),
        createInstance: (params?: Record<string, any>): Status => ({
            id: crypto.randomUUID(),
            name: StatusName.BOUND_LEGS,
            source: StatusSource.SYSTEM,
            stacks: params?.stacks ?? 1,
            max_stacks: 2,
            is_negative: true,
            params: { ...params }
        })
    },
    [StatusName.BOUND_MOUTH]: {
        name: StatusName.BOUND_MOUTH,
        defaultParams: {},
        getModifiers: (status: Status): ModifierResult => ({
            skill_modifiers: {},
            attribute_modifiers: {}
        }),
        createInstance: (params?: Record<string, any>): Status => ({
            id: crypto.randomUUID(),
            name: StatusName.BOUND_MOUTH,
            source: StatusSource.SYSTEM,
            stacks: params?.stacks ?? 1,
            max_stacks: 1,
            is_negative: true,
            params: { ...params }
        })
    },
    [StatusName.BOUND_TAIL]: {
        name: StatusName.BOUND_TAIL,
        defaultParams: {},
        getModifiers: (status: Status): ModifierResult => ({
            skill_modifiers: {},
            attribute_modifiers: {}
        }),
        createInstance: (params?: Record<string, any>): Status => ({
            id: crypto.randomUUID(),
            name: StatusName.BOUND_TAIL,
            source: StatusSource.SYSTEM,
            stacks: params?.stacks ?? 1,
            max_stacks: 1,
            is_negative: true,
            params: { ...params }
        })
    },
    [StatusName.EXHAUSTION]: {
        name: StatusName.EXHAUSTION,
        defaultParams: {},
        getModifiers: (status: Status): ModifierResult => ({
            skill_modifiers: {
                [Skills.BREAK_FREE_MIGHT]: -1 * status.stacks,
                [Skills.SLIP_FREE_GRACE]: -1 * status.stacks
            },
            attribute_modifiers: {}
        }),
        createInstance: (params?: Record<string, any>): Status => ({
            id: crypto.randomUUID(),
            name: StatusName.EXHAUSTION,
            source: StatusSource.SYSTEM,
            stacks: params?.stacks ?? 1,
            max_stacks: 4,
            is_negative: true,
            params: { ...params }
        })
    },
    [StatusName.PENETRATED]: {
        name: StatusName.PENETRATED,
        defaultParams: {},
        getModifiers: (status: Status): ModifierResult => ({
            skill_modifiers: {
                [Skills.BREAK_FREE_MIGHT]: -2,
                [Skills.SLIP_FREE_GRACE]: -2
            },
            attribute_modifiers: {}
        }),
        createInstance: (params?: Record<string, any>): Status => {
            return {
                id: crypto.randomUUID(),
                name: StatusName.PENETRATED,
                source: StatusSource.SYSTEM,
                stacks: params?.stacks ?? 1,
                max_stacks: 2,
                is_negative: true,
                params: { ...params }
            };
        }
    },
    [StatusName.INSEMINATED]: {
        name: StatusName.INSEMINATED,
        defaultParams: {},
        getModifiers: (status: Status): ModifierResult => ({
            skill_modifiers: {},
            attribute_modifiers: {}
        }),
        createInstance: (params?: Record<string, any>): Status => {
            return {
                id: crypto.randomUUID(),
                name: StatusName.INSEMINATED,
                source: StatusSource.SYSTEM,
                stacks: 1,
                max_stacks: 1,
                is_negative: true,
                params: { ...params }
            };
        }
    },
    [StatusName.ABILITY_COOLDOWN]: {
        name: StatusName.ABILITY_COOLDOWN,
        defaultParams: {
            abilityName: undefined,  // Must be provided
            duration: 1
        },
        getModifiers: (status: Status, gameState: any): ModifierResult => {
            return {
                skill_modifiers: {},
                attribute_modifiers: {}
            };
        },
        createInstance: (params?: Record<string, any>): Status => {
            if (!params?.abilityName) {
                throw new Error('abilityName is required for ABILITY_COOLDOWN status');
            }
            return {
                id: crypto.randomUUID(),
                name: StatusName.ABILITY_COOLDOWN,
                source: StatusSource.SELF,
                sourceAbility: params.abilityName,
                duration: params.duration ?? 1,
                stacks: 1,
                max_stacks: 1,
                is_negative: true,
                params: { ...params }
            };
        }
    },
    [StatusName.HEAT]: {
        name: StatusName.HEAT,
        defaultParams: {
            max_stacks: 3
        },
        getModifiers: (status: Status, gameState: any): ModifierResult => {
            return {
                skill_modifiers: {
                    [Skills.BREAK_FREE_MIGHT]: -1 * status.stacks,
                    [Skills.SLIP_FREE_GRACE]: -1 * status.stacks
                },
                attribute_modifiers: {
                    [Skills.WILL]: -1 * status.stacks
                }
            };
        },
        createInstance: (params?: Record<string, any>): Status => {
            return {
                id: crypto.randomUUID(),
                name: StatusName.HEAT,
                source: StatusSource.SYSTEM,
                stacks: 1,
                max_stacks: params?.max_stacks ?? 3,
                is_negative: true,
                params: { ...params }
            };
        }
    }
};

export function createStatus(type: string, params?: Record<string, any>): Status {
    const builtIn = StatusEffects[type];
    if (!builtIn) {
        throw new Error(`Unknown status type: ${type}`);
    }
    return builtIn.createInstance(params);
}

export function createStatusFromJson(json: StatusCreationJson): Status {
    const builtIn = StatusEffects[json.type];
    if (!builtIn) {
        throw new Error(`Unknown status type: ${json.type}`);
    }

    const params = {
        ...builtIn.defaultParams,
        ...json.params
    };

    const status = builtIn.createInstance(params);
    
    // Apply optional fields from JSON
    if (json.source) status.source = json.source;
    if (json.sourceAbility) status.sourceAbility = json.sourceAbility;
    if (json.sourceEffect) status.sourceEffect = json.sourceEffect;
    if (json.duration) status.duration = json.duration;
    if (json.stacks) status.stacks = json.stacks;

    return status;
}

// Helper to check if a character has a status
export function hasStatus(statuses: Status[], name: string): boolean {
    return statuses.some(s => s.name === name);
}

// Helper to get a status by name
export function getStatus(statuses: Status[], name: string): Status | undefined {
    return statuses.find(s => s.name === name);
}

// Helper to get modifiers for a status
export function getStatusModifiers(status: Status, gameState: any): ModifierResult {
    const builtIn = StatusEffects[status.name];
    if (!builtIn) {
        throw new Error(`No modifier implementation for status: ${status.name}`);
    }
    return builtIn.getModifiers(status, gameState);
}
