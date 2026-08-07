declare module 'postman.js' {
    namespace postman {
        type EmitCallback = (error?: any, payload?: any) => void;
        type Handler = (payload: any, done: EmitCallback) => void;

        interface MessageData {
            id?: string;
            type?: 'req' | 'res';
            name?: string;
            error?: any;
            payload?: any;
            clientId?: string;
        }

        class Message {
            id: string;
            type?: 'req' | 'res';
            name?: string;
            error: any;
            payload: any;
            clientId?: string;

            constructor(data?: MessageData);

            static create(opt_data?: MessageData): Message;
            static parse(e: MessageEvent): Message;

            toJSON(): string;
        }

        class Client {
            id: string;
            contentWindow: Window;
            domain: string;
            handlers: { [name: string]: Handler };
            timeoutDuration: number;

            constructor(contentWindow: Window, domain: string, opt_timeout?: number);

            sendMessage(message: Message): void;
            emit(name: string, opt_data?: any, opt_callback?: EmitCallback, opt_timeout?: number): void;
            on(name: string, handler: Handler): void;
            destroy(): void;
        }

        function createClient(contentWindow: Window, domain: string, opt_timeout?: number): Client;
        function getClientsByWindow(contentWindow: Window): Client[];
    }

    export = postman;
}