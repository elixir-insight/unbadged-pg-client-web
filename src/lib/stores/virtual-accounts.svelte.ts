import type { VirtualAccount, ConfigService } from '$lib/components/organization/types';

const DEFAULT_PAYIN_ACCOUNTS: VirtualAccount[] = [
	{
		id: 'VA-PIN-7821',
		alias: 'Payin collections',
		accountNumber: 'XXXX 4421 9912',
		bank: 'HDFC Bank',
		bankingPipeline: 'HDFC Bank',
		active: true
	},
	{
		id: 'VA-PIN-7822',
		alias: 'Payin subscriptions',
		accountNumber: 'XXXX 4421 9913',
		bank: 'ICICI Bank',
		bankingPipeline: 'ICICI Bank',
		active: true
	}
];

const DEFAULT_PAYOUT_ACCOUNTS: VirtualAccount[] = [
	{
		id: 'VA-PO-7821',
		alias: 'Payout settlements',
		accountNumber: 'XXXX 5521 8812',
		bank: 'HDFC Bank',
		bankingPipeline: 'HDFC Bank',
		active: true
	},
	{
		id: 'VA-PO-7822',
		alias: 'Payout refunds',
		accountNumber: 'XXXX 5521 8813',
		bank: 'OMNIWARE BANK',
		bankingPipeline: 'OMNIWARE BANK',
		active: false
	}
];

function storeKey(orgId: string, service: ConfigService): string {
	return `${orgId}:${service}`;
}

function defaultAccounts(service: ConfigService): VirtualAccount[] {
	return (service === 'payin' ? DEFAULT_PAYIN_ACCOUNTS : DEFAULT_PAYOUT_ACCOUNTS).map(
		(account) => ({
			...account
		})
	);
}

class VirtualAccountsStore {
	accountsByKey = $state<Record<string, VirtualAccount[]>>({});

	getAccounts(orgId: string, service: ConfigService): VirtualAccount[] {
		const key = storeKey(orgId, service);
		if (!this.accountsByKey[key]) {
			this.accountsByKey[key] = defaultAccounts(service);
		}
		return this.accountsByKey[key];
	}

	getUsedPipelines(orgId: string, service: ConfigService, excludeVaId?: string): string[] {
		return this.getAccounts(orgId, service)
			.filter((account) => account.id !== excludeVaId)
			.map((account) => account.bankingPipeline);
	}

	hasPipelineConflict(
		orgId: string,
		service: ConfigService,
		pipeline: string,
		excludeVaId?: string
	): boolean {
		return this.getUsedPipelines(orgId, service, excludeVaId).includes(pipeline);
	}

	addAccount(orgId: string, service: ConfigService, account: VirtualAccount) {
		const key = storeKey(orgId, service);
		const accounts = this.getAccounts(orgId, service);
		this.accountsByKey[key] = [...accounts, account];
	}

	updateAccount(
		orgId: string,
		service: ConfigService,
		accountId: string,
		updates: Partial<VirtualAccount>
	) {
		const key = storeKey(orgId, service);
		const accounts = this.getAccounts(orgId, service);
		this.accountsByKey[key] = accounts.map((account) =>
			account.id === accountId ? { ...account, ...updates } : account
		);
	}

	removeAccount(orgId: string, service: ConfigService, accountId: string) {
		const key = storeKey(orgId, service);
		const accounts = this.getAccounts(orgId, service);
		this.accountsByKey[key] = accounts.filter((account) => account.id !== accountId);
	}

	toggleAccount(orgId: string, service: ConfigService, accountId: string) {
		const key = storeKey(orgId, service);
		const accounts = this.getAccounts(orgId, service);
		this.accountsByKey[key] = accounts.map((account) =>
			account.id === accountId ? { ...account, active: !account.active } : account
		);
	}

	nextAccountId(orgId: string, service: ConfigService): string {
		const accounts = this.getAccounts(orgId, service);
		const prefix = service === 'payin' ? 'VA-PIN-' : 'VA-PO-';
		const maxId = accounts.reduce((max, account) => {
			const numeric = Number(account.id.replace(/\D/g, ''));
			return Number.isFinite(numeric) ? Math.max(max, numeric) : max;
		}, 7820);
		return `${prefix}${maxId + 1}`;
	}
}

export const virtualAccountsStore = new VirtualAccountsStore();
