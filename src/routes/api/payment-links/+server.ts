import { json } from '@sveltejs/kit';
import * as v from 'valibot';
import type { RequestHandler } from './$types';
import { createPaymentLinkMutation } from '$lib/server/domains/payment-links/mutations/create';
import { CreatePaymentLinkClientRequestSchema } from '$lib/server/domains/payment-links/schema';

function httpStatus(status: number): number {
	return status >= 400 && status <= 599 ? status : 502;
}

export const POST: RequestHandler = async ({ request, cookies, locals, fetch }) => {
	const rawBody: unknown = await request.json().catch(() => null);
	const parsedBody = v.safeParse(CreatePaymentLinkClientRequestSchema, rawBody);
	if (!parsedBody.success) {
		return json({ message: parsedBody.issues[0]?.message ?? 'Invalid request' }, { status: 400 });
	}

	const result = await createPaymentLinkMutation({
		fetch,
		log: locals.logger,
		cookies,
		body: parsedBody.output
	});

	if (!result.ok) {
		const conflict =
			result.status === 409 || /already exists for (the )?reference/i.test(result.message);
		return json(
			{ message: result.message },
			{ status: conflict ? 409 : httpStatus(result.status) }
		);
	}

	return json(result.created, { status: 201 });
};
