import type { UserDBType, SessionDBType } from '@totallator/database';

// Define a minimal RequestEvent interface to avoid SvelteKit dependency
interface MinimalRequestEvent {
  request: Request;
  locals: {
    user?: UserDBType;
    session?: SessionDBType;
  };
  getClientAddress(): string;
}

export interface RequestContext {
  user?: UserDBType;
  session?: SessionDBType;
  requestId: string;
  startTime: number;
  event: MinimalRequestEvent;
  userAgent?: string;
  ip?: string;
}

export function createRequestContext(event: MinimalRequestEvent): RequestContext {
  return {
    user: event.locals.user,
    session: event.locals.session,
    requestId: crypto.randomUUID(),
    startTime: Date.now(),
    event,
    userAgent: event.request.headers.get('user-agent') || undefined,
    ip: event.getClientAddress(),
  };
}

export function getRequestDuration(requestContext: RequestContext): number {
  return Date.now() - requestContext.startTime;
}

export function isAuthenticated(requestContext: RequestContext): boolean {
  return !!(requestContext.user && requestContext.session);
}

export function requireAuth(requestContext: RequestContext): {
  user: UserDBType;
  session: SessionDBType;
} {
  if (!requestContext.user || !requestContext.session) {
    throw new Error('Authentication required');
  }
  return {
    user: requestContext.user,
    session: requestContext.session,
  };
}