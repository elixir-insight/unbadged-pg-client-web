import { describe, expect, it } from 'vitest';
import { getReviewOutcome } from './reviewState';

describe('getReviewOutcome', () => {
	it('is PENDING while any field is pending, even with rejections', () => {
		expect(getReviewOutcome([{ status: 'REJECTED' }, { status: 'PENDING' }])).toBe('PENDING');
	});

	it('is REMARKED when nothing is pending and a field is rejected', () => {
		expect(getReviewOutcome([{ status: 'VERIFIED' }, { status: 'REJECTED' }])).toBe('REMARKED');
	});

	it('is PENDING when there are no verification records', () => {
		expect(getReviewOutcome([])).toBe('PENDING');
	});

	it('is APPROVABLE when every field is verified', () => {
		expect(getReviewOutcome([{ status: 'VERIFIED' }, { status: 'VERIFIED' }])).toBe('APPROVABLE');
	});
});
