import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { loadOrganizationBankAccounts } from '$lib/server/domains/organization/loaders/bank-accounts';
import { resolveOrganizationBase } from '$lib/server/domains/organization/loaders/documents';
import { parseBankAccountFormData } from '$lib/server/domains/organization/utils/form-data';
import {
	addBankAccountMutation,
	updateBankAccountMutation
} from '$lib/server/domains/organization/mutations/bank-account';
import { organizations } from '$lib/data/mockData';
import { requirePermission } from '$lib/server/domains/auth/requirePermission';

export const load: PageServerLoad = async ({ params, parent, cookies, fetch, locals, depends }) => {
	depends('org-bank-accounts');

	const parentData = await parent();
	const log = locals.logger;
	const orgId = params.orgId?.trim();
	const organizationBase = orgId ? resolveOrganizationBase(parentData, orgId) : null;

	if (!orgId || !organizationBase) {
		return {
			bankAccountsLoadError: 'Organization id is required',
			bankAccounts: organizationBase?.bankAccounts ?? []
		};
	}

	return loadOrganizationBankAccounts({
		fetch,
		log,
		cookies,
		orgId,
		organizationBase
	});
};

export const actions = {
	createAccount: async ({ request, params, cookies, fetch, locals }) => {
		requirePermission(locals.userPermissions, 'ORGANIZATION', 'write');
		const log = locals.logger;
		const orgId = params.orgId?.trim() ?? '';
		const formData = await request.formData();
		const parsed = parseBankAccountFormData(formData);

		if (!parsed.success) {
			log.warn({ issues: parsed.issues }, 'add bank rejected — invalid form data');
			return fail(400, {
				message: parsed.issues[0]?.message ?? 'Invalid bank account payload'
			});
		}

		// Partner onboarding isn't wired to the live API yet — mock a successful save.
		const mockOrganization = organizations.find((organization) => organization.id === orgId);
		if (mockOrganization?.category === 'PARTNER') {
			const accountId = `bank-${Date.now()}`;
			mockOrganization.bankAccounts = [
				...mockOrganization.bankAccounts,
				{ id: accountId, ...parsed.output }
			];
			log.info({ orgId, accountId }, 'mocked partner bank account create');
			return {
				success: true,
				message: 'Bank account added successfully',
				accountId
			};
		}

		const result = await addBankAccountMutation({
			fetch,
			log,
			cookies,
			orgId,
			body: parsed.output
		});

		if (!result.ok) {
			return fail(result.status, { message: result.message });
		}

		return {
			success: true,
			message: result.message,
			accountId: result.accountId
		};
	},

	updateAccount: async ({ request, params, cookies, fetch, locals }) => {
		requirePermission(locals.userPermissions, 'ORGANIZATION', 'write');
		const log = locals.logger;
		const orgId = params.orgId?.trim() ?? '';
		const formData = await request.formData();
		const accountId = String(formData.get('accountId') ?? '').trim();

		if (!accountId) {
			return fail(400, { message: 'Bank account id is required' });
		}

		const parsed = parseBankAccountFormData(formData);

		if (!parsed.success) {
			log.warn({ issues: parsed.issues }, 'update bank rejected — invalid form data');
			return fail(400, {
				message: parsed.issues[0]?.message ?? 'Invalid bank account payload'
			});
		}

		// Partner onboarding isn't wired to the live API yet — mock a successful save.
		const mockOrganization = organizations.find((organization) => organization.id === orgId);
		if (mockOrganization?.category === 'PARTNER') {
			const index = mockOrganization.bankAccounts.findIndex((account) => account.id === accountId);
			if (index >= 0) {
				mockOrganization.bankAccounts[index] = { id: accountId, ...parsed.output };
			}
			log.info({ orgId, accountId }, 'mocked partner bank account update');
			return {
				success: true,
				message: 'Bank account updated successfully'
			};
		}

		const result = await updateBankAccountMutation({
			fetch,
			log,
			cookies,
			orgId,
			accountId,
			body: parsed.output
		});

		if (!result.ok) {
			return fail(result.status, { message: result.message });
		}

		return {
			success: true,
			message: result.message
		};
	}
} satisfies Actions;
