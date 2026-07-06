let _email = $state('');
let _firstName = $state('');
let _lastName = $state('');
let _employeeId = $state('');
let _mobileNumber = $state('');
let _selectedRoles = $state<string[]>([]);
let _reportingManagerId = $state<string | null>(null);
let _reportingManagerName = $state('');
let _reportingManagerEmployeeId = $state('');
let _reportingManagerEmail = $state('');

export const createUserFormStore = {
	get email() {
		return _email;
	},
	set email(value: string) {
		_email = value;
	},
	get firstName() {
		return _firstName;
	},
	set firstName(value: string) {
		_firstName = value;
	},
	get lastName() {
		return _lastName;
	},
	set lastName(value: string) {
		_lastName = value;
	},
	get employeeId() {
		return _employeeId;
	},
	set employeeId(value: string) {
		_employeeId = value;
	},
	get mobileNumber() {
		return _mobileNumber;
	},
	set mobileNumber(value: string) {
		_mobileNumber = value;
	},
	get selectedRoles() {
		return _selectedRoles;
	},
	get selectedRoleCount() {
		return _selectedRoles.length;
	},
	get reportingManagerId() {
		return _reportingManagerId;
	},
	get reportingManagerName() {
		return _reportingManagerName;
	},
	get reportingManagerEmployeeId() {
		return _reportingManagerEmployeeId;
	},
	get reportingManagerEmail() {
		return _reportingManagerEmail;
	},
	get fullName() {
		return [_firstName.trim(), _lastName.trim()].filter(Boolean).join(' ');
	},
	get initials() {
		const first = _firstName.trim().charAt(0);
		const last = _lastName.trim().charAt(0);
		return (first + last || first).toUpperCase() || '?';
	},
	get formattedMobile() {
		return _mobileNumber.trim() ? `+91${_mobileNumber.trim()}` : '';
	},
	get isValid() {
		return _email.trim().length > 0 && _firstName.trim().length > 0;
	},
	get statusSummary() {
		const roleText =
			_selectedRoles.length === 0
				? 'No roles selected'
				: _selectedRoles.length === 1
					? '1 role selected'
					: `${_selectedRoles.length} roles selected`;

		const managerText = _reportingManagerName
			? `Reports to ${_reportingManagerName}`
			: 'No manager assigned';

		return `${roleText} · ${managerText}`;
	},

	toggleRole(role: string) {
		if (_selectedRoles.includes(role)) {
			_selectedRoles = _selectedRoles.filter((item) => item !== role);
		} else {
			_selectedRoles = [..._selectedRoles, role];
		}
	},

	setReportingManager(id: string, name: string, employeeId = '', email = '') {
		_reportingManagerId = id;
		_reportingManagerName = name;
		_reportingManagerEmployeeId = employeeId;
		_reportingManagerEmail = email;
	},

	clearReportingManager() {
		_reportingManagerId = null;
		_reportingManagerName = '';
		_reportingManagerEmployeeId = '';
		_reportingManagerEmail = '';
	},

	clear() {
		_email = '';
		_firstName = '';
		_lastName = '';
		_employeeId = '';
		_mobileNumber = '';
		_selectedRoles = [];
		_reportingManagerId = null;
		_reportingManagerName = '';
		_reportingManagerEmployeeId = '';
		_reportingManagerEmail = '';
	},

	reset() {
		createUserFormStore.clear();
	}
};
