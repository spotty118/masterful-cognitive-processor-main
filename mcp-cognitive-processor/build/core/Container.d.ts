type Constructor<T = any> = new (...args: any[]) => T;
export declare class Container {
    private static instance;
    private services;
    private factories;
    private constructor();
    static getInstance(): Container;
    register<T>(key: string, service: T): void;
    registerFactory<T>(key: string, factory: (...args: any[]) => T): void;
    get<T>(key: string): T;
    /**
     * Checks if a service with the given name has been registered
     * @param name Service name
     * @returns true if the service exists, false otherwise
     */
    has(name: string): boolean;
    createInstance<T>(constructor: Constructor<T>, ...args: any[]): T;
    clear(): void;
}
export {};
