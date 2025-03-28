import React from 'react';
import { CombatState } from '../../../types/combatState';
import { Character } from '../../../types/actor';
import { useLoading } from '../../LoadingContext';
import { UIAction } from '../../uiTypes';
import HeroPanel from './HeroPanel';
import NarrationPanel from './NarrationPanel';
import MonsterPanel from './MonsterPanel';

interface CombatAreaProps {
    combatState?: CombatState;
    debugEnabled?: boolean;
    onAction: (action: UIAction) => Promise<void>;
}

export const CombatArea: React.FC<CombatAreaProps> = ({
    combatState,
    debugEnabled,
    onAction
}) => {
    const { isLoading } = useLoading();

    if (!combatState) {
        return (
            <div className="flex-1 bg-black rounded-lg flex flex-col items-center justify-center shadow-lg shadow-black/25 border-2 border-white/40">
                <span className="text-slate-400">No active combat</span>
            </div>
        );
    }

    return (
        <div className="flex-1 bg-black rounded-lg flex relative shadow-lg shadow-black/25 text-white border-2 border-white/40 min-h-0">
            {isLoading && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 rounded-lg">
                    <div className="text-white text-xl flex flex-col items-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-4"></div>
                        <div>Processing action...</div>
                    </div>
                </div>
            )}
            
            {/* Three-column layout - each column has min-h-0 to enable proper scrolling */}
            <div className="w-1/4 min-h-0 overflow-hidden">
                <HeroPanel
                    combatState={combatState}
                    debugEnabled={debugEnabled}
                />
            </div>
            
            <div className="w-2/4 px-2 min-h-0 overflow-hidden">
                <NarrationPanel
                    combatState={combatState}
                />
            </div>
            
            <div className="w-1/4 min-h-0 overflow-hidden">
                <MonsterPanel
                    combatState={combatState}
                    onAction={onAction}
                    debugEnabled={debugEnabled}
                />
            </div>
        </div>
    );
};

export default CombatArea;