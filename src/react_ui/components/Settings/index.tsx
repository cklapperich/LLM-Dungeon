import React from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import { GameSettings } from '../../../types/gamestate';
import { saveSettings } from '../../../game_engine/settings';

interface SettingsProps {
  settings: GameSettings;
  onSettingsChange: (newSettings: GameSettings) => void;
}

const SettingsMenu: React.FC<SettingsProps> = ({ settings, onSettingsChange }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  
  // Toggle settings panel
  const togglePanel = () => setIsOpen(!isOpen);
  
  // Handle settings changes
  const handleSettingChange = (key: keyof GameSettings, value: any) => {
    const newSettings = {
      ...settings,
      [key]: value
    };
    
    // Call onSettingsChange to update the parent component
    onSettingsChange(newSettings);
    
    // Save settings to localStorage
    saveSettings(newSettings);
  };
  
  return (
    <div>
      {/* Gear icon button */}
      <button 
        onClick={togglePanel}
        className="p-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 flex items-center gap-3 relative
                  border-[3px] border-white/50"
      >
        <SettingsIcon size={20} />
      </button>
      
      {/* Modal backdrop (shown when isOpen is true) */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          {/* Modal content */}
          <div className="w-96 bg-slate-800 rounded-lg shadow-lg border-[3px] border-white/50 p-6 max-h-[90vh] overflow-y-auto">
          <h3 className="text-white text-lg font-bold mb-4">Settings</h3>
          
          {/* Narration toggle */}
          <div className="mb-4">
            <label className="flex items-center justify-between text-white">
              <span>Narration</span>
              <input 
                type="checkbox" 
                checked={settings.narrationEnabled}
                onChange={(e) => handleSettingChange('narrationEnabled', e.target.checked)}
                className="ml-2"
              />
            </label>
          </div>
          
          {/* LLM selection */}
          <div className="mb-4">
            <label className="block text-white mb-2">LLM Model</label>
            <select 
              value={settings.llm || ''}
              onChange={(e) => handleSettingChange('llm', e.target.value)}
              className="w-full bg-slate-700 text-white p-2 rounded"
            >
              {settings.llm_choices.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>
          
          {/* Spicy LLM selection */}
          <div className="mb-4">
            <label className="block text-white mb-2">Spicy LLM Model</label>
            <select 
              value={settings.spicy_llm || ''}
              onChange={(e) => handleSettingChange('spicy_llm', e.target.value)}
              className="w-full bg-slate-700 text-white p-2 rounded"
            >
              {settings.llm_choices.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>
          
            {/* Close button */}
            <button 
              onClick={togglePanel}
              className="w-full mt-4 p-2 bg-slate-700 hover:bg-slate-600 active:bg-slate-800 
                        text-white rounded border border-white/30"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsMenu;
