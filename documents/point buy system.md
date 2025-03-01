# Ability Creation Guide
This is a general guideline for balancing abilities **as a developer**. Actually doing a point buy is likely too rigid boring and minmaxable.

Core Concepts

- Abilities can be used by both monsters and heroes to attack  
- Monsters often aim to finish grapples rather than kill  
- Abilities are classified as Common, Rare, or Legendary  
- Ability point budgets: Common (2 points), Rare (4 points), Legendary (6 points)  
- Abilities have maximum effects/drawbacks: Default(1), Common (2), Rare (3), Legendary (4)  
- Hit Modifiers don't count as effects

## \# Number of Ability Slots.

Small monsters start at 2c \-\> 1r-\>1r  
Medium Monsters: 2c/1r \-\> 1r \-\> 1L  
Large monsters: 3c/1r/1l \-\> 1r \-\> 1L  
Default abilities take no slots.   
TBD; subject to balancing changes.

## Monster/Hero stats

Small monster point buy: 12/10/8/6. 2 vitality.  
Medium Monster: 14/10/8/6 3 vitality  
Big Monster: 16/12/10/8 \- 4 vitality  
Small hero attributes: 14/10/8/6 \- 3 vitality.  
Big hero attributes: 16/12/10/8 3 vitality  
Epic Hero attributes: 17/13/12/10 4 vitality

## Building Abilities

1. Choose your ability's rarity (Common/Rare/Legendary or C/R/L)  
2. Rarity determines your point budget (2/4/6)  
3. Select effects within your effect limit (max 2/3/4 effects)  
4. Add drawback effects to reduce cost if needed  
5. Ensure total cost matches your budget

## Effect Costs

- Hit Modifier:1 point per \+1, \-1 point per \-1  
  - Max of 2/3/4 or \-2/-3/-4  
  - Doesn’t count as an effect  
- Priority: 2 points, always move first  
- Wound: 2 points (can inflict 1/1/2 wounds for Common/Rare/Legendary)  
  - Each wound gives \-1 Might  
- Corruption: 3 points (can inflict 1/1/2 corruption for Common/Rare/Legendary)  
  - Each corruption gives \-1 Will  
  - At 0 Will, saves auto-fail and Might/Grace are halved  
- Restrict a limb: TBD; pretty powerful. 3-4 points?  2 if grapple ability  
- Custom Unique Effects: point cost listed

### Buff Effects

Lasts till end of battle

#### Attribute buffs

\+1 might/grace/wit/will till end of combat: 2 points \+1 might/grace or wit/will: 3 points Max 1/2/2 per ability, max 3 stacks

#### Skill buffs

- Buff skill by 1 point: 1 point, max 1/2/3

### Debuff Effects

- Limit 1/1/2 stacks per ability use

2 points:

- Sticky: \-1 Grace  
- Weaken: \-1 Might  
- Daze: \-1 Wit  
- Charm: \-1 Will  
- Heat: \-1 will, \-1 grapple
- Prone: \-1 Grace, \-1 Might, \-1 grapple, max 1 stack, lasts 1 turn

3 points:

- Bind: \-1 might/-1 grace per stack, 3 points, 2 as part of grapple  
- Fog: \-1 wit / \-1 will per stack

1 point:

- Debuff non-grapple skill by 1 point: 1 point each max 1/2/3

### Special Actions

- Disarm \- 2pts  
- Disrobe \- 2pts (1/1/2 limit by rarity)  
- Hide (0 base points, only self target effects allowed)  
- Grapple (0 base points)

## Drawback Effects (Cost Reduction)

- Cooldown: \-1 point per turn (1/2/3 turns max)  
- Self-wound: \-2 points per wound (0/1/2 self-wounds max)  
- Permanent attribute penalty: \-1 point per \-1 (max 1/2/3 by rarity)  
  - Good for expendable monsters, bad for heroes/bosses  
- Negative hit modifier: Set to \-2/-3/-4 hit (reduces cost by corresponding amount)

## Attribute Contest Guidelines

- Each ability lists what skills are allowed to defend. Default is to always defend with same attribute, and allow dodge/block/parry for physical attacks  
- Common: Allowed to defend w/ dodge block parry or a matching attr (Might vs Might)  
- Rare: Only Allowed to use Might vs Grace or Wit vs Will: Rare  
- Legendary: Only allowed to use a phys-mental or ment-phys contest to defend  
  - Wit vs might, Wit vs Gracel, might vs will, might vs wit, etc

## Monster-Specific Rules

- ##### **Monster Wound1 \+ heat/prone/grapple Discount: \-2 points**

  When combining wound 1 with Prone, Heat OR grapple, \-2 points instead of \+2	\!  
- Does not apply to 2-wound abilities (always cost 4 points)  
- Justified because players want to grapple and capture\! Killing prevents that

## Passive Traits

- Stat boosting traits:  
  - Cannot stack trait bonuses to the same attribute: if you do highest applies  
  - Common: \+1 to an attribute (strong/quick//clever/confident)  
  - Rare: \+2 to an attribute (mighty/nimble/certain/genius)  
  - Legendary: \+3 to an attribute (requires \-1 to the other phys/mental trait)  
    - Reckless: \+3 might/-1 grace  
    - Lithe: \+3 grace/-1 might  
    - Focused: \+3 Wit/-1 will  
    - Fanatical: \+3 Will/-1 wit

    

- Expertise: \+2/3/4 to a 1 ability’s hit modifier  
- Phasing: Rare, Ignore 1 point of armor/clothing when grappling  
- \[Status\] Expert: Rare, Can add 1 additional stack of a status

## Example Abilities By Type

### Sample Basic Abilities

Bite: \+0, 1 wound1  
Grab: \+0, Grapple  
Web: \+1, sticky1  
Breed: \-2, penetrate

Coil: \+2 grace \+2 might until next attack

### Status Effect Abilities

- Venom Bite (Common, 2 points): \+2 hit, 1 sticky, 1 heat  
  - Can replace sticky with weaken as desired  
  - Can replace \+2 with priority as desired

### Combat/Kill Abilities

- Common (2 points): \+2 hit, 1 wound, any \-2 drawback  
- Common (2 points): \+0 hit, 1 wound

### Disrobe Abilities

- Common (2 points): \+2 hit, disrobe, any drawback  
- Common (2 points): \+0 hit, disrobe

### Disarm Abilities

- Common (2 points): \+2 hit, disarm, any drawback  
- Common (2 points): \+0 hit, disarm  
- Common (2 points): Disarm, \[status\], \-2 hit  
- Common (2 points): Disarm, wound, \-2 hit

### Corruption Abilities

- Common (2 points): \+0 hit, 1 corruption, \-1 hit

### Legendary Examples

- **Exhausting Mind Melter (Legendary, 6 points):**  
  Great for dealing corruption  
  - Wit vs Will contest  
  - \+0 hit modifier  
1. 2 heat (-2 Will, \-2 grapple) (4 points)  
2. 1 corruption (-1 will) (3 points)

   Net effect \-3 will, net effect opponent has \-2 to defend each time you use it. Spam repeatedly.

3. \-1 wit/use (-1 point)

   

\- Mind Break  
	\- Wit vs Will  
	\- \+4 hit

1. 2 Corruption (4 points)  
2. 3 cooldown (-2 points)

\- Instant Mind Break  
	\- Wit vs Will  
	\- \+2 hit

1. 2 Corruption (4 points)  
2. 3 cooldown (-2 points)  
3. Priority (+2 points)  
     
- **Death Ray (Legendary, 6 points):**  
  Good for wizards to murder Might characters.  
  - Wit vs Dodge  
  - \+2 hit modifier (2 points)  
1. Priority (2 points)  
2. 2 wounds (4 points)  
3. 2-turn cooldown (-2 points)  
     
- **Murder (Legendary, 6 points):**  
  - Might  
  - Only dodge allowed as defense  
  - \+4 hit modifier (4 points)

Effects:

1. 2 wounds (4 points)  
2. Priority (2 points)  
3. 3-turn cooldown (-3 points)  
4. \-1 Might (-1 Points)  
     
- **Cruelty (Legendary, 6 points):**  
  Wit vs Might  
1. 1 wound (2 points)  
2. 1 corruption (3 points)  
3. 1 weaken (2 points)  
4. 1 spellbound (2 points)  
5. Cooldown 1 (-1 point)  
   - Net effect: \-2 Will and \-2 Might total  
   - Slightly breaks maximum effect rule but is thematic

