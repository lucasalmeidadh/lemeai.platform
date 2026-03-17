import { useState, useEffect, useRef } from 'react';
import { FaPaperPlane, FaPlay, FaUndo, FaRobot, FaUser } from 'react-icons/fa';
import toast from 'react-hot-toast';
import './TestAgentChat.css';
import { AgentTesterService } from '../services/AgentTesterService';
import hubService from '../hub/HubConnectionService';
import { useGlobalNotification } from '../contexts/GlobalNotificationContext';

interface TestMessage {
    id: string;
    text: string;
    sender: 'user' | 'agent';
    timestamp: Date;
}

export const TestAgentChat = () => {
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<TestMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isSessionStarting, setIsSessionStarting] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { isHubConnected } = useGlobalNotification();

    // Auto-scroll para a última mensagem sem puxar a tela principal
    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    // Handle SignalR connection and messages
    useEffect(() => {
        const handleNewMessage = (sessionIdResponse: string, message: string) => {
            if (sessionIdResponse === sessionId) {
                setIsTyping(false);
                const newMessage: TestMessage = {
                    id: Date.now().toString(),
                    text: message,
                    sender: 'agent',
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, newMessage]);
            }
        };

        if (isHubConnected && sessionId) {
            hubService.on('ReceiveTestMessage', handleNewMessage);

            // Entra no grupo (Comentado para teste via HTTP)
            // console.log(`[TestAgentChat] Entrando no grupo: ${sessionId}`);
            // hubService.invoke('JoinTestGroup', sessionId)
            //     .catch(err => console.error('Erro ao entrar no grupo de teste:', err));

            return () => {
                hubService.off('ReceiveTestMessage', handleNewMessage);
                // console.log(`[TestAgentChat] Saindo do grupo: ${sessionId}`);
                // hubService.invoke('LeaveTestGroup', sessionId)
                //     .catch(err => console.error('Erro ao sair do grupo de teste:', err));
            };
        }
    }, [isHubConnected, sessionId]);


    const handleStartSession = async () => {
        setIsSessionStarting(true);
        try {
            const response = await AgentTesterService.startSession();
            if (response.sessionId) {
                setSessionId(response.sessionId);
                setMessages([
                    {
                        id: 'welcome',
                        text: response.mensagem || 'Sessão de teste iniciada! Como posso ajudar?',
                        sender: 'agent',
                        timestamp: new Date()
                    }
                ]);
                toast.success('Sessão de teste iniciada.');
            } else {
                toast.error(response.mensagem || 'Falha ao iniciar sessão.');
            }
        } catch (error: any) {
            toast.error(error.message || 'Erro de comunicação ao iniciar testes.');
        } finally {
            setIsSessionStarting(false);
        }
    };

    const handleResetSession = async () => {
        if (!sessionId) return;
        try {
            await AgentTesterService.resetSession({ sessionId });
            setSessionId(null);
            setMessages([]);
            toast.success('Sessão resetada.');
        } catch (error: any) {
            toast.error(error.message || 'Erro ao resetar sessão.');
        }
    };

    const handleSendMessage = async () => {
        if (!inputValue.trim() || !sessionId) return;

        const currentInput = inputValue;
        setInputValue('');

        const userMessage: TestMessage = {
            id: Date.now().toString(),
            text: currentInput,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setIsTyping(true);

        try {
            const response = await AgentTesterService.sendMessage({
                sessionId,
                message: currentInput
            });

            // Se o backend já retornar a resposta diretamente via HTTP, mostramos na tela
            // Evita duplicatas caso o SignalR também emita a mesma mensagem (checando o typing status)
            if (response && response.resposta) {
                setIsTyping(false);
                setMessages(prev => {
                    // Separa a resposta em blocos baseados na quebra de linha dupla (\n\n)
                    const blocks = response.resposta
                        .split('\n\n')
                        .map((t: string) => t.trim())
                        .filter((t: string) => t.length > 0);

                    const newMessages = blocks.map((blockText: string, index: number) => ({
                        id: Date.now().toString() + '-' + index,
                        text: blockText,
                        sender: 'agent' as const,
                        timestamp: new Date()
                    }));

                    return [...prev, ...newMessages];
                });
            }
        } catch (error: any) {
            setIsTyping(false);
            toast.error('Erro ao enviar mensagem.');
            console.error(error);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    };

    return (
        <div className="test-agent-panel">
            <div className="test-agent-header">
                <div className="header-title">
                    <FaRobot className="header-icon" />
                    <h3>Teste seu ChatBot</h3>
                </div>
                {sessionId && (
                    <button className="reset-btn" onClick={handleResetSession} title="Resetar Sessão">
                        <FaUndo /> <span>Resetar</span>
                    </button>
                )}
            </div>

            <div className="test-agent-body">
                {!sessionId ? (
                    <div className="start-session-view">
                        <div className="start-icon-wrapper">
                            <FaRobot />
                        </div>
                        <h4>Pronto para testar?</h4>
                        <p>Inicie uma sessão para conversar com o agente usando as regras configuradas ao lado. Lembre-se de salvar suas alterações antes de testar.</p>
                        <button
                            className="primary-button start-btn"
                            onClick={handleStartSession}
                            disabled={isSessionStarting}
                        >
                            <FaPlay /> {isSessionStarting ? 'Iniciando...' : 'Iniciar Sessão de Teste'}
                        </button>
                    </div>
                ) : (
                    <div className="test-chat-container">
                        <div className="test-chat-messages">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`test-message-wrapper ${msg.sender}`}>
                                    <div className="test-message-avatar">
                                        {msg.sender === 'agent' ? <FaRobot /> : <FaUser />}
                                    </div>
                                    <div className="test-message-bubble">
                                        <div className="test-message-text">{msg.text}</div>
                                        <div className="test-message-time">
                                            {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="test-message-wrapper agent typing-indicator">
                                    <div className="test-message-avatar"><FaRobot /></div>
                                    <div className="test-message-bubble">
                                        <span className="dot"></span>
                                        <span className="dot"></span>
                                        <span className="dot"></span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="test-chat-input-area">
                            <input
                                type="text"
                                placeholder="Digite sua mensagem para o agente..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={isTyping}
                            />
                            <button
                                className="send-btn"
                                onClick={handleSendMessage}
                                disabled={!inputValue.trim() || isTyping}
                            >
                                <FaPaperPlane />
                            </button>
                        </div>
                    </div>
                )}
            </div>
            {/*
            {!isHubConnected && sessionId && (
                <div className="connection-warning">
                    Conectando ao servidor de chat...
                </div>
            )}
            */}
        </div>
    );
};
