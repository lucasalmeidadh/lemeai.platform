import {
    HubConnection,
    HubConnectionBuilder,
    HubConnectionState,
    LogLevel,
} from '@microsoft/signalr';

const API_URL = 'https://api.gbcode.com.br';

class HubConnectionService {
    public connection: HubConnection;
    private hubUrl: string;
    private apiUrl: string = API_URL;
    private static instance: HubConnectionService;

    private startPromise: Promise<void> | null = null;

    private constructor() {
        const baseUrl = this.apiUrl;
        this.hubUrl = `${baseUrl.replace(/\/$/, '')}/chatHub`;
        this.connection = new HubConnectionBuilder()
            .withUrl(this.hubUrl)
            .withAutomaticReconnect()
            .configureLogging(LogLevel.Information)
            .build();
    }

    public static getInstance(): HubConnectionService {
        if (!HubConnectionService.instance) {
            HubConnectionService.instance = new HubConnectionService();
        }
        return HubConnectionService.instance;
    }

    public startConnection(): Promise<void> {
        if (this.connection.state === HubConnectionState.Connected) {
            return Promise.resolve();
        }

        if (this.connection.state === HubConnectionState.Connecting) {
            return this.startPromise!;
        }

        console.log('Starting SignalR connection...');
        this.startPromise = this.connection.start()
            .then(() => {
                console.log('SignalR Connection started successfully.');
            })
            .catch((error: any) => {
                console.error('Error starting SignalR connection:', error);
                this.startPromise = null;
                return Promise.reject(error);
            });

        return this.startPromise;
    }

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

    public on(eventName: string, callback: (...args: any[]) => void): void {
        this.connection.on(eventName, callback);
    }

    public off(eventName: string, callback: (...args: any[]) => void): void {
        this.connection.off(eventName, callback);
    }

    public async invoke(methodName: string, ...args: any[]): Promise<any> {
        if (this.connection.state !== HubConnectionState.Connected) {
            console.warn(`Cannot invoke '${methodName}' because the connection is not in the 'Connected' state. Current state: ${this.connection.state}`);
            throw new Error("SignalR connection is not active.");
        }
        return this.connection.invoke(methodName, ...args);
    }
}

const hubService = HubConnectionService.getInstance();
export default hubService;
