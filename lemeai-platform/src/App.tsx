import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import GlobalChatWidget from './components/GlobalChatWidget';

function App() {
  return (
    <>
      { }
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />

      { }
      <Outlet />

      <GlobalChatWidget />
    </>
  );
}

export default App;