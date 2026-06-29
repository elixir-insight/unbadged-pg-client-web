import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { RoleItem } from '$lib/stores/role-management/role-management';

const MOCK_ROLES: RoleItem[] = [
	{
		id: '1',
		name: 'Admin',
		type: 'Default',
		userCount: 5,
		description:
			'Create & view payouts, invoices, taxes, view statement & all financial operations.'
	},
	{
		id: '2',
		name: 'Finance',
		type: 'Default',
		userCount: 3,
		description: 'Create & view payouts, invoices, taxes, view account statements and reports.'
	},
	{
		id: '3',
		name: 'Operations',
		type: 'Default',
		userCount: 8,
		description: 'Create & view payouts, view invoices and taxes. Limited access to financial data.'
	},
	{
		id: '4',
		name: 'Chartered Accountant',
		type: 'Default',
		userCount: 2,
		description:
			'View & download reports only. No access to the payment or payout creation features.'
	},
	{
		id: '5',
		name: 'View Only',
		type: 'Default',
		userCount: 6,
		description: 'View & download payouts, invoices, taxes, reports, and account statements.'
	},
	{
		id: '6',
		name: 'QA Manager',
		type: 'Custom',
		userCount: 3,
		description:
			'Manage QA workflows, review test reports, approve releases, and view all test metrics.'
	},
	{
		id: '7',
		name: 'Organization Wallet Admin',
		type: 'Custom',
		userCount: 3,
		description:
			'Full control over organization wallet management, fund transfers, and balance reports.'
	},
	{
		id: '8',
		name: 'Onboarding Read Only',
		type: 'Custom',
		userCount: 2,
		description:
			'View onboarding workflows and application statuses. Cannot approve or modify submissions.'
	},
	{
		id: '9',
		name: 'Billing Manager',
		type: 'Custom',
		userCount: 4,
		description: 'Manage billing cycles, invoices, payment terms, and subscription configuration.'
	},
	{
		id: '10',
		name: 'Support Agent',
		type: 'Default',
		userCount: 7,
		description: 'Handle customer support tickets, view transaction history, and initiate refunds.'
	},
	{
		id: '11',
		name: 'Read Only Auditor',
		type: 'Custom',
		userCount: 1,
		description: 'Full read access to all financial records, audit logs, and compliance documents.'
	},
	{
		id: '12',
		name: 'Developer',
		type: 'Default',
		userCount: 5,
		description: 'Access API keys, webhooks, sandbox environment, and integration testing tools.'
	},
	{
		id: '13',
		name: 'Finance Analyst',
		type: 'Custom',
		userCount: 2,
		description: 'Analyze revenue data, generate financial reports, and track KPIs and metrics.'
	},
	{
		id: '14',
		name: 'Super Admin',
		type: 'System Default',
		userCount: 3,
		description:
			'Unrestricted access to all features including user management, billing, and system configuration.'
	},
	{
		id: '15',
		name: 'Compliance Officer',
		type: 'Custom',
		userCount: 1,
		description:
			'Access compliance dashboard, KYC reports, risk flags, and regulatory filing tools.'
	},
	{
		id: '16',
		name: 'Settlements Manager',
		type: 'Custom',
		userCount: 2,
		description:
			'Manage settlement schedules, view settlement reports, and configure payout frequencies.'
	},
	{
		id: '17',
		name: 'Tax Consultant',
		type: 'Custom',
		userCount: 1,
		description: 'View and download tax invoices, GST reports, and financial statements for filing.'
	},
	{
		id: '18',
		name: 'Refund Manager',
		type: 'Custom',
		userCount: 2,
		description: 'Initiate and approve refunds, view refund history, and manage dispute resolution.'
	},
	{
		id: '19',
		name: 'Risk Analyst',
		type: 'Custom',
		userCount: 1,
		description:
			'Monitor transaction risk scores, review flagged payments, and configure risk rules.'
	},
	{
		id: '20',
		name: 'Partner Manager',
		type: 'Custom',
		userCount: 3,
		description:
			'Manage partner accounts, view partner transaction data, and configure revenue splits.'
	},
	{
		id: '21',
		name: 'KYC Verifier',
		type: 'Custom',
		userCount: 4,
		description:
			'Review KYC submissions, approve or reject documents, and escalate flagged accounts.'
	},
	{
		id: '22',
		name: 'Product Manager',
		type: 'Custom',
		userCount: 2,
		description:
			'View product analytics, manage feature flags, and access payment method configuration.'
	}
];

export const GET: RequestHandler = async ({ url }) => {
	const query = (url.searchParams.get('q') ?? '').trim().toLowerCase();
	await new Promise((r) => setTimeout(r, 400));
	const filtered = query
		? MOCK_ROLES.filter((r) => r.name.toLowerCase().includes(query))
		: MOCK_ROLES;
	const items = filtered;
	return json({ filtered, items });
};
