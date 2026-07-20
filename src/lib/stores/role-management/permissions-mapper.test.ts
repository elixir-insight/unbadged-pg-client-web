import { describe, expect, it } from 'vitest';
import { collectSelectedPermissionIds, mapPermissionsCatalog } from './permissions-mapper';

describe('mapPermissionsCatalog', () => {
	it('maps API modules to UI catalog with permission ids', () => {
		const catalog = mapPermissionsCatalog([
			{
				module: 'REPORTS',
				permissions: [
					{ id: 1015, name: 'read', description: 'View reports' },
					{ id: 1016, name: 'write', description: 'Download reports' }
				]
			},
			{
				module: 'ROLE_MANAGEMENT',
				permissions: [
					{ id: 1025, name: 'read', description: 'View roles' },
					{ id: 1026, name: 'write', description: 'Edit roles' },
					{ id: 1027, name: 'delete', description: 'Delete roles' }
				]
			}
		]);

		expect(catalog.modules.map((m) => m.id)).toEqual(['REPORTS', 'ROLE_MANAGEMENT']);
		expect(catalog.optionsByModule.REPORTS).toHaveLength(2);
		expect(catalog.optionsByModule.REPORTS[0]).toMatchObject({
			key: 'read',
			apiName: 'read',
			id: 1015
		});
		expect(catalog.optionsByModule.REPORTS[1]).toMatchObject({
			key: 'writeUnrestricted',
			apiName: 'write',
			id: 1016
		});
		expect(catalog.permissionIds.ROLE_MANAGEMENT).toEqual({
			read: 1025,
			write: 1026,
			delete: 1027
		});
	});

	it('collects selected permission ids from form state', () => {
		const catalog = mapPermissionsCatalog([
			{
				module: 'REPORTS',
				permissions: [
					{ id: 1015, name: 'read', description: 'View reports' },
					{ id: 1016, name: 'write', description: 'Download reports' }
				]
			}
		]);

		const ids = collectSelectedPermissionIds(
			{
				REPORTS: {
					read: true,
					writeUnrestricted: true,
					writeRestricted: false,
					delete: false,
					approve: false,
					fullAccess: false
				}
			},
			catalog.optionsByModule
		);

		expect(ids).toEqual([1015, 1016]);
	});
});
