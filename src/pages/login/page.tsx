
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn, user, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [logo, setLogo] = useState<string | null>(null);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    const savedLogo = localStorage.getItem('company_logo');
    if (savedLogo) {
      setLogo(savedLogo);
    }
  }, []);

  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await signIn(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Erro ao fazer login:', err);
      setError('Email ou senha incorretos. Verifique suas credenciais ou redefina sua senha.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setResetSuccess(true);
      setTimeout(() => {
        setShowResetPassword(false);
        setResetSuccess(false);
        setResetEmail('');
      }, 5000);
    } catch (err: any) {
      console.error('Erro ao enviar email:', err);
      setError('Erro ao enviar email de recuperação. Tente novamente.');
    } finally {
      setResetLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
          {/* Logo */}
          <div className="text-center mb-8">
            {logo ? (
              <img
                src={logo}
                alt="Logo da Empresa"
                className="h-16 mx-auto mb-4 object-contain"
              />
            ) : (
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl mx-auto mb-4 flex items-center justify-center">
                <i className="ri-settings-3-line text-3xl text-white"></i>
              </div>
            )}
            <h1 className="text-3xl font-bold text-white mb-2">
              Sistema de Manutenção
            </h1>
            <p className="text-slate-300">
              {showResetPassword ? 'Recuperar Senha' : 'Faça login para acessar o sistema'}
            </p>
          </div>

          {/* Formulário de Reset de Senha */}
          {showResetPassword ? (
            <form onSubmit={handleResetPassword} className="space-y-6">
              {resetSuccess && (
                <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3 text-green-200 text-sm">
                  <i className="ri-check-line mr-2"></i>
                  Email de recuperação enviado! Verifique sua caixa de entrada.
                </div>
              )}

              {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email cadastrado
                </label>
                <div className="relative">
                  <i className="ri-mail-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={resetLoading}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-3 rounded-lg font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
              >
                {resetLoading ? (
                  <>
                    <i className="ri-loader-4-line animate-spin"></i>
                    Enviando...
                  </>
                ) : (
                  <>
                    <i className="ri-mail-send-line"></i>
                    Enviar Email de Recuperação
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowResetPassword(false);
                  setError('');
                  setResetEmail('');
                }}
                className="w-full text-slate-300 hover:text-white transition-colors text-sm whitespace-nowrap"
              >
                <i className="ri-arrow-left-line mr-1"></i>
                Voltar para o login
              </button>
            </form>
          ) : (
            // Formulário de Login
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email
                </label>
                <div className="relative">
                  <i className="ri-mail-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Senha
                </label>
                <div className="relative">
                  <i className="ri-lock-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setShowResetPassword(true)}
                  className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors whitespace-nowrap"
                >
                  Esqueceu sua senha?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-3 rounded-lg font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
              >
                {isLoading ? (
                  <>
                    <i className="ri-loader-4-line animate-spin"></i>
                    Entrando...
                  </>
                ) : (
                  <>
                    <i className="ri-login-box-line"></i>
                    Entrar
                  </>
                )}
              </button>
            </form>
          )}

          {/* Informações de ajuda */}
          <div className="mt-6 p-4 bg-blue-500/20 border border-blue-500/50 rounded-lg">
            <p className="text-xs text-blue-200 text-center">
              <i className="ri-information-line mr-1"></i>
              {showResetPassword 
                ? 'Você receberá um email com instruções para redefinir sua senha'
                : 'Problemas para acessar? Use a opção "Esqueceu sua senha?"'
              }
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-slate-400 text-sm">
          <p>© 2024 Sistema de Manutenção Industrial</p>
        </div>
      </div>
    </div>
  );
}
