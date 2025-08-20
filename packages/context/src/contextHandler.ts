import { AsyncLocalStorage } from "async_hooks";
import type {Handle} from '@sveltejs/kit'

// Define minimal types to avoid SvelteKit dependency
interface RequestEvent {
  route: { id: string | null };
  url: URL;
  request: Request;
  locals: any;
  cookies: any;
  getClientAddress(): string;
}


/**
 * Combined context containing both global and request-scoped data
 */
export interface CombinedContext<GlobalContextType, RequestContextType> {
  global: GlobalContextType;
  request: RequestContextType;
}

// Removed OtherGetters interface - no longer needed

/**
 * Configuration for the hook builder
 */
export interface HookBuilderConfig<GlobalContextType, RequestContextType> {
  /** Function to initialize the global context - receives getContext function for advanced usage */
  initGlobalContext: (getContext: () => CombinedContext<GlobalContextType, RequestContextType>) => GlobalContextType | Promise<GlobalContextType>;
  
  /** Function to create request-specific context - user has full control over structure */
  createRequestContext: (event: RequestEvent) => RequestContextType;
  
  /** Optional callback to update event.locals */
  updateLocals?: (event: RequestEvent, context: CombinedContext<GlobalContextType, RequestContextType>) => void;
  
  /** Optional custom resolve logic - handle transactions, timeouts, etc. here */
  customResolve?: (
    context: CombinedContext<GlobalContextType, RequestContextType>,
    event: RequestEvent,
    resolve:Parameters<Handle>[0]["resolve"]
  ) => Promise<Response>;
}

/**
 * Result returned by hookBuilder containing the SvelteKit hook and utilities
 */
export interface HookBuilderResult<GlobalContextType, RequestContextType> {
  /** SvelteKit handle function */
  hook: Handle;
  
  /** Function to run code in standalone context (for cron jobs, etc.) */
  standaloneContext: <T>(
    metadata: Partial<RequestContextType>,
    callback: (context: CombinedContext<GlobalContextType, RequestContextType>) => Promise<T> | T
  ) => Promise<T>;
  
  /** Lazy getter for global context */
  globalContext: () => Promise<GlobalContextType>;
}

/**
 * Context handler that manages AsyncLocalStorage and provides typed context access
 * throughout a monorepo architecture.
 */
export class ContextHandler<GlobalContextType, RequestContextType> {
  private contextStorage = new AsyncLocalStorage<CombinedContext<GlobalContextType, RequestContextType>>();
  private isInitialized = false;
  private globalContext: GlobalContextType | undefined;

  constructor() {
    // Simple constructor with no configuration needed
  }

  /**
   * Get the current context from AsyncLocalStorage
   */
  getContext = (): CombinedContext<GlobalContextType, RequestContextType> => {
    if (!this.isInitialized) {
      throw new Error("ContextHandler not initialized - call hookBuilder() first in your hooks.server.ts");
    }
    
    const context = this.contextStorage.getStore();
    if (!context) {
      throw new Error("Context not available - must be called within a request or standalone context");
    }
    return context;
  };

  /**
   * Run a function within a database transaction if the global context supports it
   */
  runInTransaction = async <T>(callback: () => Promise<T> | T): Promise<T> => {
    const context = this.getContext();
    const { global } = context;

    if (global && typeof (global as any).db?.transaction === 'function') {
      return (global as any).db.transaction(() => callback());
    }

    return Promise.resolve(callback());
  };

  /**
   * Get or initialize the global context
   */
  private getOrInitGlobalContext = async (
    initGlobalContext: (getContext: () => CombinedContext<GlobalContextType, RequestContextType>) => GlobalContextType | Promise<GlobalContextType>
  ): Promise<GlobalContextType> => {
    if (this.globalContext) {
      return this.globalContext;
    }
    
    // Create a safe getContext function for initialization
    // This will only work if called within an active context (e.g., during request handling)
    const safeGetContext = (): CombinedContext<GlobalContextType, RequestContextType> => {
      const context = this.contextStorage.getStore();
      if (!context) {
        throw new Error(
          "Context not available during global initialization. " +
          "The getContext function passed to initGlobalContext can only be used " +
          "for creating context-aware functions (like loggers) that will be called later, " +
          "not for immediate access during initialization."
        );
      }
      return context;
    };
    
    this.globalContext = await initGlobalContext(safeGetContext);
    return this.globalContext;
  };

  /**
   * Build the SvelteKit hook and related utilities
   */
  hookBuilder = (config: HookBuilderConfig<GlobalContextType, RequestContextType>): HookBuilderResult<GlobalContextType, RequestContextType> => {
    this.isInitialized = true;
    
    const {
      initGlobalContext,
      createRequestContext,
      updateLocals,
      customResolve,
    } = config;

    const hook: Handle = async ({ event, resolve }) => {
      const global = await this.getOrInitGlobalContext(initGlobalContext);
      const request = createRequestContext(event);

      const context: CombinedContext<GlobalContextType, RequestContextType> = { global, request };

      // Allow user to update event.locals if needed
      if (updateLocals) {
        updateLocals(event, context);
      }

      return this.contextStorage.run(context, async () => {
        // Allow user to customize resolve behavior (handle transactions, etc.)
        if (customResolve) {
          return customResolve(context, event, resolve);
        }

        // Default behavior - just resolve
        return resolve(event);
      });
    };

    const standaloneContext = async <T>(
      metadata: Partial<RequestContextType>,
      callback: (context: CombinedContext<GlobalContextType, RequestContextType>) => Promise<T> | T
    ): Promise<T> => {
      const global = await this.getOrInitGlobalContext(initGlobalContext);
      
      // User provides the full request context structure
      const request = {
        ...metadata,
      } as RequestContextType;

      const context: CombinedContext<GlobalContextType, RequestContextType> = { global, request };

      return this.contextStorage.run(context, () => callback(context));
    };

    const globalContext = async (): Promise<GlobalContextType> => {
      return this.getOrInitGlobalContext(initGlobalContext);
    };

    return {
      hook,
      standaloneContext,
      globalContext,
    };
  };

  // Removed getter creation methods - users create their own getters now
}

/**
 * Create a new context handler - simple and clean
 */
export function createContextHandler<GlobalContextType, RequestContextType>() {
  const handler = new ContextHandler<GlobalContextType, RequestContextType>();
  
  return {
    getContext: handler.getContext,
    runInTransaction: handler.runInTransaction,
    hookBuilder: handler.hookBuilder,
  };
}