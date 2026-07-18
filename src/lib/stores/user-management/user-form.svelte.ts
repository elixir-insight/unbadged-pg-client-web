class CreateUserFormStore {
	email = $state('');
	firstName = $state('');
	lastName = $state('');
	employeeId = $state('');
	mobileNumber = $state('');
	selectedRoles = $state<string[]>([]);
	reportingManagerId = $state<string | null>(null);
	reportingManagerName = $state('');
	reportingManagerEmployeeId = $state('');
	reportingManagerEmail = $state('');

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

	get isValid() {
		return this.email.trim().length > 0 && this.firstName.trim().length > 0;
	}

	get selectedRoleCount() {
		return this.selectedRoles.length;
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

	toggleRole(role: string) {
		if (this.selectedRoles.includes(role)) {
			this.selectedRoles = this.selectedRoles.filter((item) => item !== role);
		} else {
			this.selectedRoles = [...this.selectedRoles, role];
		}
	}

	setReportingManager(id: string, name: string, employeeId = '', email = '') {
		this.reportingManagerId = id;
		this.reportingManagerName = name;
		this.reportingManagerEmployeeId = employeeId;
		this.reportingManagerEmail = email;
	}

	clearReportingManager() {
		this.reportingManagerId = null;
		this.reportingManagerName = '';
		this.reportingManagerEmployeeId = '';
		this.reportingManagerEmail = '';
	}

	clear() {
		this.email = '';
		this.firstName = '';
		this.lastName = '';
		this.employeeId = '';
		this.mobileNumber = '';
		this.selectedRoles = [];
		this.reportingManagerId = null;
		this.reportingManagerName = '';
		this.reportingManagerEmployeeId = '';
		this.reportingManagerEmail = '';
	}

	reset() {
		this.clear();
	}
}

export const createUserFormStore = new CreateUserFormStore();
