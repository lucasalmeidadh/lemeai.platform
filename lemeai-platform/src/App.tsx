// ARQUIVO: src/App.tsx

import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <>
      {/* O Toaster é o componente que renderiza as notificações.
          Ele fica aqui na raiz e funciona em qualquer lugar da aplicação. */}
      <Toaster 
        position="top-right" // Posição das notificações
        toastOptions={{
          duration: 4000, // Duração de 4 segundos
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
      
      {/* O Outlet renderiza a rota filha correspondente (Login, Dashboard, etc.) */}
      <Outlet />
    </>
  );
}

export default App;