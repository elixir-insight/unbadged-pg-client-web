const MINUTE_MS = 60_000;
const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

export function formatAbsoluteTime(ms: number): string {
	return new Date(ms).toLocaleString('en-IN', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
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
		return new Date(ms).toLocaleDateString('en-IN', { weekday: 'long' });
	}

	return new Date(ms).toLocaleDateString('en-IN', {
		day: '2-digit',
		month: 'short'
	});
}
