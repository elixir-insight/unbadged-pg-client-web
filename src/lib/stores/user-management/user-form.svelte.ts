import type { UserItem } from './user-management';
import { validateUserForm } from './validation';

export type SelectedRole = {
	roleId: number;
	roleName: string;
	displayName: string;
};

interface EditSnapshot {
	email: string;
	firstName: string;
	lastName: string;
	employeeId: string;
	mobileNumber: string;
	selectedRoles: string;
	reportingManagerId: string | null;
	reportingManagerName: string;
	reportingManagerEmployeeId: string;
	reportingManagerEmail: string;
}

function splitName(name: string): { firstName: string; lastName: string } {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return { firstName: '', lastName: '' };
	if (parts.length === 1) return { firstName: parts[0], lastName: '' };
	return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

function snapshotFromStore(store: CreateUserFormStore): EditSnapshot {
	return {
		email: store.email,
		firstName: store.firstName,
		lastName: store.lastName,
		employeeId: store.employeeId,
		mobileNumber: store.mobileNumber,
		selectedRoles: JSON.stringify(store.selectedRoles),
		reportingManagerId: store.reportingManagerId,
		reportingManagerName: store.reportingManagerName,
		reportingManagerEmployeeId: store.reportingManagerEmployeeId,
		reportingManagerEmail: store.reportingManagerEmail
	};
}

class CreateUserFormStore {
	email = $state('');
	firstName = $state('');
	lastName = $state('');
	employeeId = $state('');
	mobileNumber = $state('');
	selectedRoles = $state<SelectedRole[]>([]);
	reportingManagerId = $state<string | null>(null);
	reportingManagerName = $state('');
	reportingManagerEmployeeId = $state('');
	reportingManagerEmail = $state('');
	isEditMode = $state(false);
	userId = $state<string | null>(null);

	#snapshot: EditSnapshot | null = null;

	get fullName() {
		return [this.firstName.trim(), this.lastName.trim()].filter(Boolean).join(' ');
	}

	get initials() {
		const first = this.firstName.trim().charAt(0);
		const last = this.lastName.trim().charAt(0);
		return (first + last || first).toUpperCase() || '?';
	}

	get formattedMobile() {
		return this.mobileNumber.trim() ? `+91${this.mobileNumber.trim()}` : '';
	}

	get selectedRoleIds() {
		return this.selectedRoles.map((role) => role.roleId);
	}

	get validationErrors() {
		return validateUserForm({
			email: this.email,
			firstName: this.firstName,
			employeeId: this.employeeId,
			mobileNumber: this.mobileNumber,
			selectedRoles: this.selectedRoles,
			reportingManagerId: this.reportingManagerId
		});
	}

	get isValid() {
		return Object.keys(this.validationErrors).length === 0;
	}

	get selectedRoleCount() {
		return this.selectedRoles.length;
	}

	get hasChanges() {
		const snapshot = this.#snapshot;
		if (!this.isEditMode || !snapshot) return true;
		return JSON.stringify(snapshotFromStore(this)) !== JSON.stringify(snapshot);
	}

	get statusSummary() {
		const roleText =
			this.selectedRoles.length === 0
				? 'No roles selected'
				: this.selectedRoles.length === 1
					? '1 role selected'
					: `${this.selectedRoles.length} roles selected`;

		const managerText = this.reportingManagerName
			? `Reports to ${this.reportingManagerName}`
			: 'No manager assigned';

		return `${roleText} · ${managerText}`;
	}

	isRoleSelected(roleId: number) {
		return this.selectedRoles.some((role) => role.roleId === roleId);
	}

	toggleRole(role: SelectedRole) {
		if (this.isRoleSelected(role.roleId)) {
			this.selectedRoles = this.selectedRoles.filter((item) => item.roleId !== role.roleId);
		} else {
			this.selectedRoles = [...this.selectedRoles, role];
		}
	}

	/** Match selected roles (often display names from detail) to org role IDs. */
	syncRolesFromAssignable(roles: Array<{ roleId: number; roleName: string; displayName: string }>) {
		const normalize = (value: string) => value.toLowerCase().replace(/[\s_]+/g, '');

		this.selectedRoles = this.selectedRoles
			.map((selected) => {
				const match = roles.find(
					(role) =>
						role.roleId === selected.roleId ||
						role.roleName === selected.roleName ||
						role.displayName === selected.displayName ||
						normalize(role.roleName) === normalize(selected.displayName) ||
						normalize(role.displayName) === normalize(selected.displayName)
				);
				return match
					? {
							roleId: match.roleId,
							roleName: match.roleName,
							displayName: match.displayName
						}
					: null;
			})
			.filter((role): role is SelectedRole => role !== null);
	}

	/** Re-capture baseline after async hydration (e.g. role ID sync) so hasChanges stays accurate. */
	commitSnapshot() {
		if (!this.isEditMode) return;
		this.#snapshot = snapshotFromStore(this);
	}

	setReportingManager(id: string, name: string, employeeId = '', email = '') {
		this.reportingManagerId = id;
		this.reportingManagerName = name;
		this.reportingManagerEmployeeId = employeeId;
		this.reportingManagerEmail = email;
	}

	/** Emails are case-insensitive — normalize before preview / API submit. */
	normalizeEmail() {
		this.email = this.email.trim().toLowerCase();
	}

	clearReportingManager() {
		this.reportingManagerId = null;
		this.reportingManagerName = '';
		this.reportingManagerEmployeeId = '';
		this.reportingManagerEmail = '';
	}

	loadForEdit(user: UserItem) {
		const { firstName, lastName } = splitName(user.name);

		this.isEditMode = true;
		this.userId = user.id;
		this.email = user.email;
		this.firstName = firstName;
		this.lastName = lastName;
		this.employeeId = user.employeeId;
		this.mobileNumber = user.mobileNumber ?? '';
		// Placeholder role IDs until syncRolesFromAssignable maps display names → org role IDs.
		this.selectedRoles = (user?.roles ?? []).map((displayName, index) => ({
			roleId: -(index + 1),
			roleName: displayName,
			displayName
		}));

		if (user.reportingManager) {
			this.setReportingManager(
				user.reportingManager.id,
				user.reportingManager.name,
				user.reportingManager.employeeId,
				user.reportingManager.email
			);
		} else {
			this.clearReportingManager();
		}

		this.#snapshot = snapshotFromStore(this);
	}

	restore() {
		const snapshot = this.#snapshot;
		if (!snapshot) {
			this.clear();
			return;
		}

		this.email = snapshot.email;
		this.firstName = snapshot.firstName;
		this.lastName = snapshot.lastName;
		this.employeeId = snapshot.employeeId;
		this.mobileNumber = snapshot.mobileNumber;
		this.selectedRoles = JSON.parse(snapshot.selectedRoles) as SelectedRole[];
		this.reportingManagerId = snapshot.reportingManagerId;
		this.reportingManagerName = snapshot.reportingManagerName;
		this.reportingManagerEmployeeId = snapshot.reportingManagerEmployeeId;
		this.reportingManagerEmail = snapshot.reportingManagerEmail;
	}

	clear() {
		this.email = '';
		this.firstName = '';
		this.lastName = '';
		this.employeeId = '';
		this.mobileNumber = '';
		this.selectedRoles = [];
		this.clearReportingManager();
	}

	reset() {
		this.clear();
		this.isEditMode = false;
		this.userId = null;
		this.#snapshot = null;
	}
}

export const createUserFormStore = new CreateUserFormStore();
