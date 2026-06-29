export interface Organization {
	[key: string]: unknown;
	id: string;
	name: string;
	businessType: string;
	category: 'Merchant' | 'Partner' | 'Reseller';
	status: 'Pending' | 'In Review' | 'In Progress' | 'Approved' | 'Active' | 'On Hold' | 'Rejected';
	kybStatus: 'Not Started' | 'In Progress' | 'Verified' | 'Failed';
	createdAt: string;
	assignedAdmin: string;
	resubmitted?: boolean;
}

// Onboarding: Pending | In Review | In Progress
// Organization: Approved | Active | On Hold | Rejected
export const organizations: Organization[] = [
	{
		id: 'ORG-1000',
		name: 'Northwind Capital',
		businessType: 'E-commerce',
		category: 'Merchant',
		status: 'Pending',
		kybStatus: 'Not Started',
		createdAt: '2024-12-31',
		assignedAdmin: 'Sarah Chen'
	},
	{
		id: 'ORG-1001',
		name: 'Apex Logistics',
		businessType: 'SaaS',
		category: 'Reseller',
		status: 'In Review',
		kybStatus: 'In Progress',
		createdAt: '2025-03-05',
		assignedAdmin: 'Bob Martinez',
		resubmitted: true
	},
	{
		id: 'ORG-1002',
		name: 'Lumen Health',
		businessType: 'Financial Services',
		category: 'Partner',
		status: 'Active',
		kybStatus: 'Verified',
		createdAt: '2025-05-10',
		assignedAdmin: 'Carol Lee'
	},
	{
		id: 'ORG-1003',
		name: 'Vertex Robotics',
		businessType: 'Healthcare',
		category: 'Merchant',
		status: 'Pending',
		kybStatus: 'Not Started',
		createdAt: '2025-07-15',
		assignedAdmin: 'David Kim'
	},
	{
		id: 'ORG-1004',
		name: 'Pulse Payments',
		businessType: 'Retail',
		category: 'Reseller',
		status: 'In Review',
		kybStatus: 'In Progress',
		createdAt: '2025-09-20',
		assignedAdmin: 'Alice Johnson'
	},
	{
		id: 'ORG-1005',
		name: 'Orbit Marketplace',
		businessType: 'Marketplace',
		category: 'Partner',
		status: 'On Hold',
		kybStatus: 'Verified',
		createdAt: '2025-11-25',
		assignedAdmin: 'Eve Torres'
	},
	{
		id: 'ORG-1006',
		name: 'Stellar Foods',
		businessType: 'Education',
		category: 'Merchant',
		status: 'Pending',
		kybStatus: 'Not Started',
		createdAt: '2025-01-03',
		assignedAdmin: 'Frank Nguyen'
	},
	{
		id: 'ORG-1007',
		name: 'Pinnacle Wealth Mgmt',
		businessType: 'Financial Services',
		category: 'Merchant',
		status: 'In Review',
		kybStatus: 'In Progress',
		createdAt: '2025-02-18',
		assignedAdmin: 'Carol Lee'
	},
	{
		id: 'ORG-1008',
		name: 'GreenPay Solutions',
		businessType: 'SaaS',
		category: 'Reseller',
		status: 'Approved',
		kybStatus: 'Verified',
		createdAt: '2025-04-09',
		assignedAdmin: 'Bob Martinez'
	},
	{
		id: 'ORG-1009',
		name: 'Horizon Insurance Co',
		businessType: 'Healthcare',
		category: 'Merchant',
		status: 'Approved',
		kybStatus: 'Verified',
		createdAt: '2025-06-22',
		assignedAdmin: 'Alice Johnson'
	},
	{
		id: 'ORG-1010',
		name: 'Crestline Digital',
		businessType: 'E-commerce',
		category: 'Partner',
		status: 'Pending',
		kybStatus: 'Not Started',
		createdAt: '2025-08-14',
		assignedAdmin: 'David Kim'
	},
	{
		id: 'ORG-1011',
		name: 'Ironclad Payments',
		businessType: 'Retail',
		category: 'Merchant',
		status: 'In Review',
		kybStatus: 'In Progress',
		createdAt: '2025-10-07',
		assignedAdmin: 'Eve Torres'
	},
	{
		id: 'ORG-1012',
		name: 'BlueSky Commerce',
		businessType: 'Marketplace',
		category: 'Reseller',
		status: 'Rejected',
		kybStatus: 'Failed',
		createdAt: '2025-12-01',
		assignedAdmin: 'Frank Nguyen'
	},
	{
		id: 'ORG-1013',
		name: 'Summit Ventures',
		businessType: 'SaaS',
		category: 'Partner',
		status: 'Active',
		kybStatus: 'Verified',
		createdAt: '2026-01-19',
		assignedAdmin: 'Carol Lee'
	},
	{
		id: 'ORG-1014',
		name: 'Cascade Fintech',
		businessType: 'Financial Services',
		category: 'Merchant',
		status: 'In Progress',
		kybStatus: 'In Progress',
		createdAt: '2026-03-11',
		assignedAdmin: 'Bob Martinez'
	},
	{
		id: 'ORG-1015',
		name: 'Redwood Capital',
		businessType: 'E-commerce',
		category: 'Reseller',
		status: 'On Hold',
		kybStatus: 'Verified',
		createdAt: '2026-05-02',
		assignedAdmin: 'Alice Johnson'
	},
	{
		id: 'ORG-1016',
		name: 'Nimbus Fintech',
		businessType: 'Financial Services',
		category: 'Partner',
		status: 'Active',
		kybStatus: 'Verified',
		createdAt: '2026-01-08',
		assignedAdmin: 'Sarah Chen'
	},
	{
		id: 'ORG-1017',
		name: 'Vortex Payments',
		businessType: 'SaaS',
		category: 'Merchant',
		status: 'Rejected',
		kybStatus: 'Failed',
		createdAt: '2025-11-14',
		assignedAdmin: 'David Kim'
	},
	{
		id: 'ORG-1018',
		name: 'Solaris Trade Co',
		businessType: 'Retail',
		category: 'Reseller',
		status: 'In Progress',
		kybStatus: 'In Progress',
		createdAt: '2026-04-03',
		assignedAdmin: 'Eve Torres'
	},
	{
		id: 'ORG-1019',
		name: 'Kestrel Analytics',
		businessType: 'E-commerce',
		category: 'Partner',
		status: 'In Review',
		kybStatus: 'In Progress',
		createdAt: '2026-02-27',
		assignedAdmin: 'Frank Nguyen',
		resubmitted: true
	},
	{
		id: 'ORG-1020',
		name: 'Meridian Payments',
		businessType: 'Marketplace',
		category: 'Merchant',
		status: 'Approved',
		kybStatus: 'Verified',
		createdAt: '2025-09-11',
		assignedAdmin: 'Alice Johnson'
	}
];
