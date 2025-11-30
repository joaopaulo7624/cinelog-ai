import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Film, LayoutGrid, BarChart2, Search, Settings, User, Gamepad2, Play } from 'lucide-react';
import { WatchEntry, AIAnalysis, MediaType } from './types';
import { analyzeProfile } from './services/geminiService';
import { databaseService } from './services/databaseService';
import { supabase } from './services/supabaseClient';
import MovieCard from './components/MovieCard';
import AddEntryModal from './components/AddEntryModal';
import StatsView from './components/StatsView';
import SettingsModal from './components/SettingsModal';
import AuthModal from './components/AuthModal';
import MovieDetailsModal from './components/MovieDetailsModal';

type SortOption = 'recent' | 'oldest' | 'titleAsc' | 'titleDesc' | 'ratingDesc';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [entries, setEntries] = useState<WatchEntry[]>([]);
  const [appMode, setAppMode] = useState<'cine' | 'game'>('cine'); // Novo estado de modo
  const [viewMode, setViewMode] = useState<'list' | 'stats'>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<WatchEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<MediaType | 'ALL'>('ALL');
  const [sortOption, setSortOption] = useState<SortOption>('recent');

  // AI State
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 1. Check Auth on Mount
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setAuthLoading(false);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Load Data when User is present
  useEffect(() => {
    if (user) {
      loadEntries();
    } else {
      setEntries([]);
      setAiAnalysis(null);
    }
  }, [user]);

  const loadEntries = async () => {
    try {
      const data = await databaseService.fetchEntries();
      setEntries(data);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  };

  // 3. Database Operations
  const handleSaveEntry = async (entry: WatchEntry) => {
    // Prevent duplicates (Safeguard)
    if (entry.tmdbId && entries.some(e => e.tmdbId === entry.tmdbId)) {
      alert("Este título já está na sua lista!");
      return;
    }

    // Optimistic update
    setEntries(prev => [entry, ...prev]);

    try {
      await databaseService.addEntry(entry);
    } catch (error) {
      alert("Erro ao salvar na nuvem. Verifique sua conexão.");
      // Rollback if needed (simple version: reload)
      loadEntries();
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (window.confirm('Remover este título da sua lista?')) {
      // Optimistic update
      setEntries(prev => prev.filter(e => e.id !== id));

      try {
        await databaseService.deleteEntry(id);
      } catch (error) {
        alert("Erro ao deletar na nuvem.");
        loadEntries();
      }
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeProfile(entries);
      setAiAnalysis(result);
    } catch (error) {
      alert("Erro ao gerar análise. Verifique sua chave de API ou tente novamente mais tarde.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClearData = () => {
    // Local state clear used by settings modal if user wants to wipe local session (less relevant now)
    setEntries([]);
    setAiAnalysis(null);
  };

  const filteredEntries = useMemo(() => {
    const filtered = entries.filter(entry => {
      // Filtragem por Modo
      if (appMode === 'game' && entry.type !== MediaType.GAME) return false;
      if (appMode === 'cine' && entry.type === MediaType.GAME) return false;

      const matchesSearch = entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.directorOrCreator?.toLowerCase().includes(searchTerm.toLowerCase());

      // Ajuste do filtro de tipo
      const matchesType = filterType === 'ALL' || entry.type === filterType;
      return matchesSearch && matchesType;
    });

    const sorted = [...filtered].sort((a, b) => {
      const getTime = (date?: string) => date ? new Date(date).getTime() : 0;
      switch (sortOption) {
        case 'recent':
          return getTime(b.dateWatched) - getTime(a.dateWatched);
        case 'oldest':
          return getTime(a.dateWatched) - getTime(b.dateWatched);
        case 'titleAsc':
          return a.title.localeCompare(b.title);
        case 'titleDesc':
          return b.title.localeCompare(a.title);
        case 'ratingDesc':
          return (b.rating ?? -1) - (a.rating ?? -1);
        default:
          return 0;
      }
    });

    return sorted;
  }, [entries, searchTerm, filterType, sortOption, appMode]);

  if (authLoading) {
    return <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white">Carregando...</div>;
  }

  if (!user) {
    return <AuthModal />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-100 pb-24">

      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-md px-6 py-4">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">

          {/* Logo & Mode Switch */}
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-black tracking-tighter text-white flex items-center select-none">
              <span className="text-red-500">CINE</span>
              <span className="text-white">LOG</span>
            </h1>

            <button
              onClick={() => setAppMode(prev => prev === 'cine' ? 'game' : 'cine')}
              className="px-4 py-1.5 rounded-full bg-[#1f1f1f] border border-white/5 text-[10px] font-bold text-red-500 uppercase tracking-wider hover:bg-[#2a2a2a] transition-colors"
            >
              {appMode === 'cine' ? 'Trocar para Jogos' : 'Trocar para Filmes'}
            </button>
          </div>

          {/* Search & Profile */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex bg-[#1f1f1f] rounded-full px-4 py-2 items-center border border-transparent focus-within:border-white/10 transition-all w-64">
              <Search size={16} className="text-gray-500 mr-2" />
              <input
                type="text"
                placeholder="Buscar na sua lista..."
                className="bg-transparent border-none outline-none text-xs w-full placeholder-gray-500 text-gray-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden border border-white/10"
            >
              {/* Avatar Placeholder */}
              <img src="https://i.pravatar.cc/150?img=11" alt="User" className="w-full h-full object-cover" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 pb-12">

        {/* Hero Section (Dune Reference) */}
        {viewMode === 'list' && !searchTerm && (
          <div className="relative w-full h-[400px] rounded-3xl overflow-hidden mb-10 group cursor-pointer shadow-2xl">
            <img
              src="https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg"
              alt="Dune Part Two"
              className="w-full h-full object-cover object-top transition-transform duration-1000 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent" />

            <div className="absolute bottom-0 left-0 p-10 flex flex-col gap-4 max-w-2xl">
              <h2 className="text-5xl font-bold text-white leading-tight drop-shadow-lg">
                Dune: Part Two
              </h2>
              <div className="flex items-center gap-4">
                <button className="px-6 py-3 bg-white/10 backdrop-blur-md border border-white/10 rounded-lg text-white font-bold text-sm flex items-center gap-2 hover:bg-white/20 transition-colors">
                  <Play size={16} fill="currentColor" /> Assistido
                </button>
                <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
                  <Play size={20} className="text-white ml-1" fill="currentColor" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters & Actions Bar */}
        <div className="flex flex-col md:flex-row gap-6 items-center justify-between mb-8">

          {/* Filter Tabs (Text Only like reference) */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => { setViewMode('list'); setFilterType('ALL'); }}
              className={`text-sm font-bold transition-colors ${viewMode === 'list' && filterType === 'ALL' ? 'text-white bg-[#1f1f1f] px-4 py-2 rounded-lg' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Todos
            </button>
            {appMode === 'cine' ? (
              <>
                <button
                  onClick={() => { setViewMode('list'); setFilterType(MediaType.MOVIE); }}
                  className={`text-sm font-bold transition-colors ${viewMode === 'list' && filterType === MediaType.MOVIE ? 'text-white bg-[#1f1f1f] px-4 py-2 rounded-lg' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  Filmes
                </button>
                <button
                  onClick={() => { setViewMode('list'); setFilterType(MediaType.SERIES); }}
                  className={`text-sm font-bold transition-colors ${viewMode === 'list' && filterType === MediaType.SERIES ? 'text-white bg-[#1f1f1f] px-4 py-2 rounded-lg' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  Séries
                </button>
              </>
            ) : (
              <button
                onClick={() => { setViewMode('list'); setFilterType(MediaType.GAME); }}
                className={`text-sm font-bold transition-colors ${viewMode === 'list' && filterType === MediaType.GAME ? 'text-white bg-[#1f1f1f] px-4 py-2 rounded-lg' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Jogos
              </button>
            )}
            <button
              onClick={() => setViewMode('stats')}
              className={`text-sm font-bold transition-colors ${viewMode === 'stats' ? 'text-white bg-[#1f1f1f] px-4 py-2 rounded-lg' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Estatísticas
            </button>
          </div>

          <div className="flex items-center">
            <button
              onClick={() => setIsModalOpen(true)}
              className={`bg-[#ff4b6e] hover:bg-[#ff3355] text-white px-6 py-2.5 rounded-lg font-bold text-sm shadow-lg shadow-red-900/20 flex items-center gap-2 transition-transform active:scale-95`}
            >
              <Plus size={16} strokeWidth={3} />
              Adicionar Título
            </button>
          </div>
        </div>

        {/* Content Views */}
        {viewMode === 'list' ? (
          <>
            {filteredEntries.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 animate-fade-in">
                {filteredEntries.map(entry => (
                  <MovieCard
                    key={entry.id}
                    entry={entry}
                    onDelete={handleDeleteEntry}
                    onClick={(entry) => setSelectedEntry(entry)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-gray-100 border border-white/10 rounded-3xl bg-white/5 shadow-2xl shadow-black/40 gap-4 px-6 text-center">
                {/* Empty State Logic... */}
                <div className="p-4 rounded-full bg-white/10">
                  {appMode === 'cine' ? <Film size={56} className="text-primary-300" /> : <Gamepad2 size={56} className="text-purple-300" />}
                </div>
                <div>
                  <p className="text-2xl font-bold mb-2">Sua lista está vazia</p>
                  <p className="text-sm max-w-md text-gray-300">
                    Clique em <span className="text-white font-semibold">"Adicionar {appMode === 'cine' ? 'Título' : 'Jogo'}"</span> e comece a montar um catálogo bonito com seus {appMode === 'cine' ? 'filmes e séries' : 'jogos'} favoritos.
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="mt-4 bg-white/10 hover:bg-white/20 text-white px-5 py-3 rounded-2xl font-semibold transition-all border border-white/10"
                >
                  Registrar primeiro {appMode === 'cine' ? 'título' : 'jogo'}
                </button>
              </div>
            )}
          </>
        ) : (
          <StatsView
            entries={entries}
            analysis={aiAnalysis}
            onAnalyze={handleAnalyze}
            isAnalyzing={isAnalyzing}
          />
        )}

      </main>

      <AddEntryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveEntry}
        existingEntries={entries}
        mode={appMode}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        entries={entries}
        userEmail={user.email}
        onClear={handleClearData} // Mantido como fallback
      />

      <MovieDetailsModal
        isOpen={!!selectedEntry}
        onClose={() => setSelectedEntry(null)}
        entry={selectedEntry}
      />

    </div>
  );
};

export default App;
