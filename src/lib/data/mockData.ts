export interface Organization {
	[key: string]: unknown;
	id: string;
	name: string;
	businessType: string;
	category: 'MERCHANT' | 'PARTNER' | 'RESELLER';
	status: 'PENDING' | 'IN_REVIEW' | 'IN_PROGRESS' | 'APPROVED' | 'ACTIVE' | 'ON_HOLD' | 'REJECTED';
	kybStatus: 'Not Started' | 'IN_PROGRESS' | 'VERIFIED' | 'FAILED';
	createdAt: string;
	assignedAdmin: string;
	resubmitted?: boolean;
}

export const organizations: Organization[] = [
	{
		id: 'ORG-1000',
		name: 'Northwind Capital',
		businessType: 'PARTNERSHIP',
		category: 'MERCHANT',
		status: 'PENDING',
		kybStatus: 'Not Started',
		createdAt: '2024-12-31',
		assignedAdmin: 'Sarah Chen'
	},
	{
		id: 'ORG-1001',
		name: 'Apex Logistics',
		businessType: 'LLP',
		category: 'RESELLER',
		status: 'IN_REVIEW',
		kybStatus: 'IN_PROGRESS',
		createdAt: '2025-03-05',
		assignedAdmin: 'Bob Martinez',
		resubmitted: true
	},
	{
		id: 'ORG-1002',
		name: 'Lumen Health',
		businessType: 'LLP',
		category: 'PARTNER',
		status: 'ACTIVE',
		kybStatus: 'VERIFIED',
		createdAt: '2025-05-10',
		assignedAdmin: 'Carol Lee'
	},
	{
		id: 'ORG-1003',
		name: 'Vertex Robotics',
		businessType: 'PRIVATE_LIMITED',
		category: 'MERCHANT',
		status: 'PENDING',
		kybStatus: 'Not Started',
		createdAt: '2025-07-15',
		assignedAdmin: 'David Kim'
	},
	{
		id: 'ORG-1004',
		name: 'Pulse Payments',
		businessType: 'PRIVATE_LIMITED',
		category: 'RESELLER',
		status: 'IN_REVIEW',
		kybStatus: 'IN_PROGRESS',
		createdAt: '2025-09-20',
		assignedAdmin: 'Alice Johnson'
	},
	{
		id: 'ORG-1005',
		name: 'Orbit PRIVATE_LIMITED',
		businessType: 'PRIVATE_LIMITED',
		category: 'PARTNER',
		status: 'ON_HOLD',
		kybStatus: 'VERIFIED',
		createdAt: '2025-11-25',
		assignedAdmin: 'Eve Torres'
	},
	{
		id: 'ORG-1006',
		name: 'Stellar Foods',
		businessType: 'SOLE_PROPRIETORSHIP',
		category: 'MERCHANT',
		status: 'PENDING',
		kybStatus: 'Not Started',
		createdAt: '2025-01-03',
		assignedAdmin: 'Frank Nguyen'
	},
	{
		id: 'ORG-1007',
		name: 'Pinnacle Wealth Mgmt',
		businessType: 'LLP',
		category: 'MERCHANT',
		status: 'IN_REVIEW',
		kybStatus: 'IN_PROGRESS',
		createdAt: '2025-02-18',
		assignedAdmin: 'Carol Lee'
	},
	{
		id: 'ORG-1008',
		name: 'GreenPay Solutions',
		businessType: 'LLP',
		category: 'RESELLER',
		status: 'APPROVED',
		kybStatus: 'VERIFIED',
		createdAt: '2025-04-09',
		assignedAdmin: 'Bob Martinez'
	},
	{
		id: 'ORG-1009',
		name: 'Horizon Insurance Co',
		businessType: 'PRIVATE_LIMITED',
		category: 'MERCHANT',
		status: 'APPROVED',
		kybStatus: 'VERIFIED',
		createdAt: '2025-06-22',
		assignedAdmin: 'Alice Johnson'
	},
	{
		id: 'ORG-1010',
		name: 'Crestline Digital',
		businessType: 'PARTNERSHIP',
		category: 'PARTNER',
		status: 'PENDING',
		kybStatus: 'Not Started',
		createdAt: '2025-08-14',
		assignedAdmin: 'David Kim'
	},
	{
		id: 'ORG-1011',
		name: 'Ironclad Payments',
		businessType: 'PRIVATE_LIMITED',
		category: 'MERCHANT',
		status: 'IN_REVIEW',
		kybStatus: 'IN_PROGRESS',
		createdAt: '2025-10-07',
		assignedAdmin: 'Eve Torres'
	},
	{
		id: 'ORG-1012',
		name: 'BlueSky Commerce',
		businessType: 'PRIVATE_LIMITED',
		category: 'RESELLER',
		status: 'REJECTED',
		kybStatus: 'FAILED',
		createdAt: '2025-12-01',
		assignedAdmin: 'Frank Nguyen'
	},
	{
		id: 'ORG-1013',
		name: 'Summit Ventures',
		businessType: 'LLP',
		category: 'PARTNER',
		status: 'ACTIVE',
		kybStatus: 'VERIFIED',
		createdAt: '2026-01-19',
		assignedAdmin: 'Carol Lee'
	},
	{
		id: 'ORG-1014',
		name: 'Cascade Fintech',
		businessType: 'LLP',
		category: 'MERCHANT',
		status: 'IN_PROGRESS',
		kybStatus: 'IN_PROGRESS',
		createdAt: '2026-03-11',
		assignedAdmin: 'Bob Martinez'
	},
	{
		id: 'ORG-1015',
		name: 'Redwood Capital',
		businessType: 'PARTNERSHIP',
		category: 'RESELLER',
		status: 'ON_HOLD',
		kybStatus: 'VERIFIED',
		createdAt: '2026-05-02',
		assignedAdmin: 'Alice Johnson'
	},
	{
		id: 'ORG-1016',
		name: 'Nimbus Fintech',
		businessType: 'LLP',
		category: 'PARTNER',
		status: 'ACTIVE',
		kybStatus: 'VERIFIED',
		createdAt: '2026-01-08',
		assignedAdmin: 'Sarah Chen'
	},
	{
		id: 'ORG-1017',
		name: 'Vortex Payments',
		businessType: 'LLP',
		category: 'MERCHANT',
		status: 'REJECTED',
		kybStatus: 'FAILED',
		createdAt: '2025-11-14',
		assignedAdmin: 'David Kim'
	},
	{
		id: 'ORG-1018',
		name: 'Solaris Trade Co',
		businessType: 'PRIVATE_LIMITED',
		category: 'RESELLER',
		status: 'IN_PROGRESS',
		kybStatus: 'IN_PROGRESS',
		createdAt: '2026-04-03',
		assignedAdmin: 'Eve Torres'
	},
	{
		id: 'ORG-1019',
		name: 'Kestrel Analytics',
		businessType: 'PARTNERSHIP',
		category: 'PARTNER',
		status: 'IN_REVIEW',
		kybStatus: 'IN_PROGRESS',
		createdAt: '2026-02-27',
		assignedAdmin: 'Frank Nguyen',
		resubmitted: true
	},
	{
		id: 'ORG-1020',
		name: 'Meridian Payments',
		businessType: 'PRIVATE_LIMITED',
		category: 'MERCHANT',
		status: 'APPROVED',
		kybStatus: 'VERIFIED',
		createdAt: '2025-09-11',
		assignedAdmin: 'Alice Johnson'
	}
];
