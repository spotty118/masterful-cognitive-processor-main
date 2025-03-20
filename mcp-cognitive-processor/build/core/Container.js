export class Container {
    static instance;
    services;
    factories;
    constructor() {
        this.services = new Map();
        this.factories = new Map();
    }
    static getInstance() {
        if (!Container.instance) {
            Container.instance = new Container();
        }
        return Container.instance;
    }
    register(key, service) {
        this.services.set(key, service);
    }
    registerFactory(key, factory) {
        this.factories.set(key, factory);
    }
    get(key) {
        const service = this.services.get(key);
        if (service) {
            return service;
        }
        const factory = this.factories.get(key);
        if (factory) {
            const instance = factory();
            this.services.set(key, instance);
            return instance;
        }
        throw new Error(`Service not found: ${key}`);
    }
    /**
     * Checks if a service with the given name has been registered
     * @param name Service name
     * @returns true if the service exists, false otherwise
     */
    has(name) {
        return this.services.has(name);
    }
    createInstance(constructor, ...args) {
        return new constructor(...args);
    }
    clear() {
        this.services.clear();
        this.factories.clear();
    }
}
//# sourceMappingURL=Container.js.map