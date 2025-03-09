import { Trait, createTrait, copyTrait } from '../types/abilities';

// Define a type for the JSON ability data
type AbilityData = {
  id: string;
  name: string;
  [key: string]: any;
};

// Store all loaded abilities
const abilityRegistry: Record<string, AbilityData | Trait> = {};

// Initialize abilities by loading all JSON files
export async function initializeAbilities(): Promise<void> {
  // Use Vite's glob import to load all JSON files
  const coreModules = import.meta.glob('../assets/abilities/core/*.json', { eager: true });
  const bodypartModules = import.meta.glob('../assets/abilities/bodyparts/*.json', { eager: true });
  const heroModules = import.meta.glob('../assets/abilities/hero/*.json', { eager: true });
  const systemModules = import.meta.glob('../assets/abilities/system/*.json', { eager: true });
  
  // Process all ability modules
  const allModules = [
    ...Object.values(coreModules),
    ...Object.values(bodypartModules),
    ...Object.values(heroModules),
    ...Object.values(systemModules)
  ];
  
  // Register all abilities
  allModules.forEach((module: any) => {
    const abilities = module.default;
    abilities.forEach((abilityData: AbilityData) => {
      // Register the ability with its unique ID
      abilityRegistry[abilityData.id] = abilityData;
    });
  });
  
  console.log(`Loaded ${Object.keys(abilityRegistry).length} abilities`);
}

// Get an ability by its ID
export function getAbility(id: string): Trait | undefined {
  const abilityData = abilityRegistry[id];
  if (!abilityData) return undefined;
  
  // If it's already a Trait instance, return it
  if ('effects' in abilityData && Array.isArray(abilityData.effects)) {
    return abilityData as Trait;
  }
  
  // Otherwise, create a Trait from the JSON data
  return createTrait(abilityData.name, abilityData);
}

// Get all abilities for a specific body part
export function getAbilitiesForBodyPart(bodyPart: string): Trait[] {
  return Object.entries(abilityRegistry)
    .filter(([id]) => id.startsWith(`${bodyPart}.`))
    .map(([_, abilityData]) => {
      // If it's already a Trait instance, return it
      if ('effects' in abilityData && Array.isArray(abilityData.effects)) {
        return abilityData as Trait;
      }
      
      // Otherwise, create a Trait from the JSON data
      return createTrait(abilityData.name, abilityData);
    });
}

// Get all core abilities
export function getCoreAbilities(): Trait[] {
  return Object.entries(abilityRegistry)
    .filter(([id]) => id.startsWith('core.'))
    .map(([_, abilityData]) => {
      // If it's already a Trait instance, return it
      if ('effects' in abilityData && Array.isArray(abilityData.effects)) {
        return abilityData as Trait;
      }
      
      // Otherwise, create a Trait from the JSON data
      return createTrait(abilityData.name, abilityData);
    });
}

// Get all abilities
export function getAllAbilities(): Record<string, Trait> {
  const result: Record<string, Trait> = {};
  
  Object.entries(abilityRegistry).forEach(([id, abilityData]) => {
    // If it's already a Trait instance, use it
    if ('effects' in abilityData && Array.isArray(abilityData.effects)) {
      result[id] = abilityData as Trait;
    } else {
      // Otherwise, create a Trait from the JSON data
      result[id] = createTrait(abilityData.name, abilityData);
    }
  });
  
  return result;
}

// Load an ability by ID from the registry
export function loadAbility(id: string): Trait | undefined {
  // Check the registry for the ability
  return getAbility(id);
}

// Export the registry for direct access if needed
export { abilityRegistry };
