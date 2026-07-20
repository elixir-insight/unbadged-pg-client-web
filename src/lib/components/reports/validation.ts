import { getLocalTimeZone } from '@internationalized/date';
import type { DateRange } from 'bits-ui';
import { MAX_DATE_RANGE_DAYS } from './constants';
import type { ReportFileFormat, ReportType, ReportValidationResult } from './types';

const DAY_MS = 86_400_000;

export function validateReportForm(input: {
	reportType?: ReportType;
	dateRange: DateRange;
	fileFormat?: ReportFileFormat;
}): ReportValidationResult {
	if (!input.reportType) {
		return { valid: false, error: 'Report type is required.' };
	}

	if (!input.dateRange.start || !input.dateRange.end) {
		return { valid: false, error: 'Date range is required.' };
	}

	const tz = getLocalTimeZone();
	const startMs = input.dateRange.start.toDate(tz).getTime();
	const endMs = input.dateRange.end.toDate(tz).getTime();

	if (startMs > endMs) {
		return { valid: false, error: 'Start date cannot be after end date.' };
	}

	const rangeDays = Math.floor((endMs - startMs) / DAY_MS) + 1;
	if (rangeDays > MAX_DATE_RANGE_DAYS) {
		return {
			valid: false,
			error: `Date range cannot exceed ${MAX_DATE_RANGE_DAYS} days.`
		};
	}

	if (!input.fileFormat) {
		return { valid: false, error: 'File format is required.' };
	}

	return { valid: true };
}
