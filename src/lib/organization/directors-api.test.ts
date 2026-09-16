import { describe, expect, it } from 'vitest';
import { isPersistedDirectorId, toDirectorUpdateItems } from './directors-api';

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

describe('toDirectorUpdateItems', () => {
	const testDirector = {
		id: '7',
		name: 'Test Director',
		pan: '**********',
		email: 'test@example.com',
		phone: '9876543210',
		aadhar: '************'
	};
	const anotherDirector = {
		id: '8',
		name: 'Another Director',
		pan: '**********',
		email: 'another@example.com',
		phone: '9876543211',
		aadhar: '************'
	};
	const newDirector = {
		id: 'director-123',
		name: 'New Director',
		pan: 'ABCDE1234F',
		email: 'new@example.com',
		phone: '9876543212',
		aadhar: '234567890123'
	};

	it('omits unchanged persisted directors so they are not created again', () => {
		expect(
			toDirectorUpdateItems(
				[testDirector, anotherDirector, newDirector],
				[testDirector, anotherDirector]
			)
		).toEqual([
			{
				name: 'New Director',
				pan: 'ABCDE1234F',
				email: 'new@example.com',
				phone: '9876543212',
				aadhar: '234567890123'
			}
		]);
	});

	it('includes persisted directors with their id when fields change', () => {
		expect(
			toDirectorUpdateItems([{ ...testDirector, email: 'updated@example.com' }], [testDirector])
		).toEqual([
			{
				id: '7',
				name: 'Test Director',
				pan: '**********',
				email: 'updated@example.com',
				phone: '9876543210',
				aadhar: '************'
			}
		]);
	});
});
