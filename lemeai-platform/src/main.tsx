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
import CampaignsPage from './pages/CampaignsPage.tsx';
import QuickRepliesPage from './pages/QuickRepliesPage.tsx';
import InsightsPage from './pages/InsightsPage.tsx';
import ProductsPage from './pages/ProductsPage.tsx';
import CalendarPage from './pages/CalendarPage.tsx';
import './index.css';
import NotFoundPage from './pages/NotFoundPage.tsx';
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
          { path: "chat", element: <ChatPage /> },
          { path: "insights", element: <InsightsPage /> },
          { path: "campaigns", element: <CampaignsPage /> },
          { path: "dashboard", element: <Dashboard /> },
          { path: "pipeline", element: <PipelinePage /> },
          { path: "contacts", element: <ContactsPage /> },
          { path: "users", element: <UserManagementPage /> },
          // { path: "profiles", element: <ProfileManagementPage /> },
          { path: "chat-rules", element: <SystemPromptsPage /> },
          { path: "quick-replies", element: <QuickRepliesPage /> },
          { path: "products", element: <ProductsPage /> },
          { path: "calendar", element: <CalendarPage /> },
        ]
      },
      { path: "*", element: <NotFoundPage /> }
    ]
  }
]);

import { ThemeProvider } from './contexts/ThemeContext.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <RouterProvider router={router} />
  </ThemeProvider>
);