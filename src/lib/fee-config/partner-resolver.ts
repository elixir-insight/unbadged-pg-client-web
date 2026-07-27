import { affiliatesByPipeline } from '../../routes/management/organizations/create-organization/constants';

export function resolvePartnerLabel(affiliateId: string | undefined): string {
	if (!affiliateId) return '—';
	for (const affiliates of Object.values(affiliatesByPipeline)) {
		const match = affiliates.find((affiliate) => affiliate.value === affiliateId);
		if (match) return match.label;
	}
	return affiliateId;
}

export function resolvePartnerName(affiliateId: string | undefined): string {
	const label = resolvePartnerLabel(affiliateId);
	if (label === '—') return label;
	const separatorIndex = label.indexOf(' – ');
	return separatorIndex >= 0 ? label.slice(separatorIndex + 3) : label;
}
