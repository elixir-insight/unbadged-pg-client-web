import type { Actions } from './$types';
import { saveOrganizationSection } from '$lib/server/domains/onboarding/save-section';

export const actions: Actions = {
	default: async (event) => {
		const saved = await saveOrganizationSection(event, 'identity');
		if (!saved.ok) return saved.failure;
		return { success: true as const };
	}
};
