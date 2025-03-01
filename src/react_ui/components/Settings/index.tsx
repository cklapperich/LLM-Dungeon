import React from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import { GameSettings } from '../../../types/gamestate';

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
    onSettingsChange({
      ...settings,
      [key]: value
    });
  };
  
  return (
    <div className="relative">
      {/* Gear icon button */}
      <button 
        onClick={togglePanel}
        className="p-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 rounded-full
                  border-[3px] border-white/50 shadow-lg shadow-black/25"
      >
        <SettingsIcon size={20} />
      </button>
      
      {/* Settings panel (shown when isOpen is true) */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-slate-800 rounded-lg shadow-lg z-50
                      border-[3px] border-white/50 p-4">
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
      )}
    </div>
  );
};

export default SettingsMenu;
