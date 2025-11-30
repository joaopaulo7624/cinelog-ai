import React from 'react';
import { WatchEntry } from '../types';
import { Play, Clock, Calendar } from 'lucide-react';

interface GameCardProps {
    entry: WatchEntry;
    onClick: (entry: WatchEntry) => void;
}

const GameCard: React.FC<GameCardProps> = ({ entry, onClick }) => {
    const bgImage = entry.imageUrl || `https://picsum.photos/seed/${entry.id}/400/600`;

    // Cores baseadas no status (simulado)
    const isPlaying = true; // Simulação, depois podemos adicionar campo de status real
    const statusColor = isPlaying ? 'bg-emerald-500' : 'bg-yellow-500';
    const statusText = isPlaying ? 'Jogando' : 'Backlog';

    return (
        <div
            onClick={() => onClick(entry)}
            className="group relative aspect-[4/5] rounded-3xl overflow-hidden bg-[#121212] cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] border border-white/5 hover:border-purple-500/50"
        >
            {/* Background Image */}
            <img
                src={bgImage}
                alt={entry.title}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-black/20 to-transparent opacity-90" />

            {/* Top Tags */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                <div className="px-3 py-1 rounded-lg bg-[#eab308] text-black text-[10px] font-bold shadow-lg shadow-yellow-900/20">
                    {entry.year || '2024'}
                </div>

                {entry.platform && (
                    <div className="px-3 py-1 rounded-lg bg-[#7e22ce] text-white text-[10px] font-bold shadow-lg shadow-purple-900/20">
                        {entry.platform}
                    </div>
                )}
            </div>

            {/* Bottom Content */}
            <div className="absolute bottom-0 inset-x-0 p-5 flex flex-col gap-3">
                <h3 className="text-white font-bold text-xl leading-tight line-clamp-2 drop-shadow-md">
                    {entry.title}
                </h3>

                <div className="flex items-center justify-between mt-1">
                    <div className={`px-3 py-1 rounded-full ${statusColor} text-white text-[10px] font-bold uppercase tracking-wide shadow-lg`}>
                        {statusText}
                    </div>

                    <div className="flex items-center gap-2 text-gray-400 text-xs font-medium">
                        {/* Platform icons simulation */}
                        <span className="px-2 py-1 rounded bg-white/10 border border-white/5">PC</span>
                        {entry.year && <span className="opacity-60">{entry.year}</span>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GameCard;
