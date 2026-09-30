const MINUTE_MS = 60_000;
const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

/** Locale that renders numeric dates as dd/mm/yyyy. */
export const DATE_LOCALE = 'en-IN';

/** Date-only: dd/mm/yyyy */
export const DATE_FORMAT: Intl.DateTimeFormatOptions = {
	day: '2-digit',
	month: '2-digit',
	year: 'numeric'
};

/** Date + time: dd/mm/yyyy, hh:mm */
export const DATETIME_FORMAT: Intl.DateTimeFormatOptions = {
	day: '2-digit',
	month: '2-digit',
	year: 'numeric',
	hour: '2-digit',
	minute: '2-digit'
};

const ISO_DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_DATE_PREFIX = /^(\d{4}-\d{2}-\d{2})/;
const APP_TIME_ZONE = 'Asia/Kolkata';
const LEGACY_CHART_DATE = /^(\d{2})-(\d{2})$/;

/** API timestamp: YYYY-MM-DD 23:59:59 */
export function formatEvidenceDueByForApi(dateValue: string): string {
	const date = ISO_DATE_PREFIX.exec(dateValue.trim())?.[1];
	if (!date) return '';
	return `${date} 23:59:59`;
}

function toDate(input: number | Date | string): Date {
	if (input instanceof Date) return input;
	if (typeof input === 'number') return new Date(input);

	const trimmed = input.trim();
	const dateOnly = ISO_DATE_ONLY.exec(trimmed);
	if (dateOnly) {
		const year = Number(dateOnly[1]);
		const month = Number(dateOnly[2]);
		const day = Number(dateOnly[3]);
		return new Date(year, month - 1, day);
	}

	return new Date(trimmed);
}

/** Formats a date as dd/mm/yyyy. Accepts Date, epoch ms, ISO datetime, or YYYY-MM-DD. */
export function formatDate(input: number | Date | string): string {
	const date = toDate(input);
	if (Number.isNaN(date.getTime())) return typeof input === 'string' ? input : '—';
	return date.toLocaleDateString(DATE_LOCALE, DATE_FORMAT);
}

function dayMonthFromIsoDate(isoDate: string): string | null {
	const parts = ISO_DATE_ONLY.exec(isoDate);
	if (!parts) return null;
	return `${parts[3]}-${parts[2]}`;
}

function dayMonthInAppTimeZone(date: Date): string {
	const parts = new Intl.DateTimeFormat('en-GB', {
		day: '2-digit',
		month: '2-digit',
		timeZone: APP_TIME_ZONE
	}).formatToParts(date);
	const day = parts.find((part) => part.type === 'day')?.value;
	const month = parts.find((part) => part.type === 'month')?.value;
	if (!day || !month) return '—';
	return `${day}-${month}`;
}

/** Compact chart axis label: dd-mm. Uses the API calendar date, not the host timezone. */
export function formatChartDate(input: number | Date | string): string {
	if (typeof input === 'string') {
		const trimmed = input.trim();
		if (!trimmed) return '—';

		const isoDate = ISO_DATE_PREFIX.exec(trimmed)?.[1];
		if (isoDate) {
			const label = dayMonthFromIsoDate(isoDate);
			if (label) return label;
		}

		// Normalize legacy MM-DD labels to dd-mm.
		const shortDate = LEGACY_CHART_DATE.exec(trimmed);
		if (shortDate) {
			return `${shortDate[2]}-${shortDate[1]}`;
		}
	}

	const date = toDate(input);
	if (!Number.isNaN(date.getTime())) {
		return dayMonthInAppTimeZone(date);
	}

	return typeof input === 'string' ? input.trim() || '—' : '—';
}

/** Formats a date-time as dd/mm/yyyy, hh:mm. */
export function formatAbsoluteTime(input: number | Date | string): string {
	const date = toDate(input);
	if (Number.isNaN(date.getTime())) return typeof input === 'string' ? input : '—';
	return date.toLocaleString(DATE_LOCALE, DATETIME_FORMAT);
}

export function formatRelativeTime(ms: number, now = Date.now()): string {
	const diff = now - ms;

	if (diff < MINUTE_MS) {
		return 'Just now';
	}

	if (diff < HOUR_MS) {
		const minutes = Math.floor(diff / MINUTE_MS);
		return `${minutes} min ago`;
	}

	if (diff < DAY_MS) {
		const hours = Math.floor(diff / HOUR_MS);
		return `${hours} hr ago`;
	}

	if (diff < 2 * DAY_MS) {
		return 'Yesterday';
	}

	if (diff < 7 * DAY_MS) {
		return toDate(ms).toLocaleDateString(DATE_LOCALE, { weekday: 'long' });
	}

	return formatDate(ms);
}
