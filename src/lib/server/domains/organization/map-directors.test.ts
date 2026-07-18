import { describe, expect, it } from 'vitest';
import { mapDirectors } from './map-directors';

describe('mapDirectors', () => {
	it('maps upstream director records into organization directors', () => {
		expect(
			mapDirectors([
				{
					id: 7,
					name: 'Jane Doe',
					pan: 'ABCDE1234F',
					email: 'jane@example.com',
					phoneNumber: '+919876543210',
					aadhar: '234567890123'
				}
			])
		).toEqual([
			expect.objectContaining({
				id: '7',
				name: 'Jane Doe',
				pan: 'ABCDE1234F',
				email: 'jane@example.com',
				phone: '+919876543210',
				aadhar: '234567890123'
			})
		]);
	});
});
