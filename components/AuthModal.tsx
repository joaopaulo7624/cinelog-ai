import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Loader2, LogIn, UserPlus, AlertCircle, Film } from 'lucide-react';

const AuthModal: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        alert("Conta criada! Verifique seu email ou faça login (se a confirmação de email estiver desativada no Supabase).");
      }
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro na autenticação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div className="w-full max-w-md bg-[#1A1A1A] border border-gray-800 rounded-2xl shadow-2xl p-8">
        
        <div className="flex flex-col items-center mb-8">
          <div className="text-primary-600 mb-4">
            <Film size={48} />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tighter mb-2">
            CINE<span className="text-primary-600">LOG</span>
          </h1>
          <p className="text-gray-400 text-sm text-center">
            Salve seus filmes e séries favoritos na nuvem.
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {error && (
            <div className="bg-red-900/20 border border-red-800 p-3 rounded-lg flex items-center gap-2 text-red-200 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-primary-600 focus:border-transparent outline-none transition-all"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Senha</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-primary-600 focus:border-transparent outline-none transition-all"
              placeholder="••••••••"
              minLength={6}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-primary-900/20 transition-all transform active:scale-95 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                {isLogin ? <LogIn size={18} /> : <UserPlus size={18} />}
                {isLogin ? 'Entrar' : 'Criar Conta'}
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-gray-400 hover:text-white hover:underline transition-colors"
          >
            {isLogin ? "Não tem uma conta? Cadastre-se" : "Já tem uma conta? Entre"}
          </button>
        </div>

      </div>
    </div>
  );
};

export default AuthModal;