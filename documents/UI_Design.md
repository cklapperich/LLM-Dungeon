Reverse Dungeon Crawler UI Design Document
Core Philosophy
UI should be data-driven, receiving all content from game state
Clean separation between game logic and presentation
Trading card game aesthetic for monsters and heroes
Focus on the confrontation/battle as the main visual element
Layout Structure
Navigation
Collapsible sidebar on the left
Contains icons for main views: Overview, Nursery, Dungeon, Gene Pool
Minimal when collapsed (just icons), expands to show labels
Dark theme (bg-slate-900) for contrast
Top Bar
Wave number and current room name
Resource display (Gold, Genes)
Persistent across all views
Main Combat View Layout
Primary Battle Area (2/3 of screen width)

Large character art area (1/2 to 2/3 of vertical space)
Two full-art "cards" for monster and hero
Stats (Attack/Defense) overlaid on character art
Trading card game inspired presentation
VS indicator between characters
Narration/description text box below

Right Panel (1/3 of screen width)

Room image at top
Available actions below
Collapsible combat log
Effects display when log is collapsed
Data Structure
interface GameState {

  currentView: {

    type: 'combat' | 'dungeon' | 'nursery' | 'genePool';

    focusId?: string;

  };

  phase: 'preparation' | 'combat';

  // ... other state properties

}
Visual Elements
Character Cards
Large, high-resolution character art
Stats overlaid in corners
Effects visible on card
Card frame/border design
Hover effects for additional info
Room Visualization
Smaller room image in right panel
Atmospheric but not dominating
Provides context without overshadowing combat
Combat Log
Toggleable view
When hidden, shows current effects
Clean, readable format
Scrollable history
View States
Combat View
Primary focus on monster vs hero confrontation
Room context in secondary position
Clear action options
Easy access to combat information
Other Views (to be designed)
Nursery (monster management)
Dungeon (room layout/management)
Gene Pool (ability management)
Overview (game progress)
UI/UX Principles
Information Hierarchy

Combat confrontation is primary focus
Room context is secondary
Actions and stats easily scannable
Combat log available but not intrusive

Navigation

Clear view switching
Persistent access to key areas
Contextual actions based on current view

State Management

All display data comes from game state
UI components don't make gameplay decisions
Actions dispatched to game engine
Clear action availability feedback

Visual Style

Trading card game aesthetic
Dark theme for navigation
Clean, modern interface
Atmospheric but readable
Implementation Notes
Use Tailwind for styling
Lucide icons for UI elements
React components for modular structure
Type safety with TypeScript

