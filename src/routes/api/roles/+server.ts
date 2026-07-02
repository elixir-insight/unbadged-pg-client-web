import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { RoleItem } from '$lib/stores/role-management/role-management';

const MOCK_ROLES: RoleItem[] = [
	{
		roleId: 199,
		roleName: 'QA_LEAD',
		roleAssignedCount: 4,
		defaultRole: false,
		description: 'QA Lead drives the testing strategy and mentors QA analysts'
	},
	{
		roleId: 166,
		roleName: 'DELIVERY_MANAGER',
		roleAssignedCount: 6,
		defaultRole: false,
		description:
			'Delivery Manager oversees project delivery timelines, coordinates between engineering and business teams'
	},
	{
		roleId: 133,
		roleName: 'BUSINESS_DEVELOPMENT_LEAD',
		roleAssignedCount: 3,
		defaultRole: false,
		description: 'Business Development Lead identifies growth opportunities.'
	},
	{
		roleId: 100,
		roleName: 'HEAD_OF_GLOBAL_PARTNERSHIPS',
		roleAssignedCount: 2,
		defaultRole: false,
		description: 'Head of Global Partnerships leads the international partner strategy.'
	},
	{
		roleId: 67,
		roleName: 'ONBOARDING_TEAM_LEAD',
		roleAssignedCount: 1,
		defaultRole: false,
		description: 'Onboarding Team Lead manages the onboarding process and approves new accounts.'
	},
	{
		roleId: 34,
		roleName: 'QUALITY_ANALYST',
		roleAssignedCount: 1,
		defaultRole: false,
		description:
			'A Quality Analyst ensures software quality by testing applications, identifying bugs and validating requirements.'
	},
	{
		roleId: 32,
		roleName: 'ADMIN',
		roleAssignedCount: 3,
		defaultRole: false,
		description:
			'Admin has full access to all modules including user management, billing, and system configuration.'
	},
	{
		roleId: 31,
		roleName: 'QA_MANAGER',
		roleAssignedCount: 2,
		defaultRole: false,
		description:
			'QA Manager oversees quality assurance workflows, manages QA teams and reviews test plans'
	},
	{
		roleId: 30,
		roleName: 'TESTER',
		roleAssignedCount: 6,
		defaultRole: false,
		description:
			'Tester is responsible for executing test cases, logging defects, and verifying fixes. '
	},
	{
		roleId: 7,
		roleName: 'ORGANIZATION_WALLET_MANAGEMENT_READ_ONLY',
		roleAssignedCount: 4,
		defaultRole: true,
		description:
			'Read-only access to organization wallet balances, transaction history, and activity logs.'
	}
];

export const GET: RequestHandler = async ({ url }) => {
	const query = (url.searchParams.get('q') ?? '').trim().toLowerCase();
	await new Promise((r) => setTimeout(r, 400));
	const items = query
		? MOCK_ROLES.filter((r) => r.roleName.toLowerCase().includes(query))
		: MOCK_ROLES;
	return json({ items });
};
