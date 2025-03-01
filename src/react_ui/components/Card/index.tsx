import React, { useMemo } from 'react';
import { UICharacterCard } from '../../uiTypes';

 import.meta.glob('@/assets/images/**/*.{png,jpg,jpeg,webp,gif}', { eager: true });

interface CardProps {
    data: UICharacterCard;
}

const imageFiles: Record<string, { default: string }> = import.meta.glob(
    '@/assets/images/**/*.{png,jpg,jpeg,webp,gif}', 
    { eager: true }
  ) as Record<string, { default: string }>;

export function getImageUrl(path) {
  // Find the matching image regardless of the exact path format
  const key = Object.keys(imageFiles).find(k => k.endsWith(path));
  if (key) {
    return imageFiles[key].default;
  }
  console.warn(`Image not found: ${path}`);
  return null;
}

export const Card: React.FC<CardProps> = ({ data }) => {
    const { type, emoji, backgroundColor, overlayColor, borderRadius, stats } = data;
    const imageUrl = data.artworkUrl ? getImageUrl(data.artworkUrl) : null;

    return (
        <div className={`relative w-full h-full bg-black ${borderRadius} flex flex-col items-center justify-center shadow-lg shadow-black/25 border-2 border-white overflow-hidden`}>
            {/* Artwork Layer */}
            <div className="absolute inset-0">
                {data.artworkUrl ? (
                    <img
                        src={imageUrl}
                        alt={type}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                    />
                ) : null}
                <span className={`text-8xl mb-12 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${data.artworkUrl ? 'hidden' : ''}`}>
                    {emoji}
                </span>
            </div>

            {/* Stats Overlay */}
            <div className="absolute top-2 right-2 flex flex-col gap-1 z-10">
                {stats.topStats.map((stat, index) => (
                    <div key={`${type}-top-${index}`} 
                         className={`flex items-center gap-1 ${overlayColor} bg-opacity-50 px-2 py-1 rounded text-white`}>
                        <stat.icon size={16} /> <span>{stat.value}</span>
                    </div>
                ))}
            </div>
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

// New MiniCard component
interface MiniCardProps {
    data: UICharacterCard;
}

export const MiniCard: React.FC<MiniCardProps> = ({ data }) => {
    const { type, emoji, overlayColor, borderRadius, stats } = data;
    
    return (
        <div className={`relative w-full aspect-[3/2] bg-black ${borderRadius} flex flex-col items-center justify-center shadow-md shadow-black/25 border border-white overflow-hidden`}>
            {/* Character Name/Emoji */}
            <div className={`absolute top-0 left-0 w-full p-1 ${overlayColor} bg-opacity-70 text-white text-xs font-medium text-center`}>
                {type}
            </div>
            
            {/* Emoji in center */}
            <span className="text-3xl">{emoji}</span>
            
            {/* Stats at bottom */}
            <div className={`absolute bottom-0 w-full p-1 ${overlayColor} bg-opacity-70`}>
                <div className="flex justify-around items-center text-white text-xs">
                    {stats.bottomStats.map((stat, index) => (
                        <div key={`${type}-mini-${index}`} className="flex items-center gap-0.5">
                            <stat.icon size={10} /> <span>{stat.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Card;
