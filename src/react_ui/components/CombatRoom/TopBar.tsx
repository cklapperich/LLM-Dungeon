import React from 'react';
import { GameState as BackendGameState } from '../../../types/gamestate';

interface TopBarProps {
    turnCounter?: number;
    dayCounter?: number;
    infamy?: number;
}

export const TopBar: React.FC<TopBarProps> = ({ 
    turnCounter = 0,
    dayCounter = 0,
    infamy = 0
}) => {
    return (
        <div className="bg-slate-800 text-white p-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
                <span>Turn {turnCounter} - Day {dayCounter}</span>
            </div>
            <div className="flex gap-4">
                <span>Infamy: {infamy}</span>
            </div>
        </div>
    );
};

export default TopBar;
