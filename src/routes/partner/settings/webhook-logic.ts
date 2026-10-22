export interface WebhookUrlRow extends Record<string, unknown> {
	id: string;
	eventType: string;
	webhookUrl: string;
	isActive: boolean;
	createdAt: string;
}

export interface WebhookEditValues {
	eventType: string;
	webhookUrl: string;
	isActive: boolean;
	secretKey: string;
}

export interface WebhookUpdatePayload {
	eventType?: string;
	webhookUrl?: string;
	isActive?: boolean;
	secretKey?: string;
}

export function isValidWebhookUrl(value: string): boolean {
	if (/\s/.test(value)) return false;

	try {
		const parsed = new URL(value);
		return parsed.protocol === 'http:' || parsed.protocol === 'https:';
	} catch {
		return false;
	}
}

type ActionResultLike =
	| { type: 'success'; status: number; data?: Record<string, unknown> }
	| { type: 'failure'; status: number; data?: Record<string, unknown> }
	| { type: 'redirect'; status: number; location: string }
	| { type: 'error'; status?: number; error: unknown };

export type WebhookFormField = 'eventType' | 'webhookUrl' | 'secretKey' | 'general';

export type AddWebhookOutcome =
	{ kind: 'added' } | { kind: 'error'; message: string; field: WebhookFormField };

export type UpdateWebhookOutcome =
	| { kind: 'updated' }
	| { kind: 'error'; message: string; field: WebhookFormField; retryable: boolean };

const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again.';

export function buildWebhookUpdatePayload(
	original: WebhookUrlRow,
	current: WebhookEditValues
): WebhookUpdatePayload {
	const payload: WebhookUpdatePayload = {};
	const eventType = current.eventType.trim();
	const webhookUrl = current.webhookUrl.trim();

	if (eventType !== original.eventType) payload.eventType = eventType;
	if (webhookUrl !== original.webhookUrl) payload.webhookUrl = webhookUrl;
	if (current.isActive !== original.isActive) payload.isActive = current.isActive;
	if (current.secretKey.length > 0) payload.secretKey = current.secretKey;

	return payload;
}

/** No per-field error keys come back from the server ΓÇö only a single `message`
 *  string (see api-credential-logic.ts for the same convention) ΓÇö so field
 *  attribution is inferred from message content, falling back to a general
 *  form-level error when nothing matches. */
export function classifyWebhookErrorField(message: string): WebhookFormField {
	const lower = message.toLowerCase();
	if (lower.includes('event')) return 'eventType';
	if (lower.includes('url')) return 'webhookUrl';
	if (lower.includes('secret')) return 'secretKey';
	return 'general';
}

export function parseAddWebhookResult(result: ActionResultLike): AddWebhookOutcome {
	if (result.type === 'success') {
		return { kind: 'added' };
	}
	if (result.type === 'failure') {
		const message = typeof result.data?.message === 'string' ? result.data.message : undefined;
		const finalMessage = message ?? GENERIC_ERROR_MESSAGE;
		return { kind: 'error', message: finalMessage, field: classifyWebhookErrorField(finalMessage) };
	}
	return { kind: 'error', message: GENERIC_ERROR_MESSAGE, field: 'general' };
}

export function parseUpdateWebhookResult(result: ActionResultLike): UpdateWebhookOutcome {
	if (result.type === 'success') {
		return { kind: 'updated' };
	}
	if (result.type === 'failure') {
		const message = typeof result.data?.message === 'string' ? result.data.message : undefined;
		const finalMessage = message ?? GENERIC_ERROR_MESSAGE;
		return {
			kind: 'error',
			message: finalMessage,
			field: result.status === 400 ? classifyWebhookErrorField(finalMessage) : 'general',
			retryable: result.data?.retryable === true || result.status >= 500
		};
	}
	return {
		kind: 'error',
		message: GENERIC_ERROR_MESSAGE,
		field: 'general',
		retryable: true
	};
}
