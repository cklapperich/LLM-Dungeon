## Attributes and Skills

# **Todo: add a run away action for heroes and monsters**

Heroes and monsters should be able to run away/slip past
For heroes its a way to advance further into the dungeon. 
For critters its a way to avoid finishing blows from a hero and preserve the monster
It needs a chance of failure either way. 
Could be stealth-based for heroes. 
could be grace-based for both.
for heroes isnt this just an auto-win button though? they should maybe only be able to use it after X rounds, have taken X damage in total
or taken X damage this round or below X% of heatlh.
maybe only rogues and mages can use it - for mages it could be a 2-turn chargegup, rogues could have to be in battle for X turns to use it or deal x damage to use it?

# **ORTHOGONAL DESIGN GOOD. LINEAR DESIGN BAD** 

## Synergy Systems - how to make monster abilities FUN and UNIQUE

- Room-based synergies (monsters perform differently based on room type)
- Adjacent room synergies (monsters interact with nearby monsters)
- Status effect synergies (monsters that capitalize on specific status effects)
- attribute-based synergies (wit/will/grace/might)
- goal based synergies (kill/corrupt/breed)
- bodypart-based synergies? (all my monsters have tails?)

# Initiative
Just a skillcheck. Initiative is 2d10-grace, lowest wins, rerolled each round.

## Kill, Breed, Corrupt
Killing or releasing are easiest options, reduce Vitality to 3 to do either.
Impregnate is more difficult, takes time, heroine has chance to escape, you're doing non-combat things. Must increase Grapple state to 3.
Corruption is most difficult, reduce Conviction to 3. Not all monsters can corrupt, not all can breed (most can).

## default abilities:

things like slam/bite, grapple, remove clothing (only grappled target). These are all +0 and available for free in infinite copies to assign to monsters

## PREPARATION: 
UPGRADE MONSTERS, PLACE TRAPS, PLACE MONSTERS, Slot Traits into Monsters

## BETWEEN COMBAT - adventurers move between rooms

### COMBAT

Combat is always 1v1

Monsters and heroes can only use activity abilities (traits) in combat. Some traits are active some are passive.

### Traits

Pulled from card packs. 
Common/rare/legendary
Cooldowns: abilities have cooldowns by default its 0.
give passives or new attacks.
Can be upgraded over time.

### Breeding

See grappling.md

## Arousal System

heat/arousal levels:
0 1 2 3
dry - slick - sopping - in heat
-0/-1/-2/-3 to grapple/breed checks.


## Status
Prone lasts 1 turn, is -2 might vs Grapple and -2 Grace, cant stack.

## DESIGN PHILOSOPHY:

Healing is always limited use and typically adventurers lack this

Many/most grapple skills give a permanent ability debuff till end of battle - to help progress things.
Need to be careful to avoid 'loop' of gameplay where you just keep going up/down by 1 grapple point. 
Some monsters are pure combat, some are pure breeding.
An ability with a high hit modifier that only deals a wound might be balanced - most players want to breed their monsters. Not kill.
An ability with a wound an an extra effect could be balanced - the wound is often seen as a downside.
An ability with a strong debuff and a high modifier ("powerful web spit attack") would probably be very strong, maybe too strong unless as a legendary rarity ability.
abilities that just wound or just deal a permanent -1 or -2 to a certain stat are common.
abilities that just knock prone are common.

SAMPLE TRAITS
Strong - +2 might. Common.
Quick - +2 might. Common.
Tenacious - 1 extra turn after reaching 0 vit. Legendary.

Brutal strike - wound, +2 modifier, common
Charge - knock prone, +0 modifier, common, cooldown 1
Strong charge - knock prone, wound, +4 modifier, rare
Spit goo: permanent -2 to grace, 0 modifier. common.
Web spit (spider) - adds a leg or arm restraint. +0 modifier. Common. 
Battle cry - +1 to self might, -1 to enemy will and grace. Common.
Eldritch Whispers - -2 modifier. Deal 1 corruption. Common.
Venom Bite - wound, -2 to might, 1 to arousal. +2 modifier. rare.
Spit Poison - 1 to arousal, -1 to might, +0, common
Snake Eyes - Corruption 1, +0, 1 arousal. Rare.
Rapid bite - wound, priority, +0
Mind Break - -2 modifier. Convert all vitality to corruption damage. Legendary. 3 turn cooldown.
Horn Lock [Rare] - Might vs Dex Grapple. Sets grapple stage to 1. 

Breeding Abilities:
Slime Mitosis - 2 stages. Stage 1 adds leg restraint, stage 2 breeds. Clothing level 1 or lower. Simple but effective due to low requirements.
Cocoon (spider) - 4 stages. Stage 1, stage 2 (both arms), stage 3 (both legs), stage 4 (mouth). Each stage gives -1 might. Clothing 1 required. Rare ability. 
Mount (wolf/minotaur) - 3 stages. requires prone, clothing 0. 3 stages: Stage 1 restrains both legs, stage 2 penetrates and thrusts, Stage 3 knots and impregnates. Common ability. +2 modifier.
Facefuck (minotaur) - 4 stages. Stage 1 restrains both arms, Stage 2 restrains mouth and both arms with one hand and forces mouth open, stage 3 penetrate + thrusting, stage 4 finishes. Rare. Works with clothing 4 or lower.
Grapple[Might] vs Might. Clothing 1 required. Legendary. Stage 1 restrains both legs, stage 2 restraints both arms. Stage 3 penetrates and thrusts. Stage 4 finishes. Common.

Command - Strip: Will vs Will check, +0, heroine removes a piece of armor or clothing. Common.
Command - Present: Will vs Will check, +0, heroine is prone. Common.
Mindshock - -2 will until end of next turn. cant take an action this turn (if she hasn't acted yet) or next. +0. Rare.
Command - Breed: A Grapple[wit] vs wit check that increases breeding progression by 1. rare b/c uniqueness. +0.

Killing an adventurer is SUPPOSED to be easier, breed/corrupt meant to be hard
Grappling should be hard but have tools to ensure progress
Avoid loops through permanent debuffs
Combat should always move toward a conclusion
Create meaningful choices ALWAYS

Rare abilities are not just stronger but also more unique mechanically.

Restraints need to give a penalty to grapple checks. 

Each grapple level should give an additional -1 to checks? maybe?

Each restrained limb gives -1 to Grapple[Might] and Grapple[Dex] checks.
Resistance is 1 less effective each use, resets after the combat encounter.

## wounds

Wounds give -1 might each. Gives some incentive to deal them.


## conviction

Like Vitality but different. 
Every lost point of conviction from max is -1 to Will and -1 to grapple. Low reward for doing it once. Big reward for getting it down to 0. 

At Conviction 0:

All Will-based Commands auto-succeed
All grapple attempts auto-succeed
Might Grace and Wit all get halved (rounded down!), minimum 4. 

## Dungeons

Dungeon layout is fixed for now - limited control over it.

## Clothing/armor removal

Simply an integer representing the hero's armor level.
breed abilities have max clothing level that will work.
mind control to command an adventurer to strip, acid or rending attacks, 
adventurers can strip an article of clothing to remove a level of grapple with no check. They lose the item from inventory AND 1 clothing level,
and lose the benefits of the armor too.

Typical is: chestplate, leggings, clothing. Each gives +1. Clothing gives no combat benefits but is a layer of protection from breeding.
Mages can get 2 clothing levels from robes.
Rogues probably have 3 from light armor.
Fighters maybe have 4 typically to start with.
