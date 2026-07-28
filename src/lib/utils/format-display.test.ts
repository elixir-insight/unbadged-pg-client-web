import { describe, expect, it } from 'vitest';
import { formatSnakeCaseLabel, truncateText } from './format-display';

describe('formatSnakeCaseLabel', () => {
	it('replaces underscores with spaced title case', () => {
		expect(formatSnakeCaseLabel('CREDIT_CARD')).toBe('Credit Card');
		expect(formatSnakeCaseLabel('DEBIT_CARD')).toBe('Debit Card');
		expect(formatSnakeCaseLabel('NET_BANKING')).toBe('Net Banking');
	});

	it('leaves values without underscores unchanged', () => {
		expect(formatSnakeCaseLabel('UPI')).toBe('UPI');
		expect(formatSnakeCaseLabel('VISA')).toBe('VISA');
		expect(formatSnakeCaseLabel('Bank of Baroda')).toBe('Bank of Baroda');
		expect(formatSnakeCaseLabel('—')).toBe('—');
	});
});

describe('truncateText', () => {
	it('truncates long values with an ellipsis', () => {
		expect(truncateText('ORDER-53d44733-ce24-4ae3-9e89-c6b88e9289cc', 24)).toBe(
			'ORDER-53d44733-ce24-4ae…'
		);
	});

	it('keeps short values intact', () => {
		expect(truncateText('naveenagarwal3529@ybl')).toBe('naveenagarwal3529@ybl');
		expect(truncateText('—')).toBe('—');
	});
});
