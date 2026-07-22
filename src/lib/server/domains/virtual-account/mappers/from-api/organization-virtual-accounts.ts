import type { MerchantVirtualAccount } from '../../schema';
import type { VirtualAccount } from '$lib/types/virtual-account';

function mapVanStatus(status: string | null | undefined): VirtualAccount['status'] {
	return status?.trim().toUpperCase() === 'ACTIVE' ? 'active' : 'inactive';
}

export function mapOrganizationVirtualAccounts(
	accounts: MerchantVirtualAccount[],
	orgId: string,
	merchantName: string
): VirtualAccount[] {
	return accounts.flatMap((account) => {
		const vanNumber = account.virtualAccountNumber.trim();
		if (!vanNumber) return [];

		return [
			{
				vanId: vanNumber,
				vanNumber,
				orgId,
				merchantName,
				status: mapVanStatus(account.status)
			}
		];
	});
}
