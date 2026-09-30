import { describe, expect, it } from 'vitest';
import { formatChartDate } from './format-time';

describe('formatChartDate', () => {
	it('keeps YYYY-MM-DD calendar dates', () => {
		expect(formatChartDate('2026-07-14')).toBe('14-07');
	});

	it('uses the IST calendar date from offset timestamps', () => {
		expect(formatChartDate('2024-08-19T00:00:00+05:30')).toBe('19-08');
		expect(formatChartDate('2024-08-24T00:00:00+05:30')).toBe('24-08');
	});

	it('does not shift IST midnight to the previous UTC day', () => {
		expect(formatChartDate('2024-08-24T00:00:00.000+05:30')).toBe('24-08');
	});

	it('normalizes legacy MM-DD labels to dd-mm', () => {
		expect(formatChartDate('08-24')).toBe('24-08');
	});

	it('returns an em dash for a blank string', () => {
		expect(formatChartDate('   ')).toBe('—');
	});
});
