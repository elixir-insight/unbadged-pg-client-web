import { describe, expect, it } from 'vitest';
import { extractSensitiveValue } from './sensitive-data';

const keys = ['businessPan', 'pan', 'value'];

describe('extractSensitiveValue', () => {
	it('reads a bare string', () => {
		expect(extractSensitiveValue(' ABCDE1234F ', keys)).toBe('ABCDE1234F');
	});

	it('reads the first matching key of an object', () => {
		expect(extractSensitiveValue({ orgId: 'ORG_1', businessPan: 'ABCDE1234F' }, keys)).toBe(
			'ABCDE1234F'
		);
	});

	it('reads the first entry of an array', () => {
		expect(extractSensitiveValue([{ pan: 'ABCDE1234F' }], keys)).toBe('ABCDE1234F');
	});

	it("falls back to an object's only string value", () => {
		expect(extractSensitiveValue({ decrypted: '123412341234' }, keys)).toBe('123412341234');
	});

	it('returns empty when the value is ambiguous or missing', () => {
		expect(extractSensitiveValue({ a: 'x', b: 'y' }, keys)).toBe('');
		expect(extractSensitiveValue(null, keys)).toBe('');
		expect(extractSensitiveValue([], keys)).toBe('');
	});
});
