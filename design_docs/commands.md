# Commands System

## Core Mechanics

Commands are player abilities that follow the same mechanical structure as monster abilities but are equipped to the player character rather than monsters.

### Slot System
- Players have their own slots separate from monster slots
- Start with limited slots (2-3)
- Gain additional slots through progression
- Can swap Commands at the start of each day/mission

### Cooldown System
- Each Command has a cooldown period after use
- Cooldowns range from short (1 turn) to long (full mission)
- Strategic timing of Command usage is critical
- Cooldowns prevent spamming powerful abilities

### Targeting Options
- Self: Affects player resources/stats
- Monster: Targets a specific monster
- Room: Affects a specific room
- Global: Affects entire dungeon
- Heroine: Directly impacts a heroine

## Command Categories

### Support Commands
- **Mend**: Heal a monster for 30% of max health (Medium cooldown)
- **Energize**: Reset cooldown on one monster ability (Long cooldown)
- **Reinforce**: +50% defense for 2 turns (Medium cooldown)
- **Inspire**: +30% attack for 2 turns (Medium cooldown)

### Tactical Commands
- **Swap**: Exchange monsters between rooms ignoring size restrictions (Long cooldown)
- **Recover**: Revive a defeated monster at 40% health (Very long cooldown)
- **Trap**: Place trap in room that activates on heroine entry (Long cooldown)
- **Retreat**: Force a monster to escape combat (preventing death but losing the room) (Medium cooldown)

### Intelligence Commands
- **Analyze**: Reveal heroine's strengths/weaknesses (Short cooldown)
- **Scout**: Reveal heroine's planned path through dungeon (Medium cooldown)
- **Study**: Increase success chance of next capture attempt (Long cooldown)
- **Research**: Gain one additional card choice after next monster victory (Very long cooldown)

### Offensive Commands
- **Hinder**: Slow heroine movement by 1 room (Medium cooldown)
- **Weaken**: -25% to heroine's primary stat for 2 turns (Medium cooldown) 
- **Sabotage**: Disable one heroine ability for 3 turns (Long cooldown)
- **Enrage**: Monster deals +50% damage but takes +25% damage (Medium cooldown)

## Progression System

### Acquisition
- Basic Commands available from start
- Advanced Commands obtained through:
  - Completing missions
  - Special captures
  - Milestone achievements
  - Card packs (same as monster abilities)

### Upgrades
- Commands can be upgraded similar to monster abilities
- Upgrade options include:
  - Reduced cooldown
  - Increased effect potency
  - Added secondary effects
  - Extended duration

### Customization
- Players can rename any Command
- Players can write custom descriptions
- LLM uses these descriptions in battle narration
- Visual appearance can be customized (for image generation)

## Strategic Elements

### Resource Management
- Limited slots force difficult choices about which Commands to equip
- Cooldowns prevent overreliance on powerful abilities
- Creates meaningful decisions about when to use Commands

### Synergies
- Commands can be designed to complement specific monster types
- Potential for powerful combinations with monster abilities
- Encourages thoughtful team building

### Risk/Reward
- Most powerful Commands have longest cooldowns
- Some Commands might have drawbacks
- Critical timing can dramatically change battle outcomes

## Implementation Notes

- Same data structure as monster abilities for code efficiency
- UI should clearly distinguish between monster abilities and Commands
- Cooldown timers should be prominently displayed
- Custom descriptions feed directly into LLM prompt templates