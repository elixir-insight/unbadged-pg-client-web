import type { AddOrganizationBankResponse } from './schema';

type BankAccountData = {
	accountId?: string | number;
	bankAccountId?: string | number;
	id?: string | number;
};

function readAccountIdFromRecord(data: BankAccountData): string | null {
	const candidates = [data.accountId, data.bankAccountId, data.id];
	for (const candidate of candidates) {
		if (typeof candidate === 'number' && Number.isFinite(candidate)) {
			return String(candidate);
		}
		if (typeof candidate === 'string' && candidate.trim()) {
			return candidate.trim();
		}
	}
	return null;
}

export function extractBankAccountId(response: AddOrganizationBankResponse): string | null {
	const data = response.data;
	if (typeof data === 'string' && data.trim()) return data.trim();
	if (typeof data === 'number' && Number.isFinite(data)) return String(data);
	if (Array.isArray(data)) {
		const first = data[0];
		if (first && typeof first === 'object') {
			return readAccountIdFromRecord(first as BankAccountData);
		}
		return null;
	}
	if (data && typeof data === 'object') {
		return readAccountIdFromRecord(data as BankAccountData);
	}
	return null;
}
