import React, { useState, useEffect } from 'react';
import { WatchEntry, MediaType, TmdbSearchResult, IgdbSearchResult } from '../types';
import { Sparkles, X, Loader2, Search, Film, Star, CheckCircle2, Plus, Check, Gamepad2 } from 'lucide-react';
import { searchTmdb, mapTmdbToEntryData, getTmdbCredits } from '../services/tmdbService';
import { searchIgdb, mapIgdbToEntryData } from '../services/igdbService';

interface AddEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: WatchEntry) => void;
  existingEntries: WatchEntry[];
  mode: 'cine' | 'game';
}

const AddEntryModal: React.FC<AddEntryModalProps> = ({ isOpen, onClose, onSave, existingEntries, mode }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<(TmdbSearchResult | IgdbSearchResult)[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchDebounce, setSearchDebounce] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Selected Item State for "Confirmation View"
  const [selectedItem, setSelectedItem] = useState<TmdbSearchResult | null>(null);
  const [rating, setRating] = useState(0);

  // Track items added in the current session to show feedback without closing
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setSelectedItem(null);
      setRating(0);

      // Initialize with already existing items + reset session tracking
      const existingIds = new Set(existingEntries.map(e => e.tmdbId).filter((id): id is number => !!id));
      setAddedIds(existingIds);
    }
  }, [isOpen, existingEntries]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (searchDebounce) clearTimeout(searchDebounce);

    if (query.length > 2) {
      const timeout = setTimeout(async () => {
        setIsLoading(true);
        let results: (TmdbSearchResult | IgdbSearchResult)[] = [];

        if (mode === 'cine') {
          results = await searchTmdb(query);
        } else {
          results = await searchIgdb(query);
        }

        setSearchResults(results);
        setIsLoading(false);
      }, 500);
      setSearchDebounce(timeout);
    } else {
      setSearchResults([]);
    }
  };

  // Abre a tela de detalhes para avaliar antes de salvar
  const handleSelect = (item: TmdbSearchResult | IgdbSearchResult) => {
    // Se já foi adicionado, não faz nada ou avisa
    if (addedIds.has(item.id)) return;

    setSelectedItem(item);
    setRating(0); // Reset rating for new selection
  };

  // Salva Imediatamente (Botão no Card)
  const handleQuickAdd = async (e: React.MouseEvent, item: TmdbSearchResult | IgdbSearchResult) => {
    e.stopPropagation(); // Impede abrir o modal de detalhes

    // Prevent double add
    if (addedIds.has(item.id)) return;

    // Salva sem nota (0) e NÃO fecha o modal (false)
    await processAndSave(item, 0, false);

    // Adiciona ao set de IDs adicionados para feedback visual
    setAddedIds(prev => new Set(prev).add(item.id));
  };

  // Salva via Tela de Detalhes
  const handleConfirmSave = async () => {
    if (!selectedItem) return;
    // Salva com nota e fecha o modal (true)
    await processAndSave(selectedItem, rating, true);
  };

  const processAndSave = async (item: TmdbSearchResult | IgdbSearchResult, userRating: number, shouldClose: boolean = true) => {
    if (shouldClose) setIsLoading(true); // Only show full loading overlay if we are closing/transitioning

    let newEntry: WatchEntry;

    if (mode === 'cine') {
      const tmdbItem = item as TmdbSearchResult;
      const mapped = mapTmdbToEntryData(tmdbItem);

      // Tentativa silenciosa de pegar diretor/criador extra
      let director = '';
      try {
        director = await getTmdbCredits(tmdbItem.id, tmdbItem.media_type);
      } catch (e) { /* ignore */ }

      newEntry = {
        id: crypto.randomUUID(),
        title: mapped.title,
        type: mapped.type,
        rating: userRating,
        dateWatched: new Date().toISOString(),
        genre: mapped.genre,
        year: mapped.year,
        summary: mapped.summary,
        directorOrCreator: director,
        imageUrl: mapped.imageUrl,
        tmdbId: mapped.tmdbId
      };
    } else {
      // Game Mode
      const igdbItem = item as IgdbSearchResult;
      const mapped = mapIgdbToEntryData(igdbItem);

      newEntry = {
        id: crypto.randomUUID(),
        title: mapped.title!,
        type: MediaType.GAME,
        rating: userRating,
        dateWatched: new Date().toISOString(),
        genre: mapped.genre || [],
        year: mapped.year,
        summary: mapped.summary,
        directorOrCreator: mapped.directorOrCreator,
        platform: mapped.platform,
        imageUrl: mapped.imageUrl,
        igdbId: mapped.igdbId
      };
    }

    onSave(newEntry);

    if (shouldClose) {
      setIsLoading(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-[#1A1A1A] border border-gray-800 w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden flex flex-col min-h-[60vh] max-h-[90vh] relative">

        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-800 bg-[#1A1A1A] sticky top-0 z-10">
          <h2 className="text-xl font-bold text-white tracking-tight">
            {selectedItem ? 'Confirmar Adição' : (mode === 'cine' ? 'Adicionar Títulos' : 'Adicionar Jogos')}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-gray-800">
            <X size={24} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-0 overflow-y-auto custom-scrollbar">

          {selectedItem ? (
            // --- STEP 2: CONFIRMATION SCREEN (Sem data) ---
            <div className="p-6 flex flex-col md:flex-row gap-6 animate-in slide-in-from-right-4 duration-300">
              {/* Poster Preview */}
              <div className="w-full md:w-1/3 shrink-0">
                <div className="aspect-[2/3] rounded-lg overflow-hidden shadow-2xl border border-gray-700 relative group">
                  {(() => {
                    const imgUrl = mode === 'cine'
                      ? (selectedItem as TmdbSearchResult).poster_path ? `https://image.tmdb.org/t/p/w500${(selectedItem as TmdbSearchResult).poster_path}` : null
                      : (selectedItem as IgdbSearchResult).cover?.url ? `https:${(selectedItem as IgdbSearchResult).cover?.url?.replace('t_thumb', 't_cover_big')}` : null;

                    if (imgUrl) {
                      return (
                        <img
                          src={imgUrl}
                          alt={(selectedItem as any).title || (selectedItem as any).name}
                          className="w-full h-full object-cover"
                        />
                      );
                    } else {
                      return (
                        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                          {mode === 'cine' ? <Film size={48} className="text-gray-600" /> : <Gamepad2 size={48} className="text-gray-600" />}
                        </div>
                      );
                    }
                  })()}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
              </div>

              {/* Details & Actions */}
              <div className="flex-1 space-y-6">
                <div>
                  <h3 className="text-3xl font-bold text-white mb-2 leading-tight">{(selectedItem as any).title || (selectedItem as any).name}</h3>
                  <div className="flex items-center gap-3 text-gray-400 text-sm">
                    <span className="uppercase tracking-wider border border-gray-700 px-2 py-0.5 rounded">
                      {mode === 'cine'
                        ? ((selectedItem as TmdbSearchResult).media_type === 'movie' ? 'Filme' : 'Série')
                        : 'Jogo'}
                    </span>
                    <span>
                      {mode === 'cine'
                        ? new Date(((selectedItem as TmdbSearchResult).release_date || (selectedItem as TmdbSearchResult).first_air_date || Date.now())).getFullYear()
                        : new Date(((selectedItem as IgdbSearchResult).first_release_date || 0) * 1000).getFullYear()
                      }
                    </span>
                  </div>
                </div>

                <p className="text-gray-400 text-sm leading-relaxed line-clamp-4">
                  {selectedItem.overview || (selectedItem as IgdbSearchResult).summary || "Sem sinopse disponível."}
                </p>

                <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Sua Avaliação (Opcional)</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setRating(star)}
                          className="group focus:outline-none"
                        >
                          <Star
                            size={32}
                            className={`transition-colors ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600 group-hover:text-gray-500'}`}
                          />
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-600 mt-2">Toque nas estrelas para avaliar ou salve sem nota.</p>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="px-5 py-3 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors font-medium"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={handleConfirmSave}
                    disabled={isLoading}
                    className="flex-1 bg-green-600 hover:bg-green-500 text-white px-5 py-3 rounded-lg font-bold shadow-lg shadow-green-900/20 transition-all transform active:scale-95 flex justify-center items-center gap-2"
                  >
                    {isLoading ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={18} />}
                    {mode === 'cine' ? 'Confirmar que Assisti' : 'Confirmar que Joguei'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // --- STEP 1: SEARCH SCREEN ---
            <div className="p-6 space-y-6">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-600 to-purple-600 rounded-xl opacity-30 group-hover:opacity-70 transition duration-500 blur"></div>
                <div className="relative flex items-center bg-[#121212] rounded-xl overflow-hidden">
                  <Search className="ml-4 text-gray-400" size={20} />
                  <input
                    type="text"
                    autoFocus
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder={mode === 'cine' ? "Busque para adicionar..." : "Busque jogos..."}
                    className="w-full bg-transparent text-white px-4 py-4 outline-none text-lg placeholder-gray-600"
                  />
                  {isLoading && <Loader2 className="mr-4 animate-spin text-primary-500" size={20} />}
                </div>
              </div>

              {searchResults.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                  {searchResults.map(item => {
                    const isAdded = addedIds.has(item.id);

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSelect(item)}
                        className={`group relative aspect-[2/3] bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-gray-600 transition-all duration-200 ${isAdded ? 'ring-2 ring-green-500/50' : ''}`}
                      >
                        {(() => {
                          const imgUrl = mode === 'cine'
                            ? (item as TmdbSearchResult).poster_path ? `https://image.tmdb.org/t/p/w342${(item as TmdbSearchResult).poster_path}` : null
                            : (item as IgdbSearchResult).cover?.url ? `https:${(item as IgdbSearchResult).cover?.url?.replace('t_thumb', 't_cover_big')}` : null;

                          if (imgUrl) {
                            return (
                              <img
                                src={imgUrl}
                                alt={(item as any).title || (item as any).name}
                                className={`w-full h-full object-cover transition-transform duration-500 ${isAdded ? 'grayscale-[50%]' : 'group-hover:scale-105'}`}
                              />
                            );
                          } else {
                            return (
                              <div className="w-full h-full flex flex-col items-center justify-center text-gray-600 p-2 text-center">
                                {mode === 'cine' ? <Film size={24} className="mb-2" /> : <Gamepad2 size={24} className="mb-2" />}
                                <span className="text-xs">{(item as any).title || (item as any).name}</span>
                              </div>
                            );
                          }
                        })()}

                        {/* Status Overlay if Added */}
                        {isAdded && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                            <div className="bg-green-600 text-white p-2 rounded-full shadow-lg">
                              <Check size={24} strokeWidth={3} />
                            </div>
                          </div>
                        )}

                        {/* Quick Add Button Overlay */}
                        {!isAdded && (
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 p-4 z-10">
                            <button
                              onClick={(e) => handleQuickAdd(e, item)}
                              className="bg-green-600 hover:bg-green-500 text-white w-full py-2.5 rounded-lg font-bold text-xs uppercase tracking-wide shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 flex items-center justify-center gap-2"
                            >
                              <CheckCircle2 size={16} />
                              {mode === 'cine' ? 'Já Assisti' : 'Já Joguei'}
                            </button>

                            <span className="text-xs text-gray-300 font-medium mt-2 border-b border-transparent group-hover:border-gray-500 pb-0.5">
                              Ver Detalhes
                            </span>
                          </div>
                        )}

                        {/* Always visible info gradient at bottom (only if not added) */}
                        {!isAdded && (
                          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 to-transparent p-3 pt-10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity pointer-events-none">
                            <p className="text-white text-xs font-bold truncate">{(item as any).title || (item as any).name}</p>
                            <p className="text-gray-400 text-[10px]">
                              {mode === 'cine'
                                ? new Date(((item as TmdbSearchResult).release_date || (item as TmdbSearchResult).first_air_date || Date.now())).getFullYear()
                                : new Date(((item as IgdbSearchResult).first_release_date || 0) * 1000).getFullYear()
                              }
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-gray-600">
                  {searchQuery.length > 0 ? (
                    <>
                      <Film size={48} className="mb-4 opacity-50" />
                      <p>Nenhum resultado encontrado.</p>
                    </>
                  ) : (
                    <>
                      {mode === 'cine' ? <Plus size={48} className="mb-4 opacity-20" /> : <Gamepad2 size={48} className="mb-4 opacity-20" />}
                      <p className="text-gray-500">{mode === 'cine' ? 'Digite o nome do filme ou série' : 'Digite o nome do jogo'}</p>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddEntryModal;