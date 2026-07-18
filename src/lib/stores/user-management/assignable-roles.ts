export const ASSIGNABLE_ROLES = [
	'Onboarding Read Only',
	'Onboarding Admin',
	'Quality Analyst',
	'QA Manager',
	'Organization Management Admin',
	'Read Only Auditor',
	'Tester'
] as const;

export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

export type RolesReportingTab = 'roles' | 'reporting';
