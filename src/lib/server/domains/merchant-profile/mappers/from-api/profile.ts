import type { MerchantProfileRecord } from '../../schema';
import { formatLabel } from '$lib/utils/format-label';
import { formatDate } from '$lib/utils/format-time';

export interface MerchantProfileView {
	orgId: string;
	displayName: string;
	companyName: string;
	orgName: string;
	email: string;
	phone: string;
	businessType: string;
	country: string;
	registeredDate: string;
	website: string;
	username: string;
	gstNumber: string;
}

function orDash(value: string): string {
	const trimmed = value.trim();
	return trimmed || '—';
}

export function mapMerchantProfile(record: MerchantProfileRecord): MerchantProfileView {
	return {
		orgId: orDash(record.orgId),
		displayName: orDash(record.orgName || record.companyName || record.username),
		companyName: orDash(record.companyName),
		orgName: orDash(record.orgName),
		email: record.email.trim(),
		phone: record.phone.trim(),
		businessType: formatLabel(record.businessType),
		country: orDash(record.country),
		registeredDate: record.registeredDate.trim() ? formatDate(record.registeredDate) : '—',
		website: record.website.trim(),
		username: orDash(record.username),
		gstNumber: (record.gstNumber ?? '').trim()
	};
}
