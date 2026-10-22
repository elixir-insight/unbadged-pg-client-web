export type ApiError =
	| { kind: 'network'; message: string }
	| { kind: 'http'; status: number; code?: string; message: string; body?: unknown }
	| {
			kind: 'validation';
			message: string;
			issues?: unknown;
			/** Truncated upstream body when the response was not the expected JSON shape. */
			bodyPreview?: string;
			contentType?: string | null;
			httpStatus?: number;
	  };

export type Result<T> = { ok: true; data: T } | { ok: false; error: ApiError };
