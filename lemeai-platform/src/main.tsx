// ARQUIVO: src/main.tsx

import React from 'react'
import ReactDOM from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

// Importando as páginas
import Login from './pages/Login.tsx';
import Dashboard from './pages/Dashboard.tsx';
import ChatPage from './pages/ChatPage.tsx';
// --- NOVAS IMPORTAÇÕES ---
import UserManagementPage from './pages/UserManagementPage.tsx';
import ProfileManagementPage from './pages/ProfileManagementPage.tsx';
import './index.css'

// Criando as rotas
const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/dashboard",
    element: <Dashboard />,
  },
  {
    path: "/chat",
    element: <ChatPage />,
  },
  // --- NOVAS ROTAS ---
  {
    path: "/users",
    element: <UserManagementPage />,
  },
  {
    path: "/profiles",
    element: <ProfileManagementPage />,
  }
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)