import type { OrganizationStatus } from '$lib/data/mockData';

export type OperationalProfileStatus = Extract<OrganizationStatus, 'ACTIVE' | 'ON_HOLD' | 'FROZEN'>;

export interface StatusTransition {
	current: OperationalProfileStatus;
	next: OperationalProfileStatus;
}

export function isOperationalProfileStatus(
	status: OrganizationStatus
): status is OperationalProfileStatus {
	return status === 'ACTIVE' || status === 'ON_HOLD' || status === 'FROZEN';
}

export function statusChangeRequiresRemarks(nextStatus: OperationalProfileStatus): boolean {
	return nextStatus === 'FROZEN';
}

export function createPutOnHoldTransition(): StatusTransition {
	return { current: 'ACTIVE', next: 'ON_HOLD' };
}

export function createFreezeTransition(): StatusTransition {
	return { current: 'ON_HOLD', next: 'FROZEN' };
}

export function createReactivateTransition(
	current: Extract<OperationalProfileStatus, 'ON_HOLD' | 'FROZEN'>
): StatusTransition {
	return { current, next: 'ACTIVE' };
}
