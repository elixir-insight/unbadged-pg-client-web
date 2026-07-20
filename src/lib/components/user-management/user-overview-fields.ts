import { formatPhoneDisplay } from '$lib/stores/user-management/user-mapper';

export type UserOverviewField = {
	label: string;
	value: string;
	kind?: 'email' | 'tel';
	subtitle?: string;
};

export function buildUserOverviewFields(input: {
	email: string;
	mobileNumber?: string;
	employeeId?: string;
	reportingManager?: {
		name: string;
		employeeId?: string;
		email?: string;
	} | null;
}): UserOverviewField[] {
	const reportingManager = input.reportingManager;
	const phoneDisplay = formatPhoneDisplay(input.mobileNumber);

	return [
		{ label: 'Email ID', value: input.email, kind: 'email' },
		{
			label: 'Mobile Number',
			value: phoneDisplay,
			kind: phoneDisplay !== '—' ? 'tel' : undefined
		},
		{ label: 'Employee ID', value: input.employeeId?.trim() || '—' },
		{
			label: 'Reporting To',
			value: reportingManager?.name ?? '—',
			subtitle: reportingManager
				? [reportingManager.employeeId, reportingManager.email].filter(Boolean).join(' · ')
				: undefined
		}
	];
}
