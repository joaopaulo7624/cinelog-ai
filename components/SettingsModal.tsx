import React from 'react';
import { X, LogOut, User, Database, HardDrive, AlertTriangle, Trash2 } from 'lucide-react';
import { WatchEntry } from '../types';
import { supabase } from '../services/supabaseClient';
import { exportBackup } from '../services/storageService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: WatchEntry[];
  userEmail: string | undefined;
  onClear: () => void; // Mantido para limpar estado local, se necessário
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, onClose, entries, userEmail, onClear 
}) => {
  if (!isOpen) return null;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onClose();
  };

  const handleExport = () => {
    // Exportar backup continua útil mesmo com nuvem
    exportBackup(entries, null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#1A1A1A] border border-gray-800 w-full max-w-md rounded-xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-800 bg-[#1A1A1A]">
           <h2 className="text-xl font-bold text-white flex items-center gap-2">
             <User className="text-primary-600" size={20} />
             Minha Conta
           </h2>
           <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
           </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          <div className="flex items-center gap-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
            <div className="bg-primary-600/20 p-3 rounded-full text-primary-500">
              <User size={24} />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold">Logado como</p>
              <p className="text-white font-medium truncate">{userEmail || 'Usuário'}</p>
            </div>
          </div>

          <div className="bg-green-900/20 border border-green-900/50 p-4 rounded-lg">
            <h3 className="text-green-200 font-bold text-sm mb-1 flex items-center gap-2">
              <Database size={14} /> Sincronização Ativa
            </h3>
            <p className="text-green-200/70 text-xs leading-relaxed">
              Seus {entries.length} títulos estão salvos com segurança no Supabase.
            </p>
          </div>

          <div className="space-y-3 pt-2">
             <button 
                onClick={handleExport}
                className="w-full flex items-center justify-between bg-gray-800 hover:bg-gray-700 text-white p-4 rounded-lg transition-all border border-gray-700 group"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-blue-900/30 p-2 rounded-md text-blue-400 group-hover:text-blue-300">
                    <HardDrive size={20} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-sm">Exportar JSON</p>
                    <p className="text-xs text-gray-400">Baixar cópia local dos dados</p>
                  </div>
                </div>
              </button>

            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-red-900/20 hover:text-red-400 text-gray-300 p-4 rounded-lg transition-all border border-gray-700 mt-4"
            >
              <LogOut size={18} />
              Sair da Conta
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default SettingsModal;