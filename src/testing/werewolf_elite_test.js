const fs = require('fs');
const path = require('path');

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

// Test loading the Werewolf Elite monster
function testWerewolfElite() {
    console.log('Testing Werewolf Elite monster loading...');
    
    // Load the monster JSON
    const werewolfElitePath = path.join(__dirname, '../assets/monsters/werewolf_elite.json');
    const werewolfElite = loadJsonFile(werewolfElitePath);
    
    if (!werewolfElite) {
        console.error('Failed to load Werewolf Elite monster');
        return;
    }
    
    console.log('Werewolf Elite loaded successfully:');
    console.log(`Name: ${werewolfElite.name}`);
    console.log(`Attributes: Might=${werewolfElite.attributes.Might}, Grace=${werewolfElite.attributes.Grace}, Wit=${werewolfElite.attributes.Wit}, Will=${werewolfElite.attributes.Will}`);
    console.log(`Vitality: ${werewolfElite.vitality.current}/${werewolfElite.vitality.max}`);
    console.log(`Armor: ${werewolfElite.armor.current}/${werewolfElite.armor.max}`);
    console.log('Traits:');
    werewolfElite.traits.forEach((trait) => {
        console.log(`  - ${trait}`);
    });
    
    // Test loading each trait to make sure they exist
    console.log('\nVerifying traits...');
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
        if (!traitFile) {
            console.error(`Failed to load trait file: ${filePath}`);
            continue;
        }
        
        const trait = traitFile.find((t) => t.id === traitId);
        if (trait) {
            console.log(`  ✓ ${traitId} found: ${trait.name} - ${trait.description.substring(0, 50)}...`);
        } else {
            console.error(`  ✗ ${traitId} not found in ${filePath}`);
        }
    }
    
    console.log('\nTest completed.');
}

// Run the test
testWerewolfElite();
