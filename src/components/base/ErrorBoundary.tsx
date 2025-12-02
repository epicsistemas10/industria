import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary capturou erro:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-xl shadow-2xl p-8 max-w-2xl w-full border border-red-500/20">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                <i className="ri-error-warning-line text-3xl text-red-500"></i>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Erro ao Carregar Página</h2>
                <p className="text-gray-400">Algo deu errado. Veja os detalhes abaixo:</p>
              </div>
            </div>

            <div className="bg-slate-900 rounded-lg p-4 mb-4 border border-slate-700">
              <h3 className="text-red-400 font-semibold mb-2">Mensagem de Erro:</h3>
              <p className="text-gray-300 font-mono text-sm break-all">
                {this.state.error?.toString()}
              </p>
            </div>

            {this.state.errorInfo && (
              <div className="bg-slate-900 rounded-lg p-4 mb-6 border border-slate-700 max-h-64 overflow-auto">
                <h3 className="text-yellow-400 font-semibold mb-2">Stack Trace:</h3>
                <pre className="text-gray-400 text-xs font-mono whitespace-pre-wrap">
                  {this.state.errorInfo.componentStack}
                </pre>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-semibold cursor-pointer whitespace-nowrap"
              >
                <i className="ri-refresh-line mr-2"></i>
                Recarregar Página
              </button>
              <button
                onClick={() => window.history.back()}
                className="flex-1 px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all font-semibold cursor-pointer whitespace-nowrap"
              >
                <i className="ri-arrow-left-line mr-2"></i>
                Voltar
              </button>
            </div>

            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-blue-400 text-sm">
                <i className="ri-information-line mr-2"></i>
                <strong>Dica:</strong> Copie a mensagem de erro acima e compartilhe com o suporte para resolução mais rápida.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
