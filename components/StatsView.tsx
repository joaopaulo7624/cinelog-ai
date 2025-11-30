import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { WatchEntry, MediaType, AIAnalysis } from '../types';
import { BrainCircuit, Film, Tv, Star, Clock, TrendingUp } from 'lucide-react';

interface StatsViewProps {
  entries: WatchEntry[];
  analysis: AIAnalysis | null;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

const COLORS = ['#ff004c', '#00C49F', '#FFBB28', '#FF8042'];
const DARK_BG = '#121212';

const StatsView: React.FC<StatsViewProps> = ({ entries, analysis, onAnalyze, isAnalyzing }) => {

  const stats = useMemo(() => {
    const total = entries.length;
    const movies = entries.filter(e => e.type === MediaType.MOVIE).length;
    const series = entries.filter(e => e.type === MediaType.SERIES).length;

    const ratedEntries = entries.filter(e => e.rating && e.rating > 0);
    const avgRating = ratedEntries.length > 0
      ? (ratedEntries.reduce((acc, curr) => acc + (curr.rating || 0), 0) / ratedEntries.length).toFixed(1)
      : '0.0';

    return { total, movies, series, avgRating };
  }, [entries]);

  const typeData = useMemo(() => {
    const counts: Record<string, number> = {};
    entries.forEach(e => {
      counts[e.type] = (counts[e.type] || 0) + 1;
    });
    return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
  }, [entries]);

  const ratingData = useMemo(() => {
    const counts = [0, 0, 0, 0, 0]; // 1 to 5
    entries.forEach(e => {
      if (e.rating && e.rating >= 1 && e.rating <= 5) {
        counts[e.rating - 1]++;
      }
    });
    return counts.map((count, i) => ({ name: `${i + 1}★`, count }));
  }, [entries]);

  return (
    <div className="space-y-6 animate-fade-in pb-10">

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#1f1f1f] p-5 rounded-2xl border border-white/5 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Film size={64} />
          </div>
          <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Assistido</span>
          <div className="flex items-end gap-2 mt-2">
            <span className="text-3xl font-bold text-white">{stats.total}</span>
            <span className="text-xs text-gray-500 mb-1">títulos</span>
          </div>
        </div>

        <div className="bg-[#1f1f1f] p-5 rounded-2xl border border-white/5 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Tv size={64} />
          </div>
          <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Filmes vs Séries</span>
          <div className="flex items-end gap-3 mt-2">
            <div>
              <span className="text-xl font-bold text-white">{stats.movies}</span>
              <span className="text-[10px] text-gray-500 ml-1">Filmes</span>
            </div>
            <div className="h-4 w-px bg-white/10 mb-1" />
            <div>
              <span className="text-xl font-bold text-white">{stats.series}</span>
              <span className="text-[10px] text-gray-500 ml-1">Séries</span>
            </div>
          </div>
        </div>

        <div className="bg-[#1f1f1f] p-5 rounded-2xl border border-white/5 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Star size={64} />
          </div>
          <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Média de Notas</span>
          <div className="flex items-end gap-2 mt-2">
            <span className="text-3xl font-bold text-amber-400">{stats.avgRating}</span>
            <span className="text-xs text-gray-500 mb-1">/ 5.0</span>
          </div>
        </div>

        <div className="bg-[#1f1f1f] p-5 rounded-2xl border border-white/5 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Clock size={64} />
          </div>
          <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Tempo Total</span>
          <div className="flex items-end gap-2 mt-2">
            <span className="text-3xl font-bold text-indigo-400">
              {analysis ? analysis.totalHoursEstimates : '-'}
            </span>
            <span className="text-xs text-gray-500 mb-1">horas est.</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Charts Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Type Distribution */}
            <div className="bg-[#1f1f1f] p-6 rounded-2xl border border-white/5">
              <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                <TrendingUp size={16} className="text-red-500" /> Distribuição
              </h3>
              <div className="h-56 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={typeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {typeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#121212', borderColor: '#333', borderRadius: '12px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}
                      itemStyle={{ color: '#fff', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Text */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <span className="text-2xl font-bold text-white">{stats.total}</span>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Total</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Ratings Bar Chart */}
            <div className="bg-[#1f1f1f] p-6 rounded-2xl border border-white/5">
              <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                <Star size={16} className="text-amber-400" /> Avaliações
              </h3>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ratingData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      cursor={{ fill: '#ffffff05' }}
                      contentStyle={{ backgroundColor: '#121212', borderColor: '#333', borderRadius: '12px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="count" fill="#ff004c" radius={[4, 4, 0, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* AI Analysis Section */}
        <div className="lg:col-span-1">
          <div className="h-full bg-gradient-to-b from-[#1f1f1f] to-[#121212] p-6 rounded-2xl border border-white/5 relative overflow-hidden flex flex-col">

            <div className="flex justify-between items-start mb-6 relative z-10">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <BrainCircuit className="text-indigo-400" /> CineLog AI
                </h3>
                <p className="text-gray-500 text-xs mt-1">Análise inteligente do seu perfil.</p>
              </div>
            </div>

            {analysis ? (
              <div className="space-y-6 animate-slide-up relative z-10 flex-1 flex flex-col">

                <div className="bg-indigo-500/10 p-4 rounded-xl border border-indigo-500/20">
                  <span className="text-[10px] uppercase text-indigo-300 font-bold tracking-wider mb-1 block">Gênero Favorito</span>
                  <p className="text-xl text-white font-bold">{analysis.favoriteGenre}</p>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Seu Perfil</span>
                  <p className="text-gray-300 text-sm leading-relaxed italic">
                    "{analysis.personalityProfile}"
                  </p>
                </div>

                <div className="mt-auto pt-4">
                  <span className="text-[10px] uppercase text-gray-500 font-bold tracking-wider block mb-3">Recomendações</span>
                  <div className="flex flex-wrap gap-2">
                    {analysis.recommendations.slice(0, 3).map((rec, i) => (
                      <span key={i} className="px-3 py-1.5 bg-[#2a2a2a] text-gray-200 border border-white/5 rounded-lg text-xs hover:bg-[#333] transition-colors cursor-default">
                        {rec}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={onAnalyze}
                  disabled={isAnalyzing}
                  className="w-full mt-4 bg-white/5 hover:bg-white/10 text-gray-300 text-xs py-3 rounded-xl transition-all border border-white/5"
                >
                  {isAnalyzing ? "Atualizando..." : "Atualizar Análise"}
                </button>

              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center relative z-10 space-y-4 p-4">
                <div className="bg-indigo-500/10 p-4 rounded-full">
                  <BrainCircuit size={32} className="text-indigo-400" />
                </div>
                <div>
                  <p className="text-white font-bold mb-1">Descubra seu perfil</p>
                  <p className="text-gray-500 text-xs max-w-[200px] mx-auto">
                    A IA analisará seus filmes assistidos para gerar insights e recomendações.
                  </p>
                </div>
                <button
                  onClick={onAnalyze}
                  disabled={isAnalyzing || entries.length === 0}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-900/20 w-full"
                >
                  {isAnalyzing ? "Analisando..." : "Gerar Análise Agora"}
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default StatsView;