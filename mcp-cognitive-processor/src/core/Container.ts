type Constructor<T = any> = new (...args: any[]) => T;

export class Container {
  private static instance: Container;
  private services: Map<string, any>;
  private factories: Map<string, (...args: any[]) => any>;

  private constructor() {
    this.services = new Map();
    this.factories = new Map();
  }

  public static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  public register<T>(key: string, service: T): void {
    this.services.set(key, service);
  }

  public registerFactory<T>(key: string, factory: (...args: any[]) => T): void {
    this.factories.set(key, factory);
  }

  public get<T>(key: string): T {
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
  public has(name: string): boolean {
    return this.services.has(name);
  }

  public createInstance<T>(constructor: Constructor<T>, ...args: any[]): T {
    return new constructor(...args);
  }

  public clear(): void {
    this.services.clear();
    this.factories.clear();
  }
}