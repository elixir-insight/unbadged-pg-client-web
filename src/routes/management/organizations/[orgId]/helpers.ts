import { createRawSnippet } from 'svelte';
import type { BadgeVariant } from '$lib/components/ui/badge';
import type { OrganizationStatus } from '$lib/data/mockData';

const ACRONYMS = new Set(['LLP', 'KYB', 'CIN', 'TAN', 'GSTIN', 'IFSC', 'URL', 'IP']);

export type FlowStepKey =
	'legal' | 'address' | 'directors' | 'bank' | 'documents' | 'review' | 'fees';

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

const POST_ONBOARDING_STATUSES = new Set<OrganizationStatus>(['APPROVED', 'ACTIVE', 'FROZEN']);

export function isPostOnboardingStatus(status: OrganizationStatus): boolean {
	return POST_ONBOARDING_STATUSES.has(status);
}

export function getPostOnboardingSteps(): FlowStep[] {
	return [
		{
			key: 'review',
			label: 'Profile overview',
			href: (orgId) => previewPath(orgId)
		},
		{ key: 'legal', label: 'KYB', href: (orgId) => kybHref(orgId) },
		{
			key: 'bank',
			label: 'Bank',
			href: (orgId) => `/management/organizations/${orgId}/bank`
		},
		{
			key: 'documents',
			label: 'Documents',
			href: (orgId) => `/management/organizations/${orgId}/documents`
		},
		{
			key: 'fees',
			label: 'Fees',
			href: (orgId) => feesPath(orgId)
		}
	];
}

export function getFlowNavSteps(status: OrganizationStatus): FlowStep[] {
	return isPostOnboardingStatus(status) ? getPostOnboardingSteps() : getFlowSteps();
}

export function getCurrentFlowNavStepKey(
	pathname: string,
	searchParams: URLSearchParams,
	status: OrganizationStatus
): FlowStepKey {
	const key = getCurrentFlowStepKey(pathname, searchParams);
	if (isPostOnboardingStatus(status) && KYB_STEP_KEYS.has(key)) {
		return 'legal';
	}
	return key;
}

export function defaultOrganizationLandingPath(orgId: string, status: OrganizationStatus): string {
	return isPostOnboardingStatus(status) ? previewPath(orgId) : kybHref(orgId);
}

export function getCurrentFlowStepKey(
	pathname: string,
	searchParams: URLSearchParams
): FlowStepKey {
	if (pathname.includes('/preview')) return 'review';
	if (pathname.includes('/fees')) return 'fees';
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

export function feesPath(orgId: string): string {
	return `/management/organizations/${orgId}/fees`;
}

const ORG_ONBOARDING_SECTION_PATH =
	/^\/management\/organizations\/[^/]+\/(kyb|bank|documents|preview|fees)(?:\/|$)/;

export function isOrgOnboardingSectionPath(pathname: string): boolean {
	return ORG_ONBOARDING_SECTION_PATH.test(pathname);
}

const KYB_SECTION_PATH = /^\/management\/organizations\/[^/]+\/kyb(?:\/|$)/;

/** True when navigating within the KYB page (legal / address / directors sub-steps). */
export function isKybSubStepNavigation(from: URL | undefined, to: URL | undefined): boolean {
	if (!from || !to) return false;
	if (from.pathname !== to.pathname) return false;
	return KYB_SECTION_PATH.test(from.pathname);
}

const PREVIEW_SECTION_PATH = /^\/management\/organizations\/[^/]+\/preview(?:\/|$)/;

/** True when navigating within the Review page (KYB / bank / documents sub-sections). */
export function isPreviewSubSectionNavigation(from: URL | undefined, to: URL | undefined): boolean {
	if (!from || !to) return false;
	if (from.pathname !== to.pathname) return false;
	return PREVIEW_SECTION_PATH.test(from.pathname);
}

export function isPreviewSectionParamChange(from: URL | undefined, to: URL | undefined): boolean {
	if (!isPreviewSubSectionNavigation(from, to)) return false;
	const fromSection = from?.searchParams.get('section') ?? 'legal';
	const toSection = to?.searchParams.get('section') ?? 'legal';
	return fromSection !== toSection;
}

/** True when navigation targets preview (new route or tab change). */
export function isPreviewNavigation(from: URL | undefined, to: URL | undefined): boolean {
	if (!to) return false;
	if (!PREVIEW_SECTION_PATH.test(to.pathname)) return false;
	if (!from) return true;
	if (from.pathname !== to.pathname) return true;
	return isPreviewSectionParamChange(from, to);
}

/** Internal path for a flow step. Wrap with resolve() at navigation call sites. */
export function flowStepHref(orgId: string, step: FlowStepKey): string {
	const kybBase = `/management/organizations/${orgId}/kyb`;

	switch (step) {
		case 'bank':
			return `/management/organizations/${orgId}/bank`;
		case 'documents':
			return `/management/organizations/${orgId}/documents`;
		case 'review':
			return `/management/organizations/${orgId}/preview`;
		case 'fees':
			return feesPath(orgId);
		case 'legal':
			return kybBase;
		default:
			return `${kybBase}?step=${step}`;
	}
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
