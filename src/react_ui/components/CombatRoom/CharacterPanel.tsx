import React from 'react';

interface CharacterPanelProps {
  topContent: React.ReactNode;  // The character card
  bottomContent?: React.ReactNode;  // Optional bottom content (actions for monster, empty for hero)
  debugContent?: React.ReactNode;  // Optional debug view
  debugEnabled?: boolean;
}

export const CharacterPanel: React.FC<CharacterPanelProps> = ({ 
  topContent,
  bottomContent,
  debugContent,
  debugEnabled = false
}) => {
  return (
    <div className="h-full">
      {debugEnabled && debugContent ? (
        // Debug View
        <div className="h-full overflow-auto text-white bg-black rounded-lg p-4 shadow-inner shadow-black/25 border-2 border-white/40">
          {debugContent}
        </div>
      ) : (
        <div className="h-full flex flex-col">
          {/* Top Content (Character Card) */}
          <div className={`${bottomContent ? 'h-1/2 mb-4' : 'h-full'}`}>
            {topContent}
          </div>
          
          {/* Bottom Content (Actions) - Only if provided */}
          {bottomContent && (
            <div className="h-1/2 bg-black rounded-lg p-4 shadow-lg shadow-black/25 border-2 border-white/40">
              {bottomContent}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CharacterPanel;
