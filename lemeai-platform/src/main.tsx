import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import App from './App.tsx';
import MainLayout from './components/MainLayout.tsx';

import Login from './pages/Login.tsx';
import Dashboard from './pages/Dashboard.tsx';
import ContactsPage from './pages/ContactsPage.tsx';
import PipelinePage from './pages/PipelinePage.tsx';
import ChatPage from './pages/ChatPage.tsx';
import UserManagementPage from './pages/UserManagementPage.tsx';
// import ProfileManagementPage from './pages/ProfileManagementPage.tsx';
import SystemPromptsPage from './pages/SystemPromptsPage.tsx';
import ProductsPage from './pages/ProductsPage.tsx';
import ConnectionsPage from './pages/ConnectionsPage.tsx';
import './index.css';
import NotFoundPage from './pages/NotFoundPage.tsx';
import AgendaPage from './pages/AgendaPage.tsx';
import AnalyticsPage from './pages/AnalyticsPage.tsx';
import ChatDashboard from './pages/ChatDashboard.tsx';
import HelpPage from './pages/HelpPage.tsx';
import OnboardingStepsPage from './pages/OnboardingStepsPage.tsx';
import CampaignTemplatesPage from './pages/CampaignTemplatesPage.tsx';
import CampaignPage from './pages/CampaignPage.tsx';
import GoalsPage from './pages/GoalsPage.tsx';
import TeamsPage from './pages/TeamsPage.tsx';
import DealDetailsPage from './pages/DealDetailsPage.tsx';
import BillingPlanPage from './pages/BillingPlanPage';

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { path: "/", element: <Login /> },
      { path: "login", element: <Login /> },
      {
        element: <MainLayout />,
        children: [
          { path: "primeiros-passos", element: <OnboardingStepsPage /> },
          { path: "chat", element: <ChatPage /> },
          { path: "dashboard", element: <Dashboard /> },
          { path: "monitoramento", element: <ChatDashboard /> },
          { path: "pipeline", element: <PipelinePage /> },
          { path: "pipeline/deal/:id", element: <DealDetailsPage /> },
          { path: "analytics", element: <AnalyticsPage /> },
          { path: "contacts", element: <ContactsPage /> },
          { path: "agenda", element: <AgendaPage /> },
          { path: "users", element: <UserManagementPage /> },
          // { path: "profiles", element: <ProfileManagementPage /> },
          { path: "chat-rules", element: <SystemPromptsPage /> },
          { path: "products", element: <ProductsPage /> },
          { path: "connections", element: <ConnectionsPage /> },
          { path: "equipes", element: <TeamsPage /> },
          { path: "metas", element: <GoalsPage /> },
          { path: "campaign-templates", element: <CampaignTemplatesPage /> },
          { path: "campanhas", element: <CampaignPage /> },
          { path: "plano", element: <BillingPlanPage /> },
          { path: "help", element: <HelpPage /> },
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