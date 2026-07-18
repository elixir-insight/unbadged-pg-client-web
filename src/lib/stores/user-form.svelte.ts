export type { UserItem, UserStatus } from '$lib/stores/user-management/user-management';

import type { UserItem } from '$lib/stores/user-management/user-management';

let _viewUser = $state<UserItem | null>(null);

export const userFormStore = {
	get viewUser() {
		return _viewUser;
	},
	setViewUser(user: UserItem) {
		_viewUser = user;
	},
	reset() {
		_viewUser = null;
	}
};
