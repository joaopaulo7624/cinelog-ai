import React from 'react';
import { WatchEntry, MediaType } from '../types';
import { Trash2 } from 'lucide-react';

interface MovieCardProps {
  entry: WatchEntry;
  onDelete: (id: string) => void;
  onClick: (entry: WatchEntry) => void;
}

const MovieCard: React.FC<MovieCardProps> = ({ entry, onDelete, onClick }) => {
  // Use high quality poster if available
  const bgImage = entry.imageUrl || `https://picsum.photos/seed/${entry.id}/400/600`;

  return (
    <div
      onClick={() => onClick(entry)}
      className={`group relative aspect-[2/3] rounded-[32px] overflow-hidden bg-[#1a1a1a] shadow-2xl transition-all duration-300 hover:scale-[1.02] ${entry.type === MediaType.GAME ? 'hover:shadow-purple-900/20' : 'hover:shadow-red-900/20'} cursor-pointer`}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={bgImage}
          alt={entry.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90" />
      </div>

      {/* Top Badges */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
        <div className="flex gap-2">
          <div className="px-3 py-1.5 rounded-full text-[11px] font-bold text-white/90 bg-black/40 backdrop-blur-md border border-white/10">
            {entry.year || 'N/A'}
          </div>
          {entry.platform && (
            <div className="px-3 py-1.5 rounded-full text-[11px] font-bold text-white/90 bg-purple-500/40 backdrop-blur-md border border-white/10">
              {entry.platform}
            </div>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(entry.id); }}
          className="p-2 rounded-full bg-black/40 hover:bg-red-500/80 text-white/70 hover:text-white backdrop-blur-md border border-white/10 transition-all opacity-0 group-hover:opacity-100"
          title="Remover"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Bottom Content */}
      <div className="absolute bottom-0 inset-x-0 p-5 z-10 flex flex-col gap-3">
        <h3 className="text-white font-bold text-lg leading-tight line-clamp-2 drop-shadow-md">
          {entry.title}
        </h3>

        <div className="h-px w-full bg-white/20" />

        <div className="flex items-center justify-between">
          <div className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/5 text-[10px] font-medium text-white/90">
            {entry.type === MediaType.GAME ? 'Jogado' : 'Assistido'}
          </div>

          <span className="text-[10px] font-bold tracking-[0.2em] text-white/60 uppercase">
            {entry.type === MediaType.MOVIE ? 'Filme' : entry.type === MediaType.SERIES ? 'Série' : entry.type === MediaType.GAME ? 'Jogo' : 'Anime'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
