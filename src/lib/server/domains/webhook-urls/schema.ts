import * as v from 'valibot';

export const WebhookUrlItemSchema = v.object({
	id: v.union([v.string(), v.number()]),
	eventType: v.string(),
	webhookUrl: v.string(),
	isActive: v.boolean(),
	createdAt: v.string(),
	updatedAt: v.string()
});

export const WebhookUrlListResponseSchema = v.object({
	data: v.array(WebhookUrlItemSchema),
	message: v.string(),
	statusCode: v.number(),
	pagination: v.optional(v.unknown())
});

export const WebhookUrlCreateResponseSchema = v.object({
	data: v.array(WebhookUrlItemSchema),
	message: v.string(),
	statusCode: v.number(),
	pagination: v.optional(v.unknown())
});

export interface UpdateWebhookBody {
	eventType?: string;
	isActive?: boolean;
	secretKey?: string;
	webhookUrl?: string;
}

export const AddWebhookBodySchema = v.object({
	eventType: v.pipe(v.string(), v.trim(), v.minLength(1, 'Event type is required.')),
	webhookUrl: v.pipe(
		v.string(),
		v.trim(),
		v.check((value) => !/\s/.test(value), 'Enter a valid http:// or https:// URL.'),
		v.url('Enter a valid http:// or https:// URL.'),
		v.check(
			(value) => value.startsWith('http://') || value.startsWith('https://'),
			'Enter a valid http:// or https:// URL.'
		)
	),
	secretKey: v.pipe(v.string(), v.minLength(1, 'Secret key is required.'))
});

export const UpdateWebhookBodySchema = v.pipe(
	v.object({
		eventType: v.optional(v.pipe(v.string(), v.trim(), v.minLength(1, 'Event type is required.'))),
		isActive: v.optional(v.boolean()),
		secretKey: v.optional(v.pipe(v.string(), v.minLength(1, 'Secret key cannot be empty.'))),
		webhookUrl: v.optional(
			v.pipe(
				v.string(),
				v.trim(),
				v.check((value) => !/\s/.test(value), 'Enter a valid http:// or https:// URL.'),
				v.url('Enter a valid http:// or https:// URL.'),
				v.check(
					(value) => value.startsWith('http://') || value.startsWith('https://'),
					'Enter a valid http:// or https:// URL.'
				)
			)
		)
	}),
	v.check((body) => Object.keys(body).length > 0, 'Change at least one field before saving.')
);

export const WebhookUrlUpdateResponseSchema = v.object({
	data: v.array(v.unknown()),
	message: v.string(),
	pagination: v.optional(v.unknown()),
	statusCode: v.number()
});
