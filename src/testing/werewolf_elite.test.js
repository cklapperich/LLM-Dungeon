import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to load a JSON file
function loadJsonFile(filePath) {
    try {
        const fullPath = path.resolve(filePath);
        const fileContent = fs.readFileSync(fullPath, 'utf8');
        return JSON.parse(fileContent);
    } catch (error) {
        console.error(`Error loading file ${filePath}:`, error);
        return null;
    }
}

describe('Werewolf Elite Monster', () => {
    it('should load the monster JSON file correctly', () => {
        const werewolfElitePath = path.join(__dirname, '../assets/monsters/werewolf_elite.json');
        const werewolfElite = loadJsonFile(werewolfElitePath);
        
        expect(werewolfElite).not.toBeNull();
        expect(werewolfElite.name).toBe('Werewolf Elite');
        expect(werewolfElite.type).toBe('monster');
        
        // Check attributes
        expect(werewolfElite.attributes.Might).toBe(16);
        expect(werewolfElite.attributes.Grace).toBe(16);
        expect(werewolfElite.attributes.Wit).toBe(8);
        expect(werewolfElite.attributes.Will).toBe(6);
        
        // Check vitality and armor
        expect(werewolfElite.vitality.max).toBe(2);
        expect(werewolfElite.vitality.current).toBe(2);
        expect(werewolfElite.armor.max).toBe(0);
        expect(werewolfElite.armor.current).toBe(0);
        
        // Check traits
        expect(werewolfElite.traits).toContain('core.grab');
        expect(werewolfElite.traits).toContain('core.penetrate');
        expect(werewolfElite.traits).toContain('core.shred');
        expect(werewolfElite.traits).toContain('core.clamp');
        expect(werewolfElite.traits).toContain('claws.rend');
        expect(werewolfElite.traits).toContain('core.dodge_stance');
        expect(werewolfElite.traits).toContain('core.howl');
    });
    
    it('should verify all traits exist in their respective files', () => {
        const traitFiles = {
            'core.grab': '../assets/abilities/core/default.json',
            'core.penetrate': '../assets/abilities/core/default.json',
            'core.shred': '../assets/abilities/core/default.json',
            'core.clamp': '../assets/abilities/core/default.json',
            'claws.rend': '../assets/abilities/bodyparts/claws.json',
            'core.dodge_stance': '../assets/abilities/core/default.json',
            'core.howl': '../assets/abilities/core/default.json'
        };
        
        for (const [traitId, filePath] of Object.entries(traitFiles)) {
            const traitFile = loadJsonFile(path.join(__dirname, filePath));
            expect(traitFile).not.toBeNull();
            
            const trait = traitFile.find(t => t.id === traitId);
            expect(trait).toBeDefined();
            expect(trait.id).toBe(traitId);
        }
    });
});
