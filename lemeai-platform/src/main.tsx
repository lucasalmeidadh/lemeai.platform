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
          { path: "dashboard", element: <Dashboard /> },
          { path: "pipeline", element: <PipelinePage /> },
          { path: "contacts", element: <ContactsPage /> },
          { path: "users", element: <UserManagementPage /> },
          // { path: "profiles", element: <ProfileManagementPage /> },
          { path: "chat-rules", element: <SystemPromptsPage /> },
          { path: "products", element: <ProductsPage /> },
        ]
      },
      { path: "*", element: <NotFoundPage /> }
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <RouterProvider router={router} />
);