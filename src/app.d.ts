// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { MerchantSession } from '$lib/stores/auth/types';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			merchantSession: MerchantSession | null;
			gatewayToken: string | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
