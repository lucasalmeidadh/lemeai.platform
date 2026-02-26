import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
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
  const previousTotalUnreadRef = useRef(0);
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
  // Fetches /api/Chat/ConversasPorVendedor periodically to check for new messages
  useEffect(() => {
    let isMounted = true;
    let pollInterval: number | null = null;

    const checkUnreadMessages = async () => {
      if (!currentUserId) return;

      try {
        const response = await apiFetch(`${apiUrl}/api/Chat/ConversasPorVendedor`);
        if (!response.ok) return;

        const result = await response.json();
        if (result.sucesso && Array.isArray(result.dados)) {
          // Calculate the sum of all unread messages
          const currentTotalUnread = result.dados.reduce((sum: number, convo: any) => sum + (convo.totalNaoLidas || 0), 0);

          if (isMounted) {
            // Check if we are outside the chat page
            const isChatPage = window.location.pathname.includes('/chat');

            // If we are getting MORE unread messages than we had before
            if (currentTotalUnread > previousTotalUnreadRef.current && !isChatPage) {
              setUnreadCount(currentTotalUnread);

              const audio = new Audio('/notification.mp3');
              audio.play().catch(e => console.warn("Autoplay bloqueou som.", e));
            }

            // Always reset unread if we are on the chat page, otherwise use current
            if (isChatPage) {
              setUnreadCount(0);
              // But still update the ref so we know our new "baseline"
            }

            previousTotalUnreadRef.current = currentTotalUnread;
          }
        }
      } catch (err) {
        // Silently fail if polling fails (network issue, etc)
      }
    };

    if (currentUserId) {
      checkUnreadMessages();
      pollInterval = window.setInterval(checkUnreadMessages, 15000);
    }

    return () => {
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [currentUserId]);

  const initializeConnection = useCallback(async () => {
    await fetchCurrentUser();
  }, [fetchCurrentUser]);

  return (
    <GlobalNotificationContext.Provider value={{ isHubConnected, unreadCount, clearUnreadCount, initializeConnection }}>
      {children}
    </GlobalNotificationContext.Provider>
  );
};
