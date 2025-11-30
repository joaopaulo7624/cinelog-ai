import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Film, LayoutGrid, BarChart2, Search, Settings, User, Gamepad2, Play, Check } from 'lucide-react';
import { WatchEntry, AIAnalysis, MediaType } from './types';
import { analyzeProfile } from './services/geminiService';
import { databaseService } from './services/databaseService';
import { supabase } from './services/supabaseClient';
import MovieCard from './components/MovieCard';
import GameCard from './components/GameCard';
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

  // --- RENDER HELPERS ---

  const renderCineLog = () => (
    <>
      {/* Navbar CineLog */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-md px-6 py-4 border-b border-white/5">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-black tracking-tighter text-white flex items-center select-none">
              <span className="text-red-500">CINE</span>
              <span className="text-white">LOG</span>
            </h1>
            <button
              onClick={() => setAppMode('game')}
              className="px-4 py-1.5 rounded-full bg-[#1f1f1f] border border-white/5 text-[10px] font-bold text-red-500 uppercase tracking-wider hover:bg-[#2a2a2a] transition-colors"
            >
              Trocar para Jogos
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex bg-[#1f1f1f] rounded-full px-4 py-2 items-center border border-transparent focus-within:border-white/10 transition-all w-64">
              <Search size={16} className="text-gray-500 mr-2" />
              <input
                type="text"
                placeholder="Buscar filmes..."
                className="bg-transparent border-none outline-none text-xs w-full placeholder-gray-500 text-gray-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button onClick={() => setIsSettingsOpen(true)} className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden border border-white/10">
              <img src="https://i.pravatar.cc/150?img=11" alt="User" className="w-full h-full object-cover" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 pb-12 pt-8">
        {/* Hero CineLog */}
        {viewMode === 'list' && !searchTerm && (
          <div className="relative w-full h-[400px] rounded-3xl overflow-hidden mb-10 group cursor-pointer shadow-2xl">
            <img
              src="https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg"
              alt="Dune Part Two"
              className="w-full h-full object-cover object-top transition-transform duration-1000 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 p-10 flex flex-col gap-4 max-w-2xl">
              <h2 className="text-5xl font-bold text-white leading-tight drop-shadow-lg">Dune: Part Two</h2>
              <div className="flex items-center gap-4">
                <button className="px-6 py-3 bg-white/10 backdrop-blur-md border border-white/10 rounded-lg text-white font-bold text-sm flex items-center gap-2 hover:bg-white/20 transition-colors">
                  <Play size={16} fill="currentColor" /> Assistido
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filters CineLog */}
        <div className="flex flex-col md:flex-row gap-6 items-center justify-between mb-8">
          <div className="flex items-center gap-6">
            <button onClick={() => { setViewMode('list'); setFilterType('ALL'); }} className={`text-sm font-bold transition-colors ${viewMode === 'list' && filterType === 'ALL' ? 'text-white bg-[#1f1f1f] px-4 py-2 rounded-lg' : 'text-gray-500 hover:text-gray-300'}`}>Todos</button>
            <button onClick={() => { setViewMode('list'); setFilterType(MediaType.MOVIE); }} className={`text-sm font-bold transition-colors ${viewMode === 'list' && filterType === MediaType.MOVIE ? 'text-white bg-[#1f1f1f] px-4 py-2 rounded-lg' : 'text-gray-500 hover:text-gray-300'}`}>Filmes</button>
            <button onClick={() => { setViewMode('list'); setFilterType(MediaType.SERIES); }} className={`text-sm font-bold transition-colors ${viewMode === 'list' && filterType === MediaType.SERIES ? 'text-white bg-[#1f1f1f] px-4 py-2 rounded-lg' : 'text-gray-500 hover:text-gray-300'}`}>Séries</button>
            <button onClick={() => setViewMode('stats')} className={`text-sm font-bold transition-colors ${viewMode === 'stats' ? 'text-white bg-[#1f1f1f] px-4 py-2 rounded-lg' : 'text-gray-500 hover:text-gray-300'}`}>Estatísticas</button>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="bg-[#ff4b6e] hover:bg-[#ff3355] text-white px-6 py-2.5 rounded-lg font-bold text-sm shadow-lg shadow-red-900/20 flex items-center gap-2 transition-transform active:scale-95">
            <Plus size={16} strokeWidth={3} /> Adicionar Título
          </button>
        </div>

        {/* Grid CineLog */}
        {viewMode === 'list' ? (
          filteredEntries.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 animate-fade-in">
              {filteredEntries.map(entry => (
                <MovieCard key={entry.id} entry={entry} onDelete={handleDeleteEntry} onClick={(entry) => setSelectedEntry(entry)} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-gray-100 border border-white/10 rounded-3xl bg-white/5 shadow-2xl gap-4 px-6 text-center">
              <Film size={48} className="text-gray-600" />
              <p className="text-gray-400">Nenhum filme encontrado.</p>
            </div>
          )
        ) : (
          <StatsView entries={entries} analysis={aiAnalysis} onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
        )}
      </main>
    </>
  );

  const renderGameLog = () => (
    <>
      {/* Navbar GameLog - Cyberpunk Style */}
      <header className="sticky top-0 z-40 bg-[#050505]/90 backdrop-blur-md px-6 py-4 border-b border-purple-500/10 shadow-[0_4px_20px_rgba(168,85,247,0.1)]">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <Gamepad2 size={24} className="text-purple-500" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-wide text-white leading-none">GAME <span className="text-purple-500">LOG</span></h1>
                <button onClick={() => setAppMode('cine')} className="text-[10px] font-bold text-gray-500 hover:text-white uppercase tracking-wider transition-colors">
                  Trocar para Filmes
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex bg-[#0f0f0f] rounded-lg px-4 py-2 items-center border border-purple-500/30 focus-within:border-purple-500 focus-within:shadow-[0_0_10px_rgba(168,85,247,0.3)] transition-all w-72">
              <Search size={16} className="text-purple-500 mr-2" />
              <input
                type="text"
                placeholder="Buscar na sua lista..."
                className="bg-transparent border-none outline-none text-xs w-full placeholder-gray-500 text-gray-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button onClick={() => setIsSettingsOpen(true)} className="w-9 h-9 rounded-lg bg-gray-800 border border-purple-500/20 overflow-hidden">
              <img src="https://i.pravatar.cc/150?img=11" alt="User" className="w-full h-full object-cover" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 pb-12 pt-8">

        {/* Top Navigation Pills */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex gap-2 p-1 bg-[#0f0f0f] rounded-full border border-white/5">
            <button onClick={() => { setViewMode('list'); setFilterType('ALL'); }} className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${viewMode === 'list' && filterType === 'ALL' ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}>Todos</button>
            <button onClick={() => { setViewMode('list'); setFilterType(MediaType.GAME); }} className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${viewMode === 'list' && filterType === MediaType.GAME ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}>Jogos</button>
            <button onClick={() => setViewMode('stats')} className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${viewMode === 'stats' ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}>Estatísticas</button>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-6 py-2.5 rounded-full font-bold text-xs shadow-lg shadow-purple-900/40 flex items-center gap-2 transition-transform active:scale-95 border border-white/10">
            <Plus size={14} strokeWidth={3} /> Adicionar Jogo
          </button>
        </div>

        {/* Hero GameLog - Elden Ring Style */}
        {viewMode === 'list' && !searchTerm && (
          <div className="relative w-full h-[400px] rounded-[32px] overflow-hidden mb-12 group cursor-pointer shadow-[0_0_40px_rgba(168,85,247,0.15)] border border-purple-500/40">
            <img
              src="https://image.api.playstation.com/vulcan/ap/rnd/202110/2000/phvVT0qZfcRms5qDAk0SI3CM.png"
              alt="Elden Ring"
              className="w-full h-full object-cover object-center transition-transform duration-1000 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/40 to-transparent" />

            <div className="absolute top-0 left-0 bottom-0 p-12 flex flex-col justify-center gap-6 max-w-3xl">
              <div>
                <span className="text-purple-400 font-bold tracking-widest text-xs uppercase mb-2 block">Recently Played</span>
                <h2 className="text-6xl font-black text-white leading-none mb-4">Elden Ring</h2>
                <div className="flex gap-2">
                  <span className="px-3 py-1 rounded bg-white/10 text-xs font-bold text-white border border-white/10">PC</span>
                  <span className="px-3 py-1 rounded bg-white/10 text-xs font-bold text-white border border-white/10">PlayStation 5</span>
                  <span className="px-3 py-1 rounded bg-yellow-500/20 text-yellow-500 text-xs font-bold border border-yellow-500/20">Backlog</span>
                </div>
              </div>

              <button className="w-fit px-8 py-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/50 rounded-full font-bold text-sm flex items-center gap-2 transition-all backdrop-blur-md">
                <Check size={16} /> Jogado
              </button>
            </div>
          </div>
        )}

        {/* Content Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Recently Played</h3>
          <div className="flex gap-4">
            {/* Fake Dropdowns for visual match */}
            <div className="px-4 py-2 bg-[#0f0f0f] rounded-lg border border-white/10 text-xs text-gray-400 flex items-center gap-2">
              Filter by: <span className="text-white font-bold">All Items</span>
            </div>
          </div>
        </div>

        {/* Grid GameLog */}
        {viewMode === 'list' ? (
          filteredEntries.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 animate-fade-in">
              {filteredEntries.map(entry => (
                <GameCard key={entry.id} entry={entry} onClick={(entry) => setSelectedEntry(entry)} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-gray-100 border border-purple-500/20 rounded-3xl bg-purple-500/5 shadow-2xl gap-4 px-6 text-center">
              <Gamepad2 size={48} className="text-purple-500" />
              <p className="text-purple-200">Nenhum jogo encontrado.</p>
            </div>
          )
        ) : (
          <StatsView entries={entries} analysis={aiAnalysis} onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
        )}
      </main>
    </>
  );

  return (
    <div className={`min-h-screen ${appMode === 'cine' ? 'bg-[#0a0a0a]' : 'bg-[#050505]'} text-slate-100 pb-24 transition-colors duration-500`}>
      {appMode === 'cine' ? renderCineLog() : renderGameLog()}

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
