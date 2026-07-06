import { Building2, CreditCard, FileText, Plug } from '$lib/assets/icons';
import type { Component } from 'svelte';

export interface OnboardingStep {
	key: 'kyb' | 'account' | 'documents' | 'integration';
	label: string;
	description: string;
	icon: Component;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
	{ key: 'kyb', label: 'KYB', description: 'Business verification', icon: Building2 },
	{ key: 'account', label: 'Account', description: 'Banking', icon: CreditCard },
	{ key: 'documents', label: 'Documents', description: 'Upload files', icon: FileText },
	{ key: 'integration', label: 'Integration', description: 'API & webhook', icon: Plug }
];

export type OnboardingStepKey = OnboardingStep['key'];
