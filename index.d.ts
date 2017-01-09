declare module 'postman.js' {
    // class Message {
    //     id: string;
    //     type: string;
    //     name: string;
    //     error: Error;
    //     payload: any;
    //     constructor(data?: any);
    //     static create(data?: any): Message;
    //     static parse(event?: Event): Message;
    //     toJSON(): string;
    // }

    class Client {
        // constructor(contentWindow: Window, domain: string, timeout?: number);
        // sendMessage(message: Message): void;
        emit(name: string, payload?: any, callback?: (error: any, payload?: any) => void): void;
        on(name: string, callback: (payload: any, done: (error?: any, payload?: any) => void) => void): void;
        destroy(): void;
    }

    namespace postman {
        function getClientByWindow(targetWindow: Window): Client;
        function createClient(targetWindow: Window, targetOrigin: string, opt_timeout?: number): Client;
    }

    export = postman
}
