import { createCharacter, calculateMaxVitality, calculateMaxConviction, saveCharacter, loadCharacter, getSkillBonus } from '../src/types/actor.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import assert from 'assert';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('Running Actor Tests...');

// Test default character creation
const defaultChar = createCharacter();
assert(defaultChar.might === 10, 'Default might should be 10');
assert(defaultChar.grace === 10, 'Default grace should be 10');
assert(defaultChar.mind === 10, 'Default mind should be 10');
assert(defaultChar.will === 10, 'Default will should be 10');
assert(defaultChar.maxVitality === 3, 'Default max vitality should be 3 (might 10-13)');
assert(defaultChar.vitality === 3, 'Default vitality should equal max vitality');
assert(defaultChar.maxConviction === 3, 'Default max conviction should be 3 (will 10-13)');
assert(defaultChar.conviction === 3, 'Default conviction should equal max conviction');
assert(defaultChar.grappleState === 0, 'Default grapple state should be 0');
console.log('✓ Default character creation tests passed');

// Test custom character creation
const customChar = createCharacter({
    might: 15,
    will: 6,
    grace: 12,
    mind: 14
});
assert(customChar.might === 15, 'Custom might should be 15');
assert(customChar.grace === 12, 'Custom grace should be 12');
assert(customChar.mind === 14, 'Custom mind should be 14');
assert(customChar.will === 6, 'Custom will should be 6');
assert(customChar.maxVitality === 4, 'Custom max vitality should be 4 (might 14-17)');
assert(customChar.vitality === 4, 'Custom vitality should equal max vitality');
assert(customChar.maxConviction === 1, 'Custom max conviction should be 1 (will ≤6)');
assert(customChar.conviction === 1, 'Custom conviction should equal max conviction');
console.log('✓ Custom character creation tests passed');

// Test vitality calculation across all ranges
assert(calculateMaxVitality(5) === 1, 'Might ≤6 should give 1 vitality');
assert(calculateMaxVitality(8) === 2, 'Might 7-9 should give 2 vitality');
assert(calculateMaxVitality(12) === 3, 'Might 10-13 should give 3 vitality');
assert(calculateMaxVitality(15) === 4, 'Might 14-17 should give 4 vitality');
assert(calculateMaxVitality(18) === 5, 'Might ≥18 should give 5 vitality');
console.log('✓ Vitality calculation tests passed');

// Test conviction calculation across all ranges
assert(calculateMaxConviction(6) === 1, 'Will ≤6 should give 1 conviction');
assert(calculateMaxConviction(9) === 2, 'Will 7-9 should give 2 conviction');
assert(calculateMaxConviction(13) === 3, 'Will 10-13 should give 3 conviction');
assert(calculateMaxConviction(16) === 4, 'Will 14-17 should give 4 conviction');
assert(calculateMaxConviction(20) === 5, 'Will ≥18 should give 5 conviction');
console.log('✓ Conviction calculation tests passed');

// Test character loading from file
const slimeJson = readFileSync(join(__dirname, '..', 'data', 'monsters', 'slime.json'), 'utf-8');
const slime = loadCharacter(slimeJson);

assert(slime.might === 8, 'Slime might should be 8');
assert(slime.grace === 6, 'Slime grace should be 6');
assert(slime.mind === 4, 'Slime mind should be 4');
assert(slime.will === 4, 'Slime will should be 4');
assert(getSkillBonus(slime, 'Might') === 0, 'Slime should have Might 0 (not proficient)');
assert(getSkillBonus(slime, 'Intimidation') === 1, 'Slime should have Intimidation 1');
assert(slime.maxVitality === 2, 'Slime max vitality should be 2 (might 7-9)');
assert(slime.maxConviction === 1, 'Slime max conviction should be 1 (will ≤6)');
assert(slime.vitality === 2, 'Slime vitality should be calculated from might');
assert(slime.conviction === 1, 'Slime conviction should be calculated from will');
console.log('✓ Character loading tests passed');

// Test round-trip serialization
const savedJson = saveCharacter(slime);
const reloadedSlime = loadCharacter(savedJson);
assert(JSON.stringify(slime) === JSON.stringify(reloadedSlime), 'Round-trip serialization should match');
console.log('✓ Character serialization tests passed');

console.log('All actor tests passed! ✨');
