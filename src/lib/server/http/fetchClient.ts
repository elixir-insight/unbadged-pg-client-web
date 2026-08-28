import * as v from 'valibot';
import type { Logger } from 'pino';
import { buildUrl } from './query';
import type { ApiError, Result } from './errors';

export async function apiFetch<TSchema extends v.GenericSchema>(
	path: string,
	opts: {
		fetch: typeof globalThis.fetch;
		schema: TSchema;
		logger: Logger;
		accessToken?: string;
		gatewayToken?: string;
		skipAuth?: boolean;
		method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
		body?: unknown;
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

	const isFormDataBody = typeof FormData !== 'undefined' && opts.body instanceof FormData;

	const headers: Record<string, string> = {
		...opts.extraHeaders
	};
	if (!isFormDataBody) {
		headers['Content-Type'] = 'application/json';
	}
	if (!opts.skipAuth && accessToken && gatewayToken) {
		headers.Authorization = `Bearer ${accessToken}`;
		headers['X-Gateway-Token'] = gatewayToken;
	}

	log.info({ url }, `outbound request → ${url}`);
	log.debug({ headers, multipart: isFormDataBody }, 'outbound request');

	try {
		const requestBody: BodyInit | undefined = isFormDataBody
			? (opts.body as FormData)
			: opts.body
				? JSON.stringify(opts.body)
				: undefined;

		const res = await opts.fetch(url, {
			method,
			headers,
			body: requestBody,
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
			const errorMessage = errorBody?.message ?? `Request failed (${status})`;
			log.warn(
				{
					status,
					httpStatus: res.status,
					exceptionCode: errorBody?.exceptionCode,
					message: errorMessage,
					durationMs
				},
				`request failed — ${errorMessage}`
			);
			return {
				ok: false,
				error: {
					kind: 'http',
					status,
					code: errorBody?.exceptionCode,
					message: errorMessage,
					// Some business "errors" still carry usable data (e.g. the
					// password-change challenge on sign-in) — keep it for callers.
					body: json
				} satisfies ApiError
			};
		}

		const parsed = v.safeParse(opts.schema, json);
		if (!parsed.success) {
			const issues = parsed.issues.map((issue) => ({
				path: issue.path?.map((segment) => segment.key).join('.'),
				message: issue.message,
				expected: issue.expected,
				received: issue.received
			}));
			log.warn({ status: res.status, durationMs, issues }, 'response validation failed');
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
