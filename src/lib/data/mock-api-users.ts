import type { ApiUserDetailItem, ApiUserListItem } from '$lib/stores/user-management/api-types';

export const MOCK_API_USERS: ApiUserListItem[] = [
	{
		userId: 100497,
		userName: 'Mani K',
		userEmail: 'manikandanelixir@gmail.com',
		employeeId: 'JBP001',
		roles: ['Onboarding Admin'],
		enabled: false
	},
	{
		userId: 100430,
		userName: 'Brock Howard',
		userEmail: 'brock@gmail.com',
		employeeId: 'QA1234',
		roles: ['QA Manager'],
		enabled: true
	},
	{
		userId: 100363,
		userName: 'Dinesh Kumar',
		userEmail: 'dinesh@abc.in',
		employeeId: 'QA1003',
		roles: ['Quality Analyst'],
		enabled: false
	},
	{
		userId: 100132,
		userName: 'Babu A',
		userEmail: 'Babu12@gmail.com',
		employeeId: 'B0012',
		roles: ['Onboarding Admin'],
		enabled: true
	},
	{
		userId: 100066,
		userName: 'Mrinal Kumar',
		userEmail: 'MrinalKumar99@gmail.com',
		employeeId: 'LC001',
		roles: [
			'Onboarding Read Only',
			'Quality Analyst',
			'Onboarding Admin',
			'QA Manager',
			'Organization Wallet Management Admin',
			'Billing Manager',
			'Organization Management Admin',
			'Organization Management Read Only'
		],
		enabled: false
	},
	{
		userId: 100008,
		userName: 'John Doe',
		userEmail: 'abdullahbaig8@outlook.com',
		employeeId: 'QA1002',
		roles: ['QA Manager', 'Organization Wallet Management Admin'],
		enabled: false
	},
	{
		userId: 100007,
		userName: 'Abdullah Baig',
		userEmail: 'baigabdullah174@gmail.com',
		employeeId: 'JBP1001',
		roles: ['Organization Management Admin', 'Organization Management Read Only'],
		enabled: false
	},
	{
		userId: 100005,
		userName: 'Vibu Roshin',
		userEmail: 'viburoshin25@gmail.com',
		employeeId: 'EMP0025',
		roles: ['Onboarding Admin', 'Organization Management Admin'],
		enabled: true
	}
];

const MOCK_API_USER_DETAILS: Record<number, ApiUserDetailItem> = {
	100497: {
		userId: 100497,
		userName: 'Mani K',
		userEmail: 'manikandanelixir@gmail.com',
		employeeId: 'JBP001',
		phoneNumber: '+919884126120',
		roleDetails: [{ roleId: 1, roleName: 'Onboarding Admin' }],
		reportingTo: {
			id: 100008,
			name: 'John Doe',
			employeeId: 'QA1002',
			userEmail: 'abdullahbaig8@outlook.com'
		},
		enabled: false,
		createdBy: 100000,
		assignedUsers: []
	},
	100430: {
		userId: 100430,
		userName: 'Brock Howard',
		userEmail: 'brock@gmail.com',
		employeeId: 'QA1234',
		phoneNumber: '+919876543210',
		roleDetails: [{ roleId: 2, roleName: 'QA Manager' }],
		reportingTo: {
			id: 100005,
			name: 'Vibu Roshin',
			employeeId: 'EMP0025',
			userEmail: 'viburoshin25@gmail.com'
		},
		enabled: false,
		createdBy: 100000,
		assignedUsers: []
	},
	100363: {
		userId: 100363,
		userName: 'Dinesh Kumar',
		userEmail: 'dinesh@abc.in',
		employeeId: 'QA1003',
		phoneNumber: '+919123456789',
		roleDetails: [{ roleId: 3, roleName: 'Quality Analyst' }],
		reportingTo: {
			id: 100008,
			name: 'John Doe',
			employeeId: 'QA1002',
			userEmail: 'abdullahbaig8@outlook.com'
		},
		enabled: false,
		createdBy: 100000,
		assignedUsers: []
	},
	100132: {
		userId: 100132,
		userName: 'Babu A',
		userEmail: 'Babu12@gmail.com',
		employeeId: 'B0012',
		phoneNumber: '+919876543211',
		roleDetails: [{ roleId: 1, roleName: 'Onboarding Admin' }],
		reportingTo: {
			id: 100005,
			name: 'Vibu Roshin',
			employeeId: 'EMP0025',
			userEmail: 'viburoshin25@gmail.com'
		},
		enabled: false,
		createdBy: 100000,
		assignedUsers: []
	},
	100066: {
		userId: 100066,
		userName: 'Mrinal Kumar',
		userEmail: 'MrinalKumar99@gmail.com',
		employeeId: 'LC001',
		phoneNumber: '+919123456780',
		roleDetails: [
			{ roleId: 4, roleName: 'Onboarding Read Only' },
			{ roleId: 5, roleName: 'Quality Analyst' },
			{ roleId: 1, roleName: 'Onboarding Admin' },
			{ roleId: 2, roleName: 'QA Manager' },
			{ roleId: 6, roleName: 'Organization Wallet Management Admin' },
			{ roleId: 7, roleName: 'Billing Manager' },
			{ roleId: 8, roleName: 'Organization Management Admin' },
			{ roleId: 9, roleName: 'Organization Management Read Only' }
		],
		reportingTo: {
			id: 100005,
			name: 'Vibu Roshin',
			employeeId: 'EMP0025',
			userEmail: 'viburoshin25@gmail.com'
		},
		enabled: false,
		createdBy: 100000,
		assignedUsers: []
	},
	100008: {
		userId: 100008,
		userName: 'John Doe',
		userEmail: 'abdullahbaig8@outlook.com',
		employeeId: 'QA1002',
		phoneNumber: '+919988776655',
		roleDetails: [
			{ roleId: 2, roleName: 'QA Manager' },
			{ roleId: 6, roleName: 'Organization Wallet Management Admin' }
		],
		reportingTo: {
			id: 100005,
			name: 'Vibu Roshin',
			employeeId: 'EMP0025',
			userEmail: 'viburoshin25@gmail.com'
		},
		enabled: false,
		createdBy: 100000,
		assignedUsers: []
	},
	100007: {
		userId: 100007,
		userName: 'Abdullah Baig',
		userEmail: 'baigabdullah174@gmail.com',
		employeeId: 'JBP1001',
		phoneNumber: '+919356728546',
		roleDetails: [
			{ roleId: 8, roleName: 'Organization Management Admin' },
			{ roleId: 9, roleName: 'Organization Management Read Only' }
		],
		reportingTo: {
			id: 100008,
			name: 'John Doe',
			employeeId: 'QA1002',
			userEmail: 'abdullahbaig8@outlook.com'
		},
		enabled: false,
		createdBy: 100000,
		assignedUsers: []
	},
	100005: {
		userId: 100005,
		userName: 'Vibu Roshin',
		userEmail: 'viburoshin25@gmail.com',
		employeeId: 'EMP0025',
		phoneNumber: '+919012345678',
		roleDetails: [
			{ roleId: 1, roleName: 'Onboarding Admin' },
			{ roleId: 8, roleName: 'Organization Management Admin' }
		],
		enabled: true,
		createdBy: 100000,
		assignedUsers: []
	}
};

export function getMockApiUserDetail(userId: number): ApiUserDetailItem | undefined {
	return MOCK_API_USER_DETAILS[userId];
}
