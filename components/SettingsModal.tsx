import React, { useState, useEffect } from 'react';
import { X, User, Database, Download, LogOut, CheckCircle2 } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { databaseService } from '../services/databaseService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  totalEntries: number;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, userEmail, totalEntries }) => {
  const [isExporting, setIsExporting] = useState(false);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (isOpen && !target.closest('.settings-dropdown') && !target.closest('.profile-trigger')) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = await databaseService.fetchEntries();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cinelog-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao exportar:', error);
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-20 right-6 z-50 w-[400px] settings-dropdown animate-in slide-in-from-top-2 fade-in duration-200">
      <div className="bg-[#0f0f0f] rounded-3xl border border-white/10 shadow-2xl overflow-hidden p-6 flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <User size={20} className="text-red-500" /> Minha Conta
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* User Info Card */}
        <div className="bg-[#1a1a1a] rounded-2xl p-4 flex items-center gap-4 border border-white/5">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 shrink-0">
            <User size={24} className="text-red-500" />
          </div>
          <div className="overflow-hidden">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Logado como</p>
            <p className="text-sm font-medium text-white truncate" title={userEmail}>
              {userEmail || 'Usuário'}
            </p>
          </div>
        </div>

        {/* Sync Status (Green Box) */}
        <div className="bg-[#0f291e] rounded-2xl p-4 border border-emerald-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Database size={16} className="text-emerald-400" />
            <span className="text-emerald-400 font-bold text-sm">Sincronização Ativa</span>
          </div>
          <p className="text-xs text-emerald-100/70 leading-relaxed">
            Seus <strong className="text-white">{totalEntries} títulos</strong> estão salvos com segurança no Supabase.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full bg-[#1a1a1a] hover:bg-[#252525] text-white p-4 rounded-2xl border border-white/5 flex items-center gap-4 transition-all group text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
              <Download size={20} />
            </div>
            <div>
              <span className="block font-bold text-sm">Exportar JSON</span>
              <span className="text-xs text-gray-500">Baixar cópia local dos dados</span>
            </div>
          </button>

          <button
            onClick={handleLogout}
            className="w-full bg-transparent hover:bg-white/5 text-gray-400 hover:text-white p-4 rounded-2xl border border-white/5 flex items-center justify-center gap-2 transition-all mt-2 font-medium text-sm"
          >
            <LogOut size={16} /> Sair da Conta
          </button>
        </div>

      </div>
    </div>
  );
};

export default SettingsModal;