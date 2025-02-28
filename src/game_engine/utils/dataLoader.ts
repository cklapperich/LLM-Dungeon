import { Attribute, SkillName, getSkillAttribute, Skills, SkillNames } from '../../types/skilltypes.ts';
import { Character, loadCharacter } from '../../types/actor.ts';

/**
 * Load a monster from JSON data
 */
export function loadMonster(monsterData: any): Character {
    return loadCharacter(JSON.stringify(monsterData));
}
