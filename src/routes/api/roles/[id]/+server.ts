import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { RoleDetail } from '$lib/stores/role-management/role-management';

const MOCK_ROLE_DETAILS: RoleDetail[] = [
	{
		roleInfo: {
			roleId: 34,
			roleName: 'QUALITY_ANALYST',
			roleAssignedCount: 1,
			defaultRole: false
		},
		permissions: [
			{ name: 'read', id: 1000 },
			{ name: 'write', id: 1001 },
			{ name: 'write-restricted', id: 1002 },
			{ name: 'read', id: 1005 },
			{ name: 'read', id: 1010 },
			{ name: 'read', id: 1015 },
			{ name: 'read', id: 1020 },
			{ name: 'read', id: 1025 },
			{ name: 'write', id: 1026 },
			{ name: 'read', id: 1027 },
			{ name: 'read', id: 1030 }
		],
		users: [
			{ userName: 'Mrinal Kumar', email: 'mrinal.kumar@company.com' },
			{ userName: 'Priya Sharma', email: 'priya.sharma@company.com' },
			{ userName: 'Rahul Verma', email: 'rahul.verma@company.com' },
			{ userName: 'Ananya Iyer', email: 'ananya.iyer@company.com' }
		]
	},
	{
		roleInfo: {
			roleId: 32,
			roleName: 'ADMIN',
			roleAssignedCount: 0,
			defaultRole: false
		},
		permissions: [
			{ name: 'read', id: 1000 },
			{ name: 'write', id: 1001 },
			{ name: 'write-restricted', id: 1002 },
			{ name: 'delete', id: 1003 },
			{ name: 'approve', id: 1004 },
			{ name: 'read', id: 1005 },
			{ name: 'write', id: 1006 },
			{ name: 'write-restricted', id: 1007 },
			{ name: 'delete', id: 1008 },
			{ name: 'approve', id: 1009 },
			{ name: 'read', id: 1010 },
			{ name: 'write', id: 1011 },
			{ name: 'write-restricted', id: 1012 },
			{ name: 'delete', id: 1013 },
			{ name: 'approve', id: 1014 },
			{ name: 'read', id: 1015 },
			{ name: 'write', id: 1016 },
			{ name: 'write-restricted', id: 1017 },
			{ name: 'delete', id: 1018 },
			{ name: 'approve', id: 1019 },
			{ name: 'read', id: 1020 },
			{ name: 'write', id: 1021 },
			{ name: 'delete', id: 1022 },
			{ name: 'read', id: 1025 },
			{ name: 'write', id: 1026 },
			{ name: 'read', id: 1027 },
			{ name: 'write', id: 1028 },
			{ name: 'delete', id: 1029 },
			{ name: 'read', id: 1030 },
			{ name: 'write', id: 1031 },
			{ name: 'delete', id: 1032 }
		],
		users: [
			{ userName: 'Vikram Singh', email: 'vikram.singh@company.com' },
			{ userName: 'Sneha Nair', email: 'sneha.nair@company.com' },
			{ userName: 'Arjun Patel', email: 'arjun.patel@company.com' },
			{ userName: 'Neha Gupta', email: 'neha.gupta@company.com' },
			{ userName: 'Karthik Reddy', email: 'karthik.reddy@company.com' },
			{ userName: 'Meera Joshi', email: 'meera.joshi@company.com' }
		]
	},
	{
		roleInfo: {
			roleId: 31,
			roleName: 'QA_MANAGER',
			roleAssignedCount: 1,
			defaultRole: false
		},
		permissions: [
			{ name: 'read', id: 1000 },
			{ name: 'write', id: 1001 },
			{ name: 'write-restricted', id: 1002 },
			{ name: 'approve', id: 1004 },
			{ name: 'read', id: 1005 },
			{ name: 'read', id: 1010 },
			{ name: 'read', id: 1015 },
			{ name: 'read', id: 1020 },
			{ name: 'read', id: 1025 },
			{ name: 'write', id: 1026 },
			{ name: 'read', id: 1027 },
			{ name: 'write', id: 1028 },
			{ name: 'read', id: 1030 },
			{ name: 'write', id: 1031 }
		],
		users: [
			{ userName: 'Sanjay Kumar', email: 'sanjay.k@company.com' },
			{ userName: 'Aisha Khan', email: 'aisha.khan@company.com' },
			{ userName: 'Siddharth Rao', email: 'siddharth.rao@company.com' }
		]
	},
	{
		roleInfo: {
			roleId: 30,
			roleName: 'TESTER',
			roleAssignedCount: 0,
			defaultRole: false
		},
		permissions: [
			{ name: 'read', id: 1000 },
			{ name: 'read', id: 1005 },
			{ name: 'read', id: 1010 },
			{ name: 'read', id: 1015 },
			{ name: 'read', id: 1020 },
			{ name: 'read', id: 1025 },
			{ name: 'read', id: 1027 },
			{ name: 'read', id: 1030 }
		],
		users: [
			{ userName: 'Aisha Khan', email: 'aisha.khan@company.com' },
			{ userName: 'Siddharth Rao', email: 'siddharth.rao@company.com' }
		]
	},
	{
		roleInfo: {
			roleId: 67,
			roleName: 'ONBOARDING_TEAM_LEAD',
			roleAssignedCount: 1,
			defaultRole: false
		},
		permissions: [
			{ name: 'read', id: 1000 },
			{ name: 'write', id: 1001 },
			{ name: 'write-restricted', id: 1002 },
			{ name: 'delete', id: 1003 },
			{ name: 'approve', id: 1004 },
			{ name: 'read', id: 1005 },
			{ name: 'write', id: 1006 },
			{ name: 'read', id: 1027 },
			{ name: 'read', id: 1030 }
		],
		users: [{ userName: 'Divya Menon', email: 'divya.menon@company.com' }]
	},
	{
		roleInfo: {
			roleId: 7,
			roleName: 'ORGANIZATION_WALLET_MANAGEMENT_READ_ONLY',
			roleAssignedCount: 1,
			defaultRole: true
		},
		permissions: [
			{ name: 'read', id: 1010 },
			{ name: 'read', id: 1015 }
		],
		users: [{ userName: 'Farhan Sheikh', email: 'farhan.sheikh@company.com' }]
	},
	{
		roleInfo: {
			roleId: 199,
			roleName: 'QA_LEAD',
			roleAssignedCount: 0,
			defaultRole: false
		},
		permissions: [
			{ name: 'read', id: 1000 },
			{ name: 'write', id: 1001 },
			{ name: 'write-restricted', id: 1002 },
			{ name: 'approve', id: 1004 },
			{ name: 'read', id: 1005 },
			{ name: 'read', id: 1010 },
			{ name: 'read', id: 1015 },
			{ name: 'read', id: 1020 },
			{ name: 'read', id: 1025 },
			{ name: 'write', id: 1026 },
			{ name: 'read', id: 1027 },
			{ name: 'write', id: 1028 },
			{ name: 'read', id: 1030 },
			{ name: 'write', id: 1031 }
		],
		users: [
			{ userName: 'Siddharth Rao', email: 'siddharth.rao@company.com' },
			{ userName: 'Pooja Das', email: 'pooja.das@company.com' },
			{ userName: 'Amit Kulkarni', email: 'amit.kulkarni@company.com' }
		]
	},
	{
		roleInfo: {
			roleId: 166,
			roleName: 'DELIVERY_MANAGER',
			roleAssignedCount: 0,
			defaultRole: false
		},
		permissions: [
			{ name: 'read', id: 1000 },
			{ name: 'read', id: 1005 },
			{ name: 'read', id: 1010 },
			{ name: 'read', id: 1015 },
			{ name: 'read', id: 1020 },
			{ name: 'read', id: 1025 },
			{ name: 'write', id: 1026 },
			{ name: 'read', id: 1027 },
			{ name: 'read', id: 1030 }
		],
		users: [
			{ userName: 'Siddharth Rao', email: 'siddharth.rao@company.com' },
			{ userName: 'Pooja Das', email: 'pooja.das@company.com' }
		]
	},
	{
		roleInfo: {
			roleId: 133,
			roleName: 'BUSINESS_DEVELOPMENT_LEAD',
			roleAssignedCount: 0,
			defaultRole: false
		},
		permissions: [
			{ name: 'read', id: 1000 },
			{ name: 'write', id: 1001 },
			{ name: 'read', id: 1005 },
			{ name: 'write', id: 1006 },
			{ name: 'read', id: 1020 },
			{ name: 'write', id: 1021 },
			{ name: 'read', id: 1025 },
			{ name: 'write', id: 1026 },
			{ name: 'read', id: 1027 }
		],
		users: []
	},
	{
		roleInfo: {
			roleId: 100,
			roleName: 'HEAD_OF_GLOBAL_PARTNERSHIPS',
			roleAssignedCount: 0,
			defaultRole: false
		},
		permissions: [
			{ name: 'read', id: 1000 },
			{ name: 'write', id: 1001 },
			{ name: 'approve', id: 1004 },
			{ name: 'read', id: 1005 },
			{ name: 'write', id: 1006 },
			{ name: 'approve', id: 1009 },
			{ name: 'read', id: 1020 },
			{ name: 'write', id: 1021 },
			{ name: 'delete', id: 1022 },
			{ name: 'read', id: 1025 },
			{ name: 'write', id: 1026 },
			{ name: 'read', id: 1027 },
			{ name: 'read', id: 1030 }
		],
		users: [
			{ userName: 'Karthik Reddy', email: 'karthik.reddy@company.com' },
			{ userName: 'Meera Joshi', email: 'meera.joshi@company.com' },
			{ userName: 'Siddharth Rao', email: 'siddharth.rao@company.com' },
			{ userName: 'Pooja Das', email: 'pooja.das@company.com' }
		]
	}
];

export const GET: RequestHandler = async ({ params }) => {
	const id = Number(params.id);
	await new Promise((r) => setTimeout(r, 300));
	const role = MOCK_ROLE_DETAILS.find((r) => r.roleInfo.roleId === id);
	if (!role) {
		return json({
			roleInfo: {
				roleId: id,
				roleName: `ROLE_${id}`,
				roleAssignedCount: 0,
				defaultRole: false
			},
			permissions: [],
			users: []
		} satisfies import('$lib/stores/role-management/role-management').RoleDetail);
	}
	return json(role);
};
