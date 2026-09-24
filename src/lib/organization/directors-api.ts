import { resolve } from '$app/paths';

export function isPersistedDirectorId(id: string): boolean {
	return /^\d+$/.test(id.trim());
}

export type DirectorSaveFields = {
	id: string;
	name: string;
	pan: string;
	email: string;
	phone: string;
	aadhar: string;
};

export type DirectorUpdateItem = {
	id?: string;
	name: string;
	pan: string;
	email: string;
	phone: string;
	aadhar: string;
};

function directorFieldsChanged(current: DirectorSaveFields, previous: DirectorSaveFields): boolean {
	return (
		previous.name !== current.name ||
		previous.pan !== current.pan ||
		previous.email !== current.email ||
		previous.phone !== current.phone ||
		previous.aadhar !== current.aadhar
	);
}

/** KYB update appends directors; only send drafts and changed persisted records. */
export function toDirectorUpdateItems<T extends DirectorSaveFields>(
	directors: T[],
	baseline: T[]
): DirectorUpdateItem[] {
	return directors
		.filter((director) => {
			if (!isPersistedDirectorId(director.id)) return true;
			const previous = baseline.find((item) => item.id === director.id);
			return !previous || directorFieldsChanged(director, previous);
		})
		.map(({ id, ...fields }) => ({
			...(isPersistedDirectorId(id) ? { id } : {}),
			...fields
		}));
}

export type DeleteDirectorResult = {
	message: string;
};

export async function deleteDirector(
	orgId: string,
	directorId: string
): Promise<DeleteDirectorResult> {
	const response = await fetch(
		resolve('/api/management/onboard/organization/[orgId]/directors/[directorId]', {
			orgId,
			directorId
		}),
		{ method: 'DELETE' }
	);

	const body: { message?: string } = await response.json().catch(() => ({}));

	if (!response.ok) {
		throw new Error(body.message ?? 'Could not delete director');
	}

	return {
		message: body.message ?? 'Director deleted successfully'
	};
}
