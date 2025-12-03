import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';
import ProtectedRoute from '../components/base/ProtectedRoute';

// Lazy loading das páginas
const Home = lazy(() => import('../pages/home/page'));
const Login = lazy(() => import('../pages/login/page'));
const Dashboard = lazy(() => import('../pages/dashboard/page'));
const DashboardTV = lazy(() => import('../pages/dashboard-tv/page'));
const DashboardExecutivo = lazy(() => import('../pages/dashboard-executivo/page'));
const Equipamentos = lazy(() => import('../pages/equipamentos/page'));
const EquipamentoDetalhes = lazy(() => import('../pages/equipamento-detalhes/page'));
const OrdensServico = lazy(() => import('../pages/ordens-servico/page'));
const Componentes = lazy(() => import('../pages/componentes/page'));
const Servicos = lazy(() => import('../pages/servicos/page'));
const Equipes = lazy(() => import('../pages/equipes/page'));
const Relatorios = lazy(() => import('../pages/relatorios/page'));
const Custos = lazy(() => import('../pages/custos/page'));
const Melhorias = lazy(() => import('../pages/melhorias/page'));
const Panoramas = lazy(() => import('../pages/panoramas/page'));
const Usuarios = lazy(() => import('../pages/usuarios/page'));
const Setores = lazy(() => import('../pages/setores/page'));
const Mapa = lazy(() =>
  import('../pages/mapa/page').catch((err) => {
    // log to console and provide a minimal fallback component so the app doesn't crash
    // when the dynamic import fails (useful during dev when HMR or compile errors occur)
    // eslint-disable-next-line no-console
    console.error('Falha ao carregar módulo /pages/mapa/page:', err);
    return { default: () => <div className="p-6">Erro ao carregar o módulo do mapa. Veja o console para detalhes.</div> };
  })
);
const Notificacoes = lazy(() => import('../pages/notificacoes/page'));
const PrevisaoFalhas = lazy(() => import('../pages/previsao-falhas/page'));
const EstrategicoPecas = lazy(() => import('../pages/estrategico-pecas/page'));
const Pecas = lazy(() => import('../pages/pecas/page'));
const PecasSuprimentos = lazy(() => import('../pages/pecas/suprimentos/page'));
const ComponentesReservas = lazy(() => import('../pages/componentes/reservas/page'));
const Seguranca = lazy(() => import('../pages/seguranca/page'));
const LeitorPlacas = lazy(() => import('../pages/leitor-placas/page'));
const Planejamento = lazy(() => import('../pages/planejamento/page'));
const DebugStorage = lazy(() => import('../pages/_debug/storage/page'));
const MigrateMapImage = lazy(() => import('../pages/_debug/migrate-map-image/page'));

const routes: RouteObject[] = [
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/dashboard-tv',
    element: (
      <ProtectedRoute>
        <DashboardTV />
      </ProtectedRoute>
    ),
  },
  {
    path: '/dashboard-executivo',
    element: (
      <ProtectedRoute>
        <DashboardExecutivo />
      </ProtectedRoute>
    ),
  },
  {
    path: '/equipamentos',
    element: (
      <ProtectedRoute>
        <Equipamentos />
      </ProtectedRoute>
    ),
  },
  {
    path: '/equipamento/:id',
    element: (
      <ProtectedRoute>
        <EquipamentoDetalhes />
      </ProtectedRoute>
    ),
  },
  {
    path: '/equipamento-detalhes',
    element: (
      <ProtectedRoute>
        <EquipamentoDetalhes />
      </ProtectedRoute>
    ),
  },
  {
    path: '/ordens-servico',
    element: (
      <ProtectedRoute>
        <OrdensServico />
      </ProtectedRoute>
    ),
  },
  {
    path: '/componentes',
    element: (
      <ProtectedRoute>
        <Componentes />
      </ProtectedRoute>
    ),
  },
  {
    path: '/servicos',
    element: (
      <ProtectedRoute>
        <Servicos />
      </ProtectedRoute>
    ),
  },
  {
    path: '/equipes',
    element: (
      <ProtectedRoute>
        <Equipes />
      </ProtectedRoute>
    ),
  },
  {
    path: '/relatorios',
    element: (
      <ProtectedRoute>
        <Relatorios />
      </ProtectedRoute>
    ),
  },
  {
    path: '/custos',
    element: (
      <ProtectedRoute>
        <Custos />
      </ProtectedRoute>
    ),
  },
  {
    path: '/melhorias',
    element: (
      <ProtectedRoute>
        <Melhorias />
      </ProtectedRoute>
    ),
  },
  {
    path: '/panoramas',
    element: (
      <ProtectedRoute>
        <Panoramas />
      </ProtectedRoute>
    ),
  },
  {
    path: '/usuarios',
    element: (
      <ProtectedRoute>
        <Usuarios />
      </ProtectedRoute>
    ),
  },
  {
    path: '/mapa',
    element: (
      <ProtectedRoute>
        <Mapa />
      </ProtectedRoute>
    ),
  },
  {
    path: '/setores',
    element: (
      <ProtectedRoute>
        <Setores />
      </ProtectedRoute>
    ),
  },
  {
    path: '/pecas',
    element: (
      <ProtectedRoute>
        <Pecas />
      </ProtectedRoute>
    ),
  },
  {
    path: '/pecas/suprimentos',
    element: (
      <ProtectedRoute>
        <PecasSuprimentos />
      </ProtectedRoute>
    ),
  },
  {
    path: '/notificacoes',
    element: (
      <ProtectedRoute>
        <Notificacoes />
      </ProtectedRoute>
    ),
  },
  {
    path: '/previsao-falhas',
    element: (
      <ProtectedRoute>
        <PrevisaoFalhas />
      </ProtectedRoute>
    ),
  },
  {
    path: '/componentes/reservas',
    element: (
      <ProtectedRoute>
        <ComponentesReservas />
      </ProtectedRoute>
    ),
  },
  {
    path: '/estrategico-pecas',
    element: (
      <ProtectedRoute>
        <EstrategicoPecas />
      </ProtectedRoute>
    ),
  },
  {
    path: '/seguranca',
    element: (
      <ProtectedRoute>
        <Seguranca />
      </ProtectedRoute>
    ),
  },
  {
    path: '/leitor-placas',
    element: (
      <ProtectedRoute>
        <LeitorPlacas />
      </ProtectedRoute>
    ),
  },
  {
    path: '/planejamento',
    element: (
      <ProtectedRoute>
        <Planejamento />
      </ProtectedRoute>
    ),
  },
  {
    path: '/_debug/storage',
    element: <DebugStorage />,
  },
  {
    path: '/_debug/migrate-map-image',
    element: <MigrateMapImage />,
  },
];

export default routes;
