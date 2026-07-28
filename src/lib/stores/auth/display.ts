import { formatLabel } from '$lib/utils/format-label';

/** Human-readable label for gateway `userType` values (e.g. ROOT → Root). */
export function formatUserType(userType: string): string {
	return formatLabel(userType);
}

export function getUserInitials(name: string): string {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length >= 2) {
		return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
	}
	return (parts[0]?.slice(0, 2) ?? '?').toUpperCase();
}
