import * as v from 'valibot';

const roleFormSchema = v.object({
	name: v.pipe(v.string(), v.trim(), v.minLength(1, 'Role name is required')),
	description: v.pipe(v.string(), v.trim(), v.minLength(1, 'Description is required'))
});

export interface RoleFormInput {
	name: string;
	description: string;
	selectedPermissionCount: number;
	/** Existing role names from the org — used to block duplicates on create. */
	existingRoleNames?: string[];
	/** When editing, the current role name is allowed to match itself. */
	excludeRoleName?: string;
}

/** Normalize for comparison: "Finance Manager" ≡ "FINANCE_MANAGER" ≡ "finance-manager". */
export function normalizeRoleNameKey(value: string): string {
	return value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '');
}

export function isRoleNameTaken(
	name: string,
	existingRoleNames: string[],
	excludeRoleName?: string
): boolean {
	const key = normalizeRoleNameKey(name);
	if (!key) return false;

	const excluded = excludeRoleName ? normalizeRoleNameKey(excludeRoleName) : '';

	return existingRoleNames.some((existing) => {
		const existingKey = normalizeRoleNameKey(existing);
		if (!existingKey) return false;
		if (excluded && existingKey === excluded) return false;
		return existingKey === key;
	});
}

/** Convert SCREAMING_SNAKE_CASE (or similar) to Title Case for the role name input. */
export function formatRoleName(value: string): string {
	const trimmed = value.trim();
	if (!trimmed) return '';

	if (trimmed.includes('_')) {
		return trimmed
			.split('_')
			.filter(Boolean)
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
			.join(' ');
	}

	return trimmed;
}

export function validateRoleForm(input: RoleFormInput): Record<string, string> {
	const errors: Record<string, string> = {};

	const result = v.safeParse(roleFormSchema, {
		name: input.name,
		description: input.description
	});

	if (!result.success) {
		for (const issue of result.issues) {
			const key = issue.path?.[0]?.key as string | undefined;
			if (key && !errors[key]) errors[key] = issue.message;
		}
	}

	if (
		!errors.name &&
		isRoleNameTaken(input.name, input.existingRoleNames ?? [], input.excludeRoleName)
	) {
		errors.name = 'Role name already exists. Please choose a different name.';
	}

	if (input.selectedPermissionCount <= 0) {
		errors.permissions = 'Select at least one permission';
	}

	return errors;
}

export function firstValidationError(errors: Record<string, string>): string | null {
	const values = Object.values(errors);
	return values.length === 0 ? null : values[0];
}
