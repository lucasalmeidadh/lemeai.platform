// src/services/hubconfig.ts

import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr';

/**
 * Classe de serviço para gerenciar a conexão SignalR de forma centralizada.
 * Utiliza o padrão Singleton para garantir uma única instância de conexão
 * para toda a aplicação.
 */
class HubConnectionService {
  // A instância da conexão do Hub
  public connection: HubConnection;
  // A URL do Hub, obtida de variáveis de ambiente
  private hubUrl: string;

  // Instância estática para o padrão Singleton
  private static instance: HubConnectionService;

  /**
   * O construtor é privado para forçar o uso do método getInstance()
   */
  // ADIÇÃO: Guarda a "promessa" da conexão em andamento
  private startPromise: Promise<void> | null = null;

  private constructor() {
    // ... código do construtor sem alteração
    const baseUrl = 'https://lemeia-api.onrender.com';
    this.hubUrl = `${baseUrl.replace(/\/$/, '')}/chatHub`;
    this.connection = new HubConnectionBuilder()
        .withUrl(this.hubUrl)
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Information)
        .build();
  }

  public static getInstance(): HubConnectionService {
    // ... código sem alteração
    if (!HubConnectionService.instance) {
      HubConnectionService.instance = new HubConnectionService();
    }
    return HubConnectionService.instance;
  }

  // MUDANÇA: Lógica de start aprimorada
  public startConnection(): Promise<void> {
    // Se já estiver conectado, retorna uma promessa resolvida imediatamente.
    if (this.connection.state === HubConnectionState.Connected) {
      return Promise.resolve();
    }
    
    // Se já estiver conectando, retorna a promessa da conexão existente.
    if (this.connection.state === HubConnectionState.Connecting) {
      return this.startPromise!;
    }
    
    // Se estiver desconectado, inicia uma nova conexão.
    console.log('Starting SignalR connection...');
    this.startPromise = this.connection.start()
      .then(() => {
        console.log('SignalR Connection started successfully.');
      })
      .catch(error => {
        console.error('Error starting SignalR connection:', error);
        // Limpa a promessa em caso de erro para permitir nova tentativa
        this.startPromise = null; 
        return Promise.reject(error);
      });
      
    return this.startPromise;
  }

  /**
   * Para a conexão com o Hub do SignalR.
   */
  public async stopConnection(): Promise<void> {
    if (this.connection.state === HubConnectionState.Disconnected) {
      return;
    }
    try {
      await this.connection.stop();
      console.log('SignalR Connection stopped.');
    } catch (error) {
      console.error('Error stopping SignalR connection:', error);
    }
  }

  /**
   * Registra um "ouvinte" (handler) para um evento enviado pelo servidor.
   * @param eventName O nome do evento para ouvir. (Ex: "ReceiveNewMessage")
   * @param callback A função a ser executada quando o evento for recebido.
   */
  public on(eventName: string, callback: (...args: any[]) => void): void {
    this.connection.on(eventName, callback);
  }

  /**
   * Remove um "ouvinte" (handler) de um evento. Crucial para evitar memory leaks
   * em componentes que são destruídos e recriados.
   * @param eventName O nome do evento.
   * @param callback A função que foi registrada anteriormente.
   */
  public off(eventName: string, callback: (...args: any[]) => void): void {
    this.connection.off(eventName, callback);
  }

  /**
   * Invoca um método no Hub do servidor.
   * @param methodName O nome do método no Hub a ser chamado. (Ex: "JoinConversationGroup")
   * @param args Os argumentos para passar ao método do Hub.
   * @returns Uma Promise que resolve quando o método no servidor completa.
   */
  public async invoke(methodName: string, ...args: any[]): Promise<any> {
    if (this.connection.state !== HubConnectionState.Connected) {
      // Opcional: pode-se tentar reconectar ou apenas lançar um erro
      console.warn(`Cannot invoke '${methodName}' because the connection is not in the 'Connected' state. Current state: ${this.connection.state}`);
      // Lança um erro para que a chamada que originou saiba que falhou.
      throw new Error("SignalR connection is not active.");
    }
    return this.connection.invoke(methodName, ...args);
  }
}

// Exporta a instância única do serviço para ser usada em toda a aplicação.
const hubService = HubConnectionService.getInstance();
export default hubService;