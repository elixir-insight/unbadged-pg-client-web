import { createRawSnippet } from 'svelte';
import type { BadgeVariant } from '$lib/components/ui/badge';

const ACRONYMS = new Set(['LLP', 'KYB', 'CIN', 'TAN', 'GSTIN', 'IFSC', 'URL', 'IP']);

export type FlowStepKey = 'legal' | 'address' | 'directors' | 'bank' | 'documents' | 'review';

export interface FlowStep {
	key: FlowStepKey;
	label: string;
	href: (orgId: string) => string;
}

const KYB_STEP_KEYS = new Set<string>(['legal', 'address', 'directors']);

function kybHref(orgId: string, step?: 'address' | 'directors'): string {
	const base = `/management/organizations/${orgId}/kyb`;
	return step ? `${base}?step=${step}` : base;
}

export function getFlowSteps(): FlowStep[] {
	const steps: FlowStep[] = [
		{ key: 'legal', label: 'Legal', href: (orgId) => kybHref(orgId) },
		{ key: 'address', label: 'Address', href: (orgId) => kybHref(orgId, 'address') },
		{ key: 'directors', label: 'Directors', href: (orgId) => kybHref(orgId, 'directors') },
		{
			key: 'bank',
			label: 'Bank',
			href: (orgId) => `/management/organizations/${orgId}/bank`
		},
		{
			key: 'documents',
			label: 'Documents',
			href: (orgId) => `/management/organizations/${orgId}/documents`
		}
	];

	steps.push({
		key: 'review',
		label: 'Review',
		href: (orgId) => previewPath(orgId)
	});

	return steps;
}

export function getCurrentFlowStepKey(
	pathname: string,
	searchParams: URLSearchParams
): FlowStepKey {
	if (pathname.includes('/preview')) return 'review';
	if (pathname.includes('/bank')) return 'bank';
	if (pathname.includes('/documents')) return 'documents';

	const step = searchParams.get('step') ?? 'legal';
	return KYB_STEP_KEYS.has(step) ? (step as FlowStepKey) : 'legal';
}

export function getAdjacentFlowSteps(currentKey: FlowStepKey): {
	prev: FlowStep | null;
	next: FlowStep | null;
} {
	const steps = getFlowSteps();
	const index = steps.findIndex((step) => step.key === currentKey);
	if (index < 0) {
		return { prev: null, next: null };
	}
	return {
		prev: index > 0 ? steps[index - 1] : null,
		next: index < steps.length - 1 ? steps[index + 1] : null
	};
}

export function previewPath(orgId: string): string {
	return `/management/organizations/${orgId}/preview`;
}

export const tabVariantMap: Record<'Completed' | 'Pending', BadgeVariant> = {
	Completed: 'success',
	Pending: 'warning'
};

export function formatLabel(value: string): string {
	return value
		.split('_')
		.map((word) =>
			ACRONYMS.has(word) ? word : word[0].toUpperCase() + word.slice(1).toLowerCase()
		)
		.join(' ');
}

export function createChipSnippet(label: string) {
	return createRawSnippet(() => ({ render: () => label }));
}

export function cloneOrganization<T>(value: T): T {
	return JSON.parse(JSON.stringify(value)) as T;
}

export function maskAccountNumber(accountNumber: string): string {
	const lastFour = accountNumber.slice(-4);
	return `XXXXXX${lastFour}`;
}

export function todayIso(): string {
	return new Date().toISOString().slice(0, 10);
}

export function deriveBankNameFromIfsc(ifscCode: string): string {
	if (ifscCode.startsWith('HDFC')) return 'HDFC Bank';
	if (ifscCode.startsWith('ICIC')) return 'ICICI Bank';
	if (ifscCode.startsWith('SBI')) return 'SBI';
	if (ifscCode.startsWith('AXIS')) return 'Axis Bank';
	if (ifscCode.startsWith('YES')) return 'Yes Bank';
	if (ifscCode.startsWith('KOTA')) return 'Kotak Mahindra';
	return 'HDFC Bank';
}

export function getSectionState(completed: boolean): 'Completed' | 'Pending' {
	return completed ? 'Completed' : 'Pending';
}

export function formatRegisteredAddress(address: {
	line1: string;
	line2: string;
	city: string;
	state: string;
	pincode: string;
	country?: string;
}): string {
	const lines = [
		address.line1,
		address.line2,
		[address.city, address.state, address.pincode].filter(Boolean).join(', '),
		address.country
	].filter(Boolean);
	return lines.join('\n');
}

export function addressesEqual(
	a: {
		line1: string;
		line2: string;
		city: string;
		state: string;
		pincode: string;
		country?: string;
	},
	b: {
		line1: string;
		line2: string;
		city: string;
		state: string;
		pincode: string;
		country?: string;
	}
): boolean {
	return (
		a.line1 === b.line1 &&
		a.line2 === b.line2 &&
		a.city === b.city &&
		a.state === b.state &&
		a.pincode === b.pincode &&
		(a.country ?? '') === (b.country ?? '')
	);
}

export function buildTabStatusChip(completed: boolean) {
	const label = getSectionState(completed);
	return {
		label,
		variant: tabVariantMap[label]
	};
}
