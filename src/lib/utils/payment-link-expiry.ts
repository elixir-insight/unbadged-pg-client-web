import { getLocalTimeZone, parseDate } from '@internationalized/date';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isValidExpiryTime(value: string): boolean {
	return TIME_PATTERN.test(value.trim());
}

export function toExpiryUtcIso(dateIso: string, timeHhMm: string): string {
	if (!isValidExpiryTime(timeHhMm)) {
		throw new Error('Enter a valid expiry time');
	}

	const [hoursRaw, minutesRaw] = timeHhMm.trim().split(':');
	const hours = Number(hoursRaw);
	const minutes = Number(minutesRaw);
	const date = parseDate(dateIso).toDate(getLocalTimeZone());
	date.setHours(hours, minutes, 0, 0);
	return date.toISOString();
}
