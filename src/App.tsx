import { BrowserRouter } from "react-router-dom";
import { Suspense } from "react";
import { AppRoutes } from "./router";
import { AuthProvider } from "./contexts/AuthContext";
import ErrorBoundary from "./components/base/ErrorBoundary";
import { ToastProvider } from "./hooks/useToast";

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter basename={import.meta.env.BASE_URL || "/"}>
            <Suspense
              fallback={
                <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mb-4"></div>
                    <p className="text-gray-400 text-lg">
                      Carregando página...
                    </p>
                    <p className="text-gray-600 text-sm mt-2">
                      Aguarde um momento
                    </p>
                  </div>
                </div>
              }
            >
              <AppRoutes />
            </Suspense>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
