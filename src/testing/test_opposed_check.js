// Simple test script to verify that opposed checks work correctly
import { makeOpposedCheck } from '../game_engine/utils/skillCheck';
import { SkillNames } from '../types/skilltypes';

// Create simple character objects for testing
const attacker = {
  name: 'Attacker',
  attributes: {
    Might: 10,
    Grace: 12,
    Wit: 8,
    Will: 6
  },
  statuses: []
};

const defender = {
  name: 'Defender',
  attributes: {
    Might: 8,
    Grace: 14,
    Wit: 10,
    Will: 8
  },
  statuses: []
};

// Test an opposed check with defense options
console.log('Testing opposed check with defense options:');
const result = makeOpposedCheck(
  attacker,
  SkillNames.LIGHT_WEAPONS,
  defender,
  [SkillNames.DODGE, SkillNames.BLOCK]
);

console.log('Attacker skill:', SkillNames.LIGHT_WEAPONS);
console.log('Attacker roll:', result.attacker.roll);
console.log('Attacker attribute:', result.attacker.attribute);
console.log('Attacker success:', result.attacker.success);

console.log('\nDefender skill:', result.defenderSkill);
console.log('Defender roll:', result.defender.roll);
console.log('Defender attribute:', result.defender.attribute);
console.log('Defender success:', result.defender.success);

console.log('\nOpposed check margin:', result.margin);
console.log('Attacker wins:', result.attackerWins);
