import React from 'react'
import ReactDOM from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

// Importando todas as nossas páginas
import Login from './pages/Login.tsx';
import Dashboard from './pages/Dashboard.tsx';
import Chatpage from './pages/ChatPage.tsx'; // <-- 1. IMPORTAR A NOVA PÁGINA DE CHAT
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
    path: "/chat", // <-- 2. ADICIONAR A ROTA PARA O CHAT
    element: <Chatpage />,
  }
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)