import type { Logger } from 'pino';
import type { ApiError, Result } from '../../../../http/errors';
import { virtualAccountClient } from '../../client';
import type { MerchantVirtualAccount } from '../../schema';

/** Stable code for “merchant has no PAYIN VAN yet” (setup state, not a hard failure). */
export const NO_PAYIN_VAN_CODE = 'NO_PAYIN_VAN';

export const NO_PAYIN_VAN_MESSAGE =
	'No collection account is set up yet. Ask your operations team to create a virtual account.';

export function isNoPayinVirtualAccountError(error: ApiError): boolean {
	return error.kind === 'http' && error.code === NO_PAYIN_VAN_CODE;
}

export function isActiveVirtualAccountStatus(status: string | null | undefined): boolean {
	return status?.trim().toUpperCase() === 'ACTIVE';
}

function isUsablePayinVirtualAccount(account: MerchantVirtualAccount): boolean {
	return account.pipelineRole === 'PAYIN' && account.virtualAccountNumber.trim().length > 0;
}

export function findPayinVirtualAccount(
	accounts: MerchantVirtualAccount[]
): MerchantVirtualAccount | null {
	return accounts.find(isUsablePayinVirtualAccount) ?? null;
}

/** Merchant APIs only use a PAYIN VAN when upstream status is ACTIVE. */
export function findActivePayinVirtualAccount(
	accounts: MerchantVirtualAccount[]
): MerchantVirtualAccount | null {
	return (
		accounts.find(
			(account) =>
				isUsablePayinVirtualAccount(account) && isActiveVirtualAccountStatus(account.status)
		) ?? null
	);
}

/**
 * Loads merchant virtual accounts and returns the ACTIVE PAYIN VAN number for payment APIs.
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

	const payinAccount = findActivePayinVirtualAccount(result.data.data);
	if (!payinAccount) {
		logger.info('merchant PAYIN virtual account is not ACTIVE');
		return {
			ok: false,
			error: {
				kind: 'http',
				status: 404,
				code: NO_PAYIN_VAN_CODE,
				message: NO_PAYIN_VAN_MESSAGE
			}
		};
	}

	logger.info(
		{ virtualAccountNumber: payinAccount.virtualAccountNumber, status: payinAccount.status },
		'merchant active PAYIN virtual account'
	);

	return { ok: true, data: payinAccount.virtualAccountNumber };
}
