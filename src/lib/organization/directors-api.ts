import { resolve } from '$app/paths';

export function isPersistedDirectorId(id: string): boolean {
	return /^\d+$/.test(id.trim());
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
