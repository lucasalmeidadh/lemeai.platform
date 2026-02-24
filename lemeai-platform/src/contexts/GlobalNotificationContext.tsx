import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import hubService from '../hub/HubConnectionService';
import { apiFetch } from '../services/api';

const apiUrl = import.meta.env.VITE_API_URL;

interface GlobalNotificationContextData {
  isHubConnected: boolean;
  unreadCount: number;
  clearUnreadCount: () => void;
  initializeConnection: () => Promise<void>;
}

const GlobalNotificationContext = createContext<GlobalNotificationContextData>({
  isHubConnected: false,
  unreadCount: 0,
  clearUnreadCount: () => { },
  initializeConnection: async () => { },
});

export const useGlobalNotification = () => useContext(GlobalNotificationContext);

export const GlobalNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isHubConnected, setIsHubConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const clearUnreadCount = useCallback(() => {
    setUnreadCount(0);
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await apiFetch(`${apiUrl}/api/Auth/me`);
      if (response.ok) {
        const result = await response.json();
        // API returns the user object directly or a wrapped response
        if (result.sucesso && result.dados) {
          const userId = result.dados.id || result.dados.userId || 0;
          setCurrentUserId(userId);
        } else if (result.id) {
          const userId = Number(result.id) || 0;
          setCurrentUserId(userId);
        }
      }
    } catch (err) {
      console.error("Erro ao buscar usuário logado (GlobalNotificationContext):", err);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const handleGlobalNewMessage = useCallback((newMessage: any) => {
    // Only play sound if the message is from someone else (client or ia, if it makes sense)
    // usually: 0 = Cliente, 1 = Vendedor, 2 = IA
    // If we only want to be notified when the client speaks:
    if (newMessage.origemMensagem === 0) {

      // Only increment counter if we are NOT on the chat page.
      const isChatPage = window.location.pathname.includes('/chat');

      if (!isChatPage) {
        setUnreadCount(prev => prev + 1);

        try {
          const audio = new Audio('/notification.mp3');
          audio.play().catch(e => {
            console.warn("O navegador bloqueou o autoplay. O usuário precisa interagir com a página primeiro.", e);
          });
        } catch (err) {
          console.error("Erro ao reproduzir som de notificação:", err);
        }
      }
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Only connect globally if we have a user logged in
    const setupGlobalHub = async () => {
      if (currentUserId) {
        try {
          await hubService.startConnection();
          if (isMounted) {
            setIsHubConnected(true);
            hubService.on('ReceiveNewMessage', handleGlobalNewMessage);
            console.log("Global Hub Connection established. Listening for notifications.");
          }
        } catch (e) {
          console.error("Falha na configuração do Hub Global", e);
        }
      }
    };

    setupGlobalHub();

    return () => {
      isMounted = false;
      hubService.off('ReceiveNewMessage', handleGlobalNewMessage);
    };
  }, [currentUserId, handleGlobalNewMessage]);

  const initializeConnection = useCallback(async () => {
    await fetchCurrentUser();
  }, [fetchCurrentUser]);

  return (
    <GlobalNotificationContext.Provider value={{ isHubConnected, unreadCount, clearUnreadCount, initializeConnection }}>
      {children}
    </GlobalNotificationContext.Provider>
  );
};
