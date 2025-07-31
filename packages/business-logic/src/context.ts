// This file is deprecated - context is now handled by @totallator/context package
// Keep this for backward compatibility during migration

import type { GlobalContext, RequestContext } from '@totallator/context';

// Re-export context types for backward compatibility
export type { GlobalContext, RequestContext } from '@totallator/context';

// Legacy function - use getGlobalContext from @totallator/context instead
export const getContext = (): GlobalContext => {
	throw new Error(
		'getContext is deprecated. Use getGlobalContext from @totallator/context instead.'
	);
};

// Legacy function - context is now initialized in the webapp hooks
export const initContext = (): void => {
	throw new Error('initContext is deprecated. Context is now initialized in the webapp hooks.');
};
