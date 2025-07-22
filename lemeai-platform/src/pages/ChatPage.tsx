import ContactList from '../components/ContactList';
import ConversationWindow from '../components/ConversationWindow';
import MessageInput from '../components/MessageInput';
import Sidebar from '../components/Sidebar'; // Usamos o Sidebar aqui também
import { useNavigate } from 'react-router-dom';
import './ChatPage.css';

const ChatPage = () => {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  return (
    <div className="dashboard-layout"> {/* Reutilizando o layout principal */}
      <Sidebar onLogout={handleLogout} />
      <main className="main-content" style={{ padding: 0 }}> {/* Removemos o padding padrão */}
        <div className="chat-layout">
          <ContactList />
          <div className="conversation-area">
            <ConversationWindow />
            <MessageInput />
          </div>
        </div>
      </main>
    </div>
  );
};

export default ChatPage;