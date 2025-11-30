import React from 'react';
import { WatchEntry, MediaType } from '../types';
import { Play, Check } from 'lucide-react';

interface MovieCardProps {
  entry: WatchEntry;
  onDelete: (id: string) => void;
  onClick: (entry: WatchEntry) => void;
}

const MovieCard: React.FC<MovieCardProps> = ({ entry, onDelete, onClick }) => {
  // Use high quality poster if available
  const bgImage = entry.imageUrl || `https://picsum.photos/seed/${entry.id}/400/600`;

  // Tag lógica para simular "Netflix", "Cinema" etc da imagem
  // Como não temos esse campo ainda, vamos improvisar com o Tipo ou Plataforma
  const tagLabel = entry.platform || (entry.type === MediaType.MOVIE ? 'Cinema' : entry.type === MediaType.SERIES ? 'TV' : 'Game');
  const tagColor = entry.type === MediaType.GAME ? 'bg-purple-600' :
    tagLabel === 'Netflix' ? 'bg-red-600' :
      tagLabel === 'HBO Max' ? 'bg-purple-700' :
        'bg-gray-600'; // Default

  return (
    <div
      onClick={() => onClick(entry)}
      className="group relative aspect-[2/3] rounded-2xl overflow-hidden bg-[#1a1a1a] shadow-lg cursor-pointer transition-transform duration-300 hover:scale-[1.02]"
    >
      {/* Background Image */}
      <img
        src={bgImage}
        alt={entry.title}
        loading="lazy"
        className="w-full h-full object-cover"
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

      {/* Top Tags */}
      <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
        <div className="px-2 py-1 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-medium text-white border border-white/10">
          {entry.year || 'N/A'}
        </div>

        <div className={`px-2 py-1 rounded-md ${tagColor} text-[10px] font-bold text-white shadow-sm`}>
          {tagLabel}
        </div>
      </div>

      {/* Bottom Content */}
      <div className="absolute bottom-0 inset-x-0 p-3 flex flex-col gap-2">
        {/* Title (Hidden in reference but good for accessibility/fallback, visible on hover or always?) 
            Na imagem de referência, alguns cards têm título (Oppenheimer), outros não parecem ter texto grande.
            Vou colocar o título.
        */}
        <h3 className="text-white font-bold text-lg leading-tight line-clamp-2 drop-shadow-md text-center mb-1">
          {entry.title.toUpperCase()}
        </h3>

        {/* Action Button */}
        <button className="w-full py-2 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 flex items-center justify-center gap-2 transition-colors group-hover:bg-white group-hover:text-black">
          <Play size={12} fill="currentColor" />
          <span className="text-xs font-bold uppercase tracking-wide">Assistido</span>
        </button>
      </div>
    </div>
  );
};

export default MovieCard;
