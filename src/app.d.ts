// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { MerchantSession } from '$lib/stores/auth/types';
import type { RbacPermissions } from '$lib/rbac/types';
import type { Logger } from 'pino';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			merchantSession: MerchantSession | null;
			gatewayToken: string | null;
			/** Current user's granted RBAC permissions for the active portal. Empty object if unauthenticated or fetch failed (fails closed). */
			userPermissions: RbacPermissions;
			requestId: string;
			logger: Logger;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
