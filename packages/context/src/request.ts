import type { UserDBType, SessionDBType } from '@totallator/database';

/**
 * Minimal RequestEvent interface to avoid direct SvelteKit dependency.
 * Contains only the properties needed for context creation.
 */
interface MinimalRequestEvent {
  request: Request;
  locals: {
    user?: UserDBType;
    session?: SessionDBType;
  };
  getClientAddress(): string;
}

/**
 * Request-scoped context containing user authentication and request metadata.
 * 
 * This context is created for each HTTP request and provides access to:
 * - User authentication information (if authenticated)
 * - Request tracking and timing data
 * - Client information (IP, user agent)
 */
export interface RequestContext {
  /** Authenticated user, if present */
  user?: UserDBType;
  
  /** User session, if present */
  session?: SessionDBType;
  
  /** Unique identifier for this request */
  requestId: string;
  
  /** Request start timestamp for performance tracking */
  startTime: number;
  
  /** Original SvelteKit request event */
  event: MinimalRequestEvent;
  
  /** Client user agent string */
  userAgent?: string;
  
  /** Client IP address */
  ip?: string;
}

/**
 * Create a new request context from a SvelteKit request event.
 * 
 * Extracts user authentication, generates a unique request ID, and captures
 * client metadata for tracking and logging purposes.
 * 
 * @param event SvelteKit request event
 * @returns Initialized request context
 */
export function createRequestContext(event: MinimalRequestEvent): RequestContext {

  return {
    user: event.locals.user,
    session: event.locals.session,
    requestId: crypto.randomUUID(),
    startTime: Date.now(),
    event,
    userAgent: event.request.headers.get('user-agent') || undefined,
    ip: "",
  };
}