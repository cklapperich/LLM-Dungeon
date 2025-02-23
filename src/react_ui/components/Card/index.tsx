import React from 'react';
import { UICharacterCard } from '../../types/uiTypes';

interface CardProps {
    data: UICharacterCard;
}

export const Card: React.FC<CardProps> = ({ data }) => {
    const { type, emoji, backgroundColor, overlayColor, borderRadius, stats } = data;
    
    return (
        <div className={`relative w-full aspect-[4/5] ${backgroundColor} ${borderRadius} flex flex-col items-center justify-center shadow-lg`}>
            <div className="absolute top-2 right-2 flex flex-col gap-1">
                {stats.topStats.map((stat, index) => (
                    <div key={`${type}-top-${index}`} 
                         className={`flex items-center gap-1 ${overlayColor} bg-opacity-50 px-2 py-1 rounded text-white`}>
                        <stat.icon size={16} /> <span>{stat.value}</span>
                    </div>
                ))}
            </div>
            <span className="text-8xl mb-12">{emoji}</span>
            
            <div className={`absolute bottom-0 w-full p-2 ${overlayColor} bg-opacity-50 ${borderRadius.includes('rounded-l') ? 'rounded-bl-xl' : 'rounded-br-xl'}`}>
                <div className="flex justify-around items-center text-white">
                    {stats.bottomStats.map((stat, index) => (
                        <div key={`${type}-bottom-${index}`} className="flex items-center gap-1">
                            <stat.icon size={16} /> <span>{stat.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Card;
