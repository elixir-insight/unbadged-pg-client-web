import { describe, expect, it } from 'vitest';
import {
	canChangeDisputeStatus,
	disputeTimelineIconKind,
	getChangeDisputeStatusDisabledReason,
	isDisputeTimelineTerminalStatus
} from './dispute-status';

describe('isDisputeTimelineTerminalStatus', () => {
	it('treats resolved lost and arbitration lost as terminal', () => {
		expect(isDisputeTimelineTerminalStatus('RESOLVED_LOST')).toBe(true);
		expect(isDisputeTimelineTerminalStatus('ARBITRATION_LOST')).toBe(true);
		expect(isDisputeTimelineTerminalStatus('RESOLVED_WON')).toBe(true);
	});

	it('does not treat in-progress statuses as terminal', () => {
		expect(isDisputeTimelineTerminalStatus('UNDER_REVIEW')).toBe(false);
		expect(isDisputeTimelineTerminalStatus('GATEWAY_DOCUMENT_UNDER_REVIEW')).toBe(false);
		expect(isDisputeTimelineTerminalStatus('RE_REPRESENTMENT_SUBMITTED')).toBe(false);
		expect(isDisputeTimelineTerminalStatus('PRE_ARBITRATION')).toBe(false);
	});
});

describe('disputeTimelineIconKind', () => {
	it('maps outcomes to topic icons', () => {
		expect(disputeTimelineIconKind('RESOLVED_LOST')).toBe('alert');
		expect(disputeTimelineIconKind('ARBITRATION_LOST')).toBe('alert');
		expect(disputeTimelineIconKind('RESOLVED_WON')).toBe('shield');
		expect(disputeTimelineIconKind('GATEWAY_DOCUMENT_UNDER_REVIEW')).toBe('search');
		expect(disputeTimelineIconKind('RE_REPRESENTMENT_SUBMITTED')).toBe('file');
	});
});

describe('canChangeDisputeStatus', () => {
	it('disables change status for locked terminal statuses', () => {
		expect(canChangeDisputeStatus('ARBITRATION_LOST')).toBe(false);
		expect(canChangeDisputeStatus('MERCHANT_ACCEPTED_DISPUTE')).toBe(false);
		expect(canChangeDisputeStatus('RESOLVED_WON')).toBe(false);
		expect(canChangeDisputeStatus('CLOSED_OTHER')).toBe(false);
	});

	it('allows change status for other statuses', () => {
		expect(canChangeDisputeStatus('RESOLVED_LOST')).toBe(true);
		expect(canChangeDisputeStatus('UNDER_REVIEW')).toBe(true);
		expect(canChangeDisputeStatus('PRE_ARBITRATION')).toBe(true);
	});

	it('returns a reason when change status is locked', () => {
		expect(getChangeDisputeStatusDisabledReason('RESOLVED_WON')).toContain('cannot be changed');
		expect(getChangeDisputeStatusDisabledReason('UNDER_REVIEW')).toBeNull();
	});
});
