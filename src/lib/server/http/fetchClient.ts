import * as v from 'valibot';
import { buildUrl } from './query';
import type { ApiError, Result } from './errors';

export async function apiFetch<TSchema extends v.GenericSchema>(
	path: string,
	opts: {
		fetch: typeof globalThis.fetch;
		schema: TSchema;
		idToken?: string;
		skipAuth?: boolean;
		method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
		body?: unknown;
		query?: Record<string, string | number | undefined>;
		extraHeaders?: Record<string, string>;
	}
): Promise<Result<v.InferOutput<TSchema>>> {
	if (!opts.skipAuth && !opts.idToken) {
		throw new Error(`apiFetch(${path}): idToken required unless skipAuth is set`);
	}

	const url = buildUrl(path, opts.query);
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 15_000);

	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
		...opts.extraHeaders
	};
	if (!opts.skipAuth) headers.Authorization = `Bearer ${opts.idToken}`;

	try {
		const res = await opts.fetch(url, {
			method: opts.method ?? 'GET',
			headers,
			body: opts.body ? JSON.stringify(opts.body) : undefined,
			signal: controller.signal
		});
		const json: unknown = await res.json().catch(() => null);
		console.log(json, 'data');

		if (!res.ok) {
			const errorBody =
				json && typeof json === 'object'
					? (json as { exceptionCode?: string; message?: string })
					: null;
			return {
				ok: false,
				error: {
					kind: 'http',
					status: res.status,
					code: errorBody?.exceptionCode,
					message: errorBody?.message ?? `Request failed (${res.status})`
				} satisfies ApiError
			};
		}

		const parsed = v.safeParse(opts.schema, json);
		if (!parsed.success) {
			return {
				ok: false,
				error: {
					kind: 'validation',
					message: 'Unexpected response shape',
					issues: parsed.issues
				}
			};
		}
		return { ok: true, data: parsed.output };
	} catch (e) {
		const isAbort = e instanceof DOMException && e.name === 'AbortError';
		return {
			ok: false,
			error: {
				kind: 'network',
				message: isAbort ? 'Request timed out' : e instanceof Error ? e.message : 'Network error'
			}
		};
	} finally {
		clearTimeout(timeout);
	}
}
