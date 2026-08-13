import { describe, expect, it } from 'vitest';
import { isPersistedDirectorId } from './directors-api';

describe('isPersistedDirectorId', () => {
	it('returns true for numeric upstream ids', () => {
		expect(isPersistedDirectorId('42')).toBe(true);
		expect(isPersistedDirectorId(' 12 ')).toBe(true);
	});

	it('returns false for local draft ids', () => {
		expect(isPersistedDirectorId('director-123')).toBe(false);
		expect(isPersistedDirectorId('')).toBe(false);
	});
});
