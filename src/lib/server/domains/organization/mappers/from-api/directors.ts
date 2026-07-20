import { createMissingDirectorDocument, type OrganizationDirector } from '$lib/data/mockData';

function asRecord(value: unknown): Record<string, unknown> | null {
	if (value && typeof value === 'object' && !Array.isArray(value)) {
		return value as Record<string, unknown>;
	}
	return null;
}

function asString(value: unknown, fallback = ''): string {
	if (typeof value === 'string') return value.trim();
	if (typeof value === 'number' && Number.isFinite(value)) return String(value);
	return fallback;
}

export function mapDirectors(value: unknown): OrganizationDirector[] {
	if (!Array.isArray(value)) return [];
	return value
		.map((item, index) => {
			const record = asRecord(item);
			if (!record) return null;
			const id = asString(record.id ?? record.directorId, `director-${index + 1}`);
			return {
				id,
				name: asString(record.name),
				pan: asString(record.pan),
				email: asString(record.email),
				phone: asString(record.phoneNumber ?? record.phone),
				aadhar: asString(record.aadhar),
				aadharDocument: createMissingDirectorDocument(`${id}-aadhar`),
				panDocument: createMissingDirectorDocument(`${id}-pan`)
			};
		})
		.filter((director): director is OrganizationDirector => director !== null);
}
