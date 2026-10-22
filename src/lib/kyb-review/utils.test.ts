import { describe, expect, it } from 'vitest';
import type { FieldReview } from './types';
import { buildSectionPayload, isChanged, mapVerifications, resolveFieldReview } from './utils';

const pending: FieldReview = { status: 'PENDING', remarks: '' };
const verified: FieldReview = { status: 'VERIFIED', remarks: '' };
const rejected: FieldReview = { status: 'REJECTED', remarks: 'Blurry scan' };

describe('isChanged', () => {
	it('is false when status and remarks match', () => {
		expect(isChanged(rejected, { status: 'REJECTED', remarks: 'Blurry scan' })).toBe(false);
	});

	it('ignores surrounding whitespace in remarks', () => {
		expect(isChanged(rejected, { status: 'REJECTED', remarks: '  Blurry scan  ' })).toBe(false);
	});

	it('is true when the status changes', () => {
		expect(isChanged(pending, verified)).toBe(true);
	});

	it('is true when a pending or rejected note changes', () => {
		expect(isChanged(rejected, { status: 'REJECTED', remarks: 'Name mismatch' })).toBe(true);
	});

	it('ignores remarks once the status is verified', () => {
		expect(isChanged(verified, { status: 'VERIFIED', remarks: 'leftover' })).toBe(false);
	});
});

describe('buildSectionPayload', () => {
	it('omits unchanged fields and empty arrays', () => {
		expect(
			buildSectionPayload([
				{
					fieldName: 'kyb.gstNumber',
					saved: pending,
					draft: pending
				}
			])
		).toEqual({});
	});

	it('groups verified names, rejected objects, and pending objects', () => {
		expect(
			buildSectionPayload([
				{
					fieldName: 'kyb.gstNumber',
					saved: pending,
					draft: verified
				},
				{
					fieldName: 'kyb.organizationWebsite',
					saved: pending,
					draft: { status: 'REJECTED', remarks: '  Site is down  ' }
				},
				{
					fieldName: 'kyb.cin',
					saved: verified,
					draft: { status: 'PENDING', remarks: '' }
				},
				{
					fieldName: 'kyb.tan',
					saved: pending,
					draft: pending
				}
			])
		).toEqual({
			verified: ['kyb.gstNumber'],
			rejected: [{ fieldName: 'kyb.organizationWebsite', remarks: 'Site is down' }],
			resetToPending: ['kyb.cin']
		});
	});

	it('omits arrays that have no entries', () => {
		expect(
			buildSectionPayload([
				{
					fieldName: 'kyb.businessPan',
					saved: pending,
					draft: verified
				}
			])
		).toEqual({ verified: ['kyb.businessPan'] });
	});
});

describe('mapVerifications', () => {
	it('maps field status and remarks', () => {
		expect(
			mapVerifications([
				{ fieldName: 'kyb.gstNumber', status: 'VERIFIED', remarks: 'ok' },
				{ fieldName: 'kyb.cin', status: 'REJECTED', remarks: ' Not clear ' }
			])
		).toEqual({
			'kyb.gstNumber': { status: 'VERIFIED', remarks: 'ok' },
			'kyb.cin': { status: 'REJECTED', remarks: 'Not clear' }
		});
	});

	it('treats an unknown status as pending and skips a blank field name', () => {
		const mapped = mapVerifications([
			{ fieldName: 'kyb.tan', status: 'HOLD', remarks: null },
			{ fieldName: '  ', status: 'REJECTED', remarks: 'skip' }
		]);

		expect(mapped).toEqual({
			'kyb.tan': { status: 'PENDING', remarks: '' }
		});
		expect(resolveFieldReview(mapped, 'kyb.gstNumber')).toEqual({
			status: 'PENDING',
			remarks: ''
		});
	});
});
