import React from 'react';
import { Book } from 'lucide-react';
import { GameLogMessage } from '../../../types/gamestate';
import { UIAction, BaseUIAction } from '../../types/uiTypes';

interface ActionPanelProps {
    messageLog: GameLogMessage[];
    legalActions: UIAction[];
    onAction: (action: UIAction) => void;
}

export const ActionPanel: React.FC<ActionPanelProps> = ({ 
    messageLog = [],
    legalActions = [],
    onAction 
}) => {
    const [showLog, setShowLog] = React.useState(false);

    return (
        <div className="w-1/3 bg-slate-200 p-6 flex flex-col">
            {/* Available Actions */}
            <div className="mb-4">
                <h3 className="font-bold mb-2">Available Actions</h3>
                <div className="space-y-2">
                    {legalActions.map((action, i) => (
                        <button
                            key={i}
                            onClick={() => onAction(action)}
                            disabled={action.disabled}
                            className={`w-full p-2 rounded flex items-center justify-between
                                ${action.disabled 
                                    ? 'bg-slate-300 text-slate-500' 
                                    : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                        >
                            <span>{action.label}</span>
                            {action.disabled && action.tooltip && (
                                <span className="text-sm">{action.tooltip}</span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Message Log Toggle */}
            <button 
                className="mb-4 flex items-center gap-2 px-4 py-2 rounded bg-slate-300 hover:bg-slate-400"
                onClick={() => setShowLog(!showLog)}
            >
                <Book size={16} />
                Message Log
            </button>

            {/* Message Log Panel */}
            <div className="flex-1 bg-white rounded-lg p-4 overflow-y-auto">
                {showLog ? (
                    messageLog.map((message, i) => (
                        <div key={i} className="mb-2 text-sm">
                            <span className="font-medium">{message.sender}: </span>
                            {message.content}
                        </div>
                    ))
                ) : (
                    <>
                        <h3 className="font-bold mb-2">Combat Status</h3>
                        <div className="text-sm text-gray-600">
                            Waiting for next action...
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ActionPanel;
