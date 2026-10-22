import { formatAbsoluteTime } from '$lib/utils/format-time';
import {
	disputeStatusDescription,
	disputeStatusLabel,
	type DisputeStatusOption,
	type DisputeTimelineEventView
} from '$lib/utils/dispute-status';
import type { DisputeEventItem } from '../../schema';

function asText(value: string | number | null | undefined): string {
	if (value === null || value === undefined) return '';
	return String(value).trim();
}

function formatEventDate(value: string): string {
	const trimmed = value.trim();
	if (!trimmed) return '—';
	const formatted = formatAbsoluteTime(trimmed);
	return formatted || '—';
}

export function mapDisputeEvent(
	item: DisputeEventItem,
	statuses: DisputeStatusOption[] = []
): DisputeTimelineEventView {
	const status = asText(item.toStatus);
	const note = asText(item.note);

	return {
		id: asText(item.id) || `${status}-${asText(item.createdAt)}`,
		status,
		title: disputeStatusLabel(status, statuses),
		description: note || disputeStatusDescription(status, statuses),
		date: formatEventDate(asText(item.createdAt))
	};
}

export function mapDisputeEvents(
	items: DisputeEventItem[],
	statuses: DisputeStatusOption[] = []
): DisputeTimelineEventView[] {
	return [...items]
		.sort((left, right) => {
			const leftTime = Date.parse(asText(left.createdAt));
			const rightTime = Date.parse(asText(right.createdAt));
			const safeLeft = Number.isFinite(leftTime) ? leftTime : 0;
			const safeRight = Number.isFinite(rightTime) ? rightTime : 0;
			return safeLeft - safeRight;
		})
		.map((item) => mapDisputeEvent(item, statuses));
}
