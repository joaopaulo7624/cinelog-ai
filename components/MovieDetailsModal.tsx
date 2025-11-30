import React from 'react';
import { WatchEntry, MediaType } from '../types';
import { X, Star, Calendar, Film, User, AlignLeft, Clock, Gamepad2 } from 'lucide-react';

interface MovieDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    entry: WatchEntry | null;
}

const MovieDetailsModal: React.FC<MovieDetailsModalProps> = ({ isOpen, onClose, entry }) => {
    if (!isOpen || !entry) return null;

    const bgImage = entry.imageUrl || `https://picsum.photos/seed/${entry.id}/400/600`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative w-full max-w-4xl bg-[#121212] rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-200">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/50 text-white/70 hover:text-white hover:bg-black/70 backdrop-blur-md transition-all"
                >
                    <X size={20} />
                </button>

                {/* Image Section */}
                <div className="w-full md:w-2/5 h-64 md:h-auto relative shrink-0">
                    <div className="absolute inset-0">
                        <img
                            src={bgImage}
                            alt={entry.title}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-[#121212]" />
                    </div>
                </div>

                {/* Content Section */}
                <div className="flex-1 p-6 md:p-10 flex flex-col gap-6 overflow-y-auto max-h-[60vh] md:max-h-[80vh] custom-scrollbar">

                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-bold uppercase tracking-wider border border-white/5">
                                {entry.type}
                            </span>
                            {entry.year && (
                                <span className="text-gray-400 text-sm font-medium flex items-center gap-1">
                                    <Calendar size={14} />
                                    {entry.year}
                                </span>
                            )}
                        </div>

                        <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-2">
                            {entry.title}
                        </h2>

                        {entry.directorOrCreator && (
                            <p className="text-gray-400 text-sm flex items-center gap-2">
                                <User size={14} />
                                <span className="opacity-70">{entry.type === MediaType.GAME ? 'Desenvolvedora' : 'Dirigido por'}</span>
                                <span className="text-white font-medium">{entry.directorOrCreator}</span>
                            </p>
                        )}

                        {entry.platform && (
                            <p className="text-gray-400 text-sm flex items-center gap-2 mt-1">
                                <Gamepad2 size={14} />
                                <span className="opacity-70">Plataforma</span>
                                <span className="text-white font-medium">{entry.platform}</span>
                            </p>
                        )}

                        {entry.timePlayed && (
                            <p className="text-gray-400 text-sm flex items-center gap-2 mt-1">
                                <Clock size={14} />
                                <span className="opacity-70">Tempo Jogado</span>
                                <span className="text-white font-medium">{entry.timePlayed}h</span>
                            </p>
                        )}
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 w-fit">
                        <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    size={20}
                                    className={`${(entry.rating || 0) >= star ? 'fill-amber-400 text-amber-400' : 'text-gray-600'}`}
                                />
                            ))}
                        </div>
                        <div className="h-8 w-px bg-white/10" />
                        <div className="text-sm">
                            <span className="block text-white font-bold">
                                {entry.rating ? entry.rating.toFixed(1) : 'N/A'}
                            </span>
                            <span className="text-xs text-gray-500 uppercase tracking-wide">Sua nota</span>
                        </div>
                    </div>

                    {/* Genres */}
                    {entry.genre && entry.genre.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {entry.genre.map((g, i) => (
                                <span key={i} className="px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-300 text-xs font-medium border border-indigo-500/20">
                                    {g}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Summary */}
                    <div className="space-y-3">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <AlignLeft size={18} className="text-gray-400" />
                            Sinopse
                        </h3>
                        <p className="text-gray-300 leading-relaxed text-sm md:text-base">
                            {entry.summary || "Nenhuma sinopse disponível para este título."}
                        </p>
                    </div>

                    {/* Review (if exists) */}
                    {entry.review && (
                        <div className="space-y-3 pt-4 border-t border-white/10">
                            <h3 className="text-lg font-bold text-white">Sua Análise</h3>
                            <p className="text-gray-300 italic leading-relaxed text-sm">
                                "{entry.review}"
                            </p>
                        </div>
                    )}

                    {/* Footer Info */}
                    <div className="mt-auto pt-6 flex items-center gap-2 text-xs text-gray-500">
                        <Clock size={12} />
                        <span>Adicionado em {new Date(entry.dateWatched).toLocaleDateString('pt-BR')}</span>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default MovieDetailsModal;
