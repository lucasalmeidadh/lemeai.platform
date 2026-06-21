import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from './App.tsx';
import PermissionGuard from './components/PermissionGuard.tsx';
import MainLayout from './components/MainLayout.tsx';
import Login from './pages/Login.tsx';
import Dashboard from './pages/Dashboard.tsx';
import ContactsPage from './pages/ContactsPage.tsx';
import PipelinePage from './pages/PipelinePage.tsx';
import ChatPage from './pages/ChatPage.tsx';
import UserManagementPage from './pages/UserManagementPage.tsx';
import ProfileManagementPage from './pages/ProfileManagementPage.tsx';
import SystemPromptsPage from './pages/SystemPromptsPage.tsx';
import ProductsPage from './pages/ProductsPage.tsx';
import ConnectionsPage from './pages/ConnectionsPage.tsx';
import './index.css';
import NotFoundPage from './pages/NotFoundPage.tsx';
import AgendaPage from './pages/AgendaPage.tsx';
import ChatDashboard from './pages/ChatDashboard.tsx';
import HelpPage from './pages/HelpPage.tsx';
import OnboardingStepsPage from './pages/OnboardingStepsPage.tsx';
import CampaignTemplatesPage from './pages/CampaignTemplatesPage.tsx';
import CampaignPage from './pages/CampaignPage.tsx';
import GoalsPage from './pages/GoalsPage.tsx';
import TeamsPage from './pages/TeamsPage.tsx';
import DealDetailsPage from './pages/DealDetailsPage.tsx';
import BillingPlanPage from './pages/BillingPlanPage';
import EmpresasPage from './pages/EmpresasPage';
import GerenciarEmpresaPage from './pages/GerenciarEmpresaPage.tsx';
import PlanManagementPage from './pages/PlanManagementPage';
import NovidadesPage from './pages/NovidadesPage.tsx';
import ReportsPage from './pages/ReportsPage.tsx';
import CampaignReportsPage from './pages/CampaignReportsPage.tsx';
import CamposPersonalizadosPage from './pages/CamposPersonalizadosPage.tsx';
import GoogleCalendarCallbackPage from './pages/GoogleCalendarCallbackPage.tsx';

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { path: "/", element: <Login /> },
      { path: "login", element: <Login /> },
      { path: "integracoes/google/callback", element: <GoogleCalendarCallbackPage /> },
      {
        element: <MainLayout />,
        children: [
          { path: "primeiros-passos", element: <OnboardingStepsPage /> },
          { path: "plano", element: <BillingPlanPage /> },
          { path: "help", element: <HelpPage /> },
          { path: "novidades", element: <NovidadesPage /> },
          { path: "chat", element: <PermissionGuard><ChatPage /></PermissionGuard> },
          { path: "dashboard", element: <PermissionGuard><Dashboard /></PermissionGuard> },
          { path: "monitoramento", element: <PermissionGuard><ChatDashboard /></PermissionGuard> },
          { path: "pipeline", element: <PermissionGuard><PipelinePage /></PermissionGuard> },
          { path: "pipeline/deal/:id", element: <PermissionGuard><DealDetailsPage /></PermissionGuard> },
          { path: "contacts", element: <PermissionGuard><ContactsPage /></PermissionGuard> },
          { path: "agenda", element: <PermissionGuard><AgendaPage /></PermissionGuard> },
          { path: "relatorios/vendas", element: <PermissionGuard><ReportsPage /></PermissionGuard> },
          { path: "relatorios/campanhas", element: <PermissionGuard><CampaignReportsPage /></PermissionGuard> },
          { path: "users", element: <PermissionGuard><UserManagementPage /></PermissionGuard> },
          { path: "profiles", element: <PermissionGuard><ProfileManagementPage /></PermissionGuard> },
          { path: "chat-rules", element: <PermissionGuard><SystemPromptsPage /></PermissionGuard> },
          { path: "products", element: <PermissionGuard><ProductsPage /></PermissionGuard> },
          { path: "connections", element: <PermissionGuard><ConnectionsPage /></PermissionGuard> },
          { path: "equipes", element: <PermissionGuard><TeamsPage /></PermissionGuard> },
          { path: "metas", element: <PermissionGuard><GoalsPage /></PermissionGuard> },
          { path: "campaign-templates", element: <PermissionGuard><CampaignTemplatesPage /></PermissionGuard> },
          { path: "campanhas", element: <PermissionGuard><CampaignPage /></PermissionGuard> },
          { path: "empresas", element: <PermissionGuard><EmpresasPage /></PermissionGuard> },
          { path: "gerenciar-empresa", element: <PermissionGuard><GerenciarEmpresaPage /></PermissionGuard> },
          { path: "gerenciar-planos", element: <PermissionGuard><PlanManagementPage /></PermissionGuard> },
          { path: "campos-personalizados", element: <PermissionGuard><CamposPersonalizadosPage /></PermissionGuard> },
        ]
      },
      { path: "*", element: <NotFoundPage /> }
    ]
  }
]);

import { ThemeProvider } from './contexts/ThemeContext.tsx';
import { OnboardingProvider } from './contexts/OnboardingContext.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <OnboardingProvider>
      <RouterProvider router={router} />
    </OnboardingProvider>
  </ThemeProvider>
);