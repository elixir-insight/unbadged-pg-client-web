export type ApiError =
	| { kind: 'network'; message: string }
	| { kind: 'http'; status: number; code?: string; message: string }
	| { kind: 'validation'; message: string; issues?: unknown };

export type Result<T> = { ok: true; data: T } | { ok: false; error: ApiError };
