import { lazy } from 'react';
import { RouteObject, Navigate } from 'react-router-dom';
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
const Mapa = lazy(() => import('../pages/mapa/page'));
const Notificacoes = lazy(() => import('../pages/notificacoes/page'));
const PrevisaoFalhas = lazy(() => import('../pages/previsao-falhas/page'));
const EstrategicoPecas = lazy(() => import('../pages/estrategico-pecas/page'));
const Pecas = lazy(() => import('../pages/pecas/page'));
const Seguranca = lazy(() => import('../pages/seguranca/page'));
const LeitorPlacas = lazy(() => import('../pages/leitor-placas/page'));
const Planejamento = lazy(() => import('../pages/planejamento/page'));

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
];

export default routes;
