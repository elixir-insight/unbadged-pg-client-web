import type { OnboardingFormData } from '$lib/types/onboarding';

export async function submitOnboarding(
	data: OnboardingFormData
): Promise<{ success: true; applicationId: string } | { success: false; error: string }> {
	if (!data.businessPan || !data.gstin) {
		return {
			success: false,
			error: 'Missing required business identifiers. Please review earlier steps.'
		};
	}

	const stamp = Date.now().toString(36).toUpperCase();
	return { success: true, applicationId: `ELX-${stamp}` };
}
