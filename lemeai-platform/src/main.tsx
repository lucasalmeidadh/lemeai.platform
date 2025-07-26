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
// CORREÇÃO: Importar como ChatPage (com 'P' maiúsculo)
import ChatPage from './pages/ChatPage.tsx';
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
    // CORREÇÃO: Usar o componente com 'P' maiúsculo
    element: <ChatPage />,
  }
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)