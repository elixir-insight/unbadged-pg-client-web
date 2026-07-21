import { describe, expect, it } from 'vitest';
import type { ApiUserDetailItem } from './api-types';
import { mapApiDetailUser } from './user-mapper';

function createApiUser(overrides: Partial<ApiUserDetailItem> = {}): ApiUserDetailItem {
	return {
		id: 100001,
		userName: 'Supervisor',
		userEmail: 'supervisor@example.com',
		roles: [],
		enabled: true,
		...overrides
	};
}

describe('mapApiDetailUser', () => {
	it('maps assigned users and derives their count when no count is provided', () => {
		const user = mapApiDetailUser(
			createApiUser({
				assignedUsers: [
					{ id: 100002, name: 'Vibu' },
					{ id: 100004, name: 'Roshin' }
				]
			})
		);

		expect(user.assignedUsers).toEqual([
			{ id: '100002', name: 'Vibu' },
			{ id: '100004', name: 'Roshin' }
		]);
		expect(user.assignedUsersCount).toBe(2);
	});
});
