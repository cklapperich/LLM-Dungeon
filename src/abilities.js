  
  // abilities.js
import { SKILLS, BODY_PARTS } from 'types??.js'
import { applyWounds, raiseGrappleState, lowerGrappleState } from './gameactions.js'
  
export const punch = {
    name: "Punch",
    bodyParts: [BODY_PARTS.ARM, BODY_PARTS.HAND],
    skill: SKILLS.STRIKE,
    modifier: 0,
    effect: (gameState, self, target, margin) => {
      applyWounds(target, 1)
    }
  }
  
export const grapple = {
    name: "Grapple", 
    bodyParts: [BODY_PARTS.ARM, BODY_PARTS.HAND],
    skill: SKILLS.WRESTLE,
    modifier: 0,
    effect: (gameState, self, target, margin) => {
      raiseGrappleState(self, target)
    }
}
  
export const breakFree = {
    name: "Break Free",
    bodyParts: [BODY_PARTS.ARM, BODY_PARTS.LEG],
    skill: SKILLS.STRENGTH,
    effect: (gameState, self, target, margin) => {
      lowerGrappleState(self, 1)
    }
  }
  
export const abilities = {
    punch,
    grapple,
    breakFree  
  }