import * as v from 'valibot';
import type { Logger } from 'pino';
import { buildUrl } from './query';
import type { ApiError, Result } from './errors';

type ApiFetchBody = FormData | Record<string, unknown> | null;

export async function apiFetch<TSchema extends v.GenericSchema>(
	path: string,
	opts: {
		fetch: typeof globalThis.fetch;
		schema: TSchema;
		logger: Logger;
		accessToken?: string;
		gatewayToken?: string;
		skipAuth?: boolean;
		method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
		body?: ApiFetchBody;
		query?: Record<string, string | number | undefined>;
		extraHeaders?: Record<string, string>;
	}
): Promise<Result<v.InferOutput<TSchema>>> {
	if (!opts.skipAuth && (!opts.accessToken || !opts.gatewayToken)) {
		throw new Error(
			`apiFetch(${path}): accessToken and gatewayToken required unless skipAuth is set`
		);
	}

	const { accessToken, gatewayToken } = opts;

	const url = buildUrl(path, opts.query);
	const method = opts.method ?? 'GET';
	const callId = crypto.randomUUID().slice(0, 8);
	const log = opts.logger.child({ callId, method, path, url });
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 15_000);
	const start = Date.now();

	const isFormData = typeof FormData !== 'undefined' && opts.body instanceof FormData;
	const headers: Record<string, string> = {
		...opts.extraHeaders
	};
	if (!isFormData) {
		headers['Content-Type'] = 'application/json';
	}
	if (!opts.skipAuth && accessToken && gatewayToken) {
		headers.Authorization = `Bearer ${accessToken}`;
		headers['X-Gateway-Token'] = gatewayToken;
	}

	log.debug({ headers }, 'outbound request');

	try {
		const body: BodyInit | undefined = isFormData
			? (opts.body as FormData)
			: opts.body
				? JSON.stringify(opts.body)
				: undefined;

		const res = await opts.fetch(url, {
			method,
			headers,
			body,
			signal: controller.signal
		});
		const json: unknown = await res.json().catch(() => null);
		const durationMs = Date.now() - start;

		const errorBody =
			json && typeof json === 'object'
				? (json as { exceptionCode?: string; message?: string; statusCode?: number })
				: null;

		// Upstream sometimes returns business errors with 2xx (e.g. sign-in session exists → 202).
		if (!res.ok || errorBody?.exceptionCode) {
			const status = errorBody?.statusCode ?? res.status;
			log.warn(
				{
					status,
					httpStatus: res.status,
					exceptionCode: errorBody?.exceptionCode,
					durationMs
				},
				'request failed'
			);
			return {
				ok: false,
				error: {
					kind: 'http',
					status,
					code: errorBody?.exceptionCode,
					message: errorBody?.message ?? `Request failed (${status})`
				} satisfies ApiError
			};
		}

		const parsed = v.safeParse(opts.schema, json);
		if (!parsed.success) {
			log.warn(
				{ status: res.status, durationMs, issues: parsed.issues },
				'response validation failed'
			);
			return {
				ok: false,
				error: {
					kind: 'validation',
					message: 'Unexpected response shape',
					issues: parsed.issues
				}
			};
		}

		log.debug({ status: res.status, durationMs }, 'request succeeded');
		return { ok: true, data: parsed.output };
	} catch (e) {
		const isAbort = e instanceof DOMException && e.name === 'AbortError';
		const message = isAbort
			? 'Request timed out'
			: e instanceof Error
				? e.message
				: 'Network error';
		log.error({ err: e, durationMs: Date.now() - start }, `network error — ${message}`);
		return {
			ok: false,
			error: {
				kind: 'network',
				message
			}
		};
	} finally {
		clearTimeout(timeout);
	}
}
