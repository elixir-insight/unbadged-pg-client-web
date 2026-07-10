import * as v from 'valibot';

const userFormSchema = v.object({
	email: v.pipe(
		v.string(),
		v.trim(),
		v.minLength(1, 'Email address is required'),
		v.email('Enter a valid email address')
	),
	firstName: v.pipe(v.string(), v.trim(), v.minLength(1, 'First name is required')),
	employeeId: v.pipe(v.string(), v.trim(), v.minLength(1, 'Employee ID is required')),
	mobileNumber: v.pipe(
		v.string(),
		v.trim(),
		v.minLength(1, 'Mobile number is required'),
		v.check(
			(val) => /^[6-9]\d{9}$/.test(val.replace(/\D/g, '')),
			'Enter a valid 10-digit Indian mobile number'
		)
	)
});

export interface UserFormInput {
	email: string;
	firstName: string;
	employeeId: string;
	mobileNumber: string;
	selectedRoles: string[];
	reportingManagerId: string | null;
}

export function validateUserForm(input: UserFormInput): Record<string, string> {
	const errors: Record<string, string> = {};

	const result = v.safeParse(userFormSchema, {
		email: input.email,
		firstName: input.firstName,
		employeeId: input.employeeId,
		mobileNumber: input.mobileNumber
	});

	if (!result.success) {
		for (const issue of result.issues) {
			const key = issue.path?.[0]?.key as string | undefined;
			if (key && !errors[key]) errors[key] = issue.message;
		}
	}

	if (input.selectedRoles.length === 0) {
		errors.selectedRoles = 'Select at least one role';
	}

	if (!input.reportingManagerId) {
		errors.reportingManager = 'Select a reporting manager';
	}

	return errors;
}

export function firstValidationError(errors: Record<string, string>): string | null {
	const values = Object.values(errors);
	return values.length === 0 ? null : values[0];
}
