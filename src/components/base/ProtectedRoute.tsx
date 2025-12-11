import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Permission } from '../../hooks/usePermissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: Permission[];
}

export default function ProtectedRoute({ children, requiredPermission }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  // Dev bypass: set VITE_BYPASS_AUTH=true in your `.env` to skip auth locally
  const bypass = import.meta.env.VITE_BYPASS_AUTH === 'true';
  if (bypass) {
    console.log('⚠️ ProtectedRoute: auth bypass enabled (VITE_BYPASS_AUTH=true) — rendering children in dev');
  }

  console.log('🔐 ProtectedRoute:', { user: !!user, loading });

  if (loading) {
    console.log('⏳ ProtectedRoute: Carregando autenticação...');
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!user && !bypass) {
    console.log('❌ ProtectedRoute: Usuário não autenticado, redirecionando para login');
    return <Navigate to="/login" replace />;
  }

  console.log('✅ ProtectedRoute: Usuário autenticado, renderizando página');

  if (requiredPermission) {
    const userPermission = bypass ? 'admin' : user.user_metadata?.permission || 'visitante';
    if (!requiredPermission.includes(userPermission as Permission)) {
      console.log('❌ ProtectedRoute: Permissão negada');
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-xl shadow-lg p-8 max-w-md text-center border border-slate-700">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-error-warning-line text-3xl text-red-500"></i>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Acesso Negado</h2>
            <p className="text-gray-400 mb-6">
              Você não tem permissão para acessar esta página.
            </p>
            <button
              onClick={() => window.history.back()}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors cursor-pointer"
            >
              Voltar
            </button>
          </div>
        </div>
      );
    }
  }

  

  return <>{children}</>;
}
