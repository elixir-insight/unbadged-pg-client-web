import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { toBankPayload } from '$lib/api/onboarding';
import { onboardingClient } from '$lib/server/domains/onboarding/client';
import { extractAccountId, extractBankAccounts } from '$lib/server/domains/onboarding/extract';
import { requireOnboardingSession } from '$lib/server/domains/onboarding/guard';
import type { BankDetails } from '$lib/types/onboarding';

/**
 * GET /organization/bank-accounts was never called anywhere before this — bank state lived only
 * in the client's sessionStorage wizard store, so a resumed session (new tab, cleared storage)
 * had no way to learn accounts already exist upstream. Best-effort like the layout's org fetch:
 * on failure, the client just keeps whatever it already has locally.
 */
export const load: PageServerLoad = async ({ cookies, fetch, locals }) => {
	const session = await requireOnboardingSession({
		cookies,
		fetch,
		log: locals.logger,
		groups: locals.merchantSession?.groups
	});
	if (!session.ok) return { bankAccounts: [] };

	const result = await onboardingClient.getBankAccounts(fetch, locals.logger, session.tokens);
	if (!result.ok) return { bankAccounts: [] };

	const accounts = extractBankAccounts(result.data.data);
	return {
		bankAccounts: accounts.map((account) => ({
			accountId:
				typeof account.id === 'number'
					? account.id
					: typeof account.id === 'string'
						? Number(account.id)
						: undefined,
			accountHolderName: account.holderName ?? '',
			accountNumber: account.accountNumber ?? '',
			confirmAccountNumber: account.accountNumber ?? '',
			ifscCode: account.ifscCode ?? '',
			bankName: account.bankName ?? '',
			branchName: account.branchName ?? '',
			accountType: account.accountType ?? ''
		}))
	};
};

export const actions: Actions = {
	default: async ({ request, cookies, fetch, locals }) => {
		const session = await requireOnboardingSession({
			cookies,
			fetch,
			log: locals.logger,
			groups: locals.merchantSession?.groups
		});
		if (!session.ok) return session.failure;

		let banks: BankDetails[];
		try {
			const form = await request.formData();
			banks = JSON.parse(String(form.get('payload') ?? '')) as BankDetails[];
		} catch {
			return fail(400, { error: 'Malformed request.' });
		}

		// Each bank account is its own create/update call (no batch endpoint like organization
		// directors have) — saved in order, positionally matched back to accountIds on the client.
		// Keeps going on a failure instead of stopping, so one bad account (e.g. #2) can't strand
		// an already-created one (#1) without an id the client will ever learn about — that id
		// would otherwise be silently dropped and #1 would be POSTed again as a duplicate on retry.
		const accountIds: (number | undefined)[] = [];
		let firstError: { status: number; message: string } | null = null;
		for (const bank of banks) {
			const payload = toBankPayload(bank);
			const result =
				bank.accountId === undefined
					? await onboardingClient.createBankAccount(fetch, locals.logger, session.tokens, payload)
					: await onboardingClient.updateBankAccount(
							fetch,
							locals.logger,
							session.tokens,
							bank.accountId,
							payload
						);

			if (!result.ok) {
				firstError ??= {
					status: result.error.kind === 'http' ? result.error.status : 502,
					message: result.error.message
				};
				accountIds.push(bank.accountId);
				continue;
			}

			accountIds.push(extractAccountId(result.data.data) ?? bank.accountId);
		}

		if (firstError) {
			return fail(firstError.status, { error: firstError.message, accountIds });
		}

		return { success: true as const, accountIds };
	}
};
