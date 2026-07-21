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
