import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { RoleItem } from '$lib/stores/role-management/role-management';

const MOCK_ROLES: RoleItem[] = [
	{
		roleId: 199,
		roleName: 'QA_LEAD',
		roleAssignedCount: 4,
		defaultRole: false,
		description:
			'QA Lead drives the testing strategy, mentors QA analysts, and coordinates with product and development teams to deliver bug-free releases on schedule.'
	},
	{
		roleId: 166,
		roleName: 'DELIVERY_MANAGER',
		roleAssignedCount: 6,
		defaultRole: false,
		description:
			'Delivery Manager oversees project delivery timelines, coordinates between engineering and business teams, and ensures features reach production on schedule.'
	},
	{
		roleId: 133,
		roleName: 'BUSINESS_DEVELOPMENT_LEAD',
		roleAssignedCount: 3,
		defaultRole: false,
		description:
			'Business Development Lead identifies growth opportunities, manages partner onboarding, and tracks revenue performance across the platform.'
	},
	{
		roleId: 100,
		roleName: 'HEAD_OF_GLOBAL_PARTNERSHIPS',
		roleAssignedCount: 2,
		defaultRole: false,
		description:
			'Head of Global Partnerships leads the international partner strategy, manages high-value partner relationships, and oversees cross-border settlement configurations.'
	},
	{
		roleId: 67,
		roleName: 'ONBOARDING_TEAM_LEAD',
		roleAssignedCount: 1,
		defaultRole: false,
		description:
			'Onboarding Team Lead manages the onboarding process, approves new accounts, and coordinates with cross-functional teams to ensure smooth merchant activation.'
	},
	{
		roleId: 34,
		roleName: 'QUALITY_ANALYST',
		roleAssignedCount: 1,
		defaultRole: false,
		description:
			'A Quality Analyst ensures software quality by testing applications, identifying bugs, validating requirements, and improving user experience. They perform functional, regression, and usability testing while collaborating with developers and teams.'
	},
	{
		roleId: 32,
		roleName: 'ADMIN',
		roleAssignedCount: 3,
		defaultRole: false,
		description:
			'Admin has full access to all modules including user management, billing, and system configuration. Can create, update, and delete records across the platform.'
	},
	{
		roleId: 31,
		roleName: 'QA_MANAGER',
		roleAssignedCount: 2,
		defaultRole: false,
		description:
			'QA Manager oversees quality assurance workflows, manages QA teams, reviews test plans, approves releases, and ensures all deliverables meet quality standards.'
	},
	{
		roleId: 30,
		roleName: 'TESTER',
		roleAssignedCount: 6,
		defaultRole: false,
		description:
			'Tester is responsible for executing test cases, logging defects, and verifying fixes. Has read access to most modules for testing purposes.'
	},
	{
		roleId: 7,
		roleName: 'ORGANIZATION_WALLET_MANAGEMENT_READ_ONLY',
		roleAssignedCount: 4,
		defaultRole: true,
		description:
			'Read-only access to organization wallet balances, transaction history, and activity logs. Cannot initiate transfers or modify wallet configurations.'
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
