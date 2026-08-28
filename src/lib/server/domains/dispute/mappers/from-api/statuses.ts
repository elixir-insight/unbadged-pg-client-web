import { formatDisputeStatusLabel, type DisputeStatusOption } from '$lib/utils/dispute-status';
import type { DisputeStatusItem } from '../../schema';

function asText(value: string | number | null | undefined): string {
	if (value === null || value === undefined) return '';
	return String(value).trim();
}

export function mapDisputeStatus(item: DisputeStatusItem): DisputeStatusOption | null {
	const value = asText(item.status);
	if (!value) return null;

	return {
		value,
		label: formatDisputeStatusLabel(value),
		description: asText(item.description)
	};
}

export function mapDisputeStatuses(items: DisputeStatusItem[]): DisputeStatusOption[] {
	return items
		.map(mapDisputeStatus)
		.filter((status): status is DisputeStatusOption => status !== null);
}
