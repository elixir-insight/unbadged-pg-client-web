import type { Logger } from 'pino';
import type { Result } from '../../../../http/errors';
import { virtualAccountClient } from '../../client';
import type { MerchantVirtualAccount } from '../../schema';

export function findPayinVirtualAccount(
	accounts: MerchantVirtualAccount[]
): MerchantVirtualAccount | null {
	return (
		accounts.find(
			(account) =>
				account.pipelineRole === 'PAYIN' && account.virtualAccountNumber.trim().length > 0
		) ?? null
	);
}

/**
 * Loads merchant virtual accounts and returns the PAYIN VAN number for payment APIs.
 */
export async function resolvePayinVirtualAccountNumber(
	fetchFn: typeof fetch,
	logger: Logger,
	accessToken: string,
	gatewayToken: string
): Promise<Result<string>> {
	const result = await virtualAccountClient.list(fetchFn, logger, accessToken, gatewayToken);

	if (!result.ok) {
		return result;
	}

	const payinAccount = findPayinVirtualAccount(result.data.data);
	if (!payinAccount) {
		return {
			ok: false,
			error: {
				kind: 'http',
				status: result.data.statusCode,
				message: 'No PAYIN virtual account found for this merchant'
			}
		};
	}

	return { ok: true, data: payinAccount.virtualAccountNumber };
}
