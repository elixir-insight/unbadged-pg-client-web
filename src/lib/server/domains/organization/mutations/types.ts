export type MutationFailure = {
	ok: false;
	status: number;
	message: string;
	exceptionCode?: string;
};

export type MutationSuccess<T> = {
	ok: true;
} & T;

export type MutationResult<T> = MutationSuccess<T> | MutationFailure;

export function mutationFailure(
	status: number,
	message: string,
	exceptionCode?: string
): MutationFailure {
	return { ok: false, status, message, ...(exceptionCode ? { exceptionCode } : {}) };
}

export function upstreamErrorToFailure(error: {
	kind: string;
	message: string;
	status?: number;
	code?: string;
}): MutationFailure {
	if (error.kind === 'http') {
		return mutationFailure(error.status ?? 502, error.message, error.code);
	}
	return mutationFailure(502, error.message);
}
