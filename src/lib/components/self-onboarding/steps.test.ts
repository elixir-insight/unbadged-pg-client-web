import { describe, expect, it } from 'vitest';
import {
	firstIncompleteStep,
	flooredProgressPercent,
	nextStepPath,
	previousStepPath,
	resolveOnboardingStatus,
	STEP_BY_PATH,
	STEPS,
	stepIdFromPathname
} from './steps';

describe('steps', () => {
	it('has six steps whose ids match their position', () => {
		expect(STEPS).toHaveLength(6);
		STEPS.forEach((step, index) => expect(STEP_BY_PATH[step.path]).toBe(index + 1));
	});

	it('resolves the step from a pathname, defaulting to the first', () => {
		expect(stepIdFromPathname('/self-onboarding/bank-details')).toBe(3);
		expect(stepIdFromPathname('/self-onboarding/review-submit')).toBe(6);
		expect(stepIdFromPathname('/self-onboarding')).toBe(1);
	});

	it('walks back and forward between steps', () => {
		expect(previousStepPath(1)).toBeNull();
		expect(previousStepPath(2)).toBe('business-identity');
		expect(nextStepPath(5)).toBe('review-submit');
		expect(nextStepPath(6)).toBeNull();
	});

	it('finds the first step that is not completed', () => {
		expect(firstIncompleteStep([])).toBe(1);
		expect(firstIncompleteStep([1, 2])).toBe(3);
		expect(firstIncompleteStep([1, 3])).toBe(2);
		expect(firstIncompleteStep([1, 2, 3, 4, 5, 6])).toBe(6);
	});

	it('never shows 0% progress on the first step', () => {
		expect(flooredProgressPercent(0, 1)).toBe(17);
		expect(flooredProgressPercent(0, 2)).toBe(0);
		expect(flooredProgressPercent(50, 1)).toBe(50);
	});
});

describe('resolveOnboardingStatus', () => {
	it('treats every spelling of in progress as editable, like management mapStatus', () => {
		for (const status of [
			'',
			'DRAFT',
			'IN_PROGRESS',
			'IN PROGRESS',
			'In Progress',
			'in-progress'
		]) {
			expect(resolveOnboardingStatus(status)).toBe('in_progress');
		}
	});

	it('recognises REMARKED and locks everything past it', () => {
		expect(resolveOnboardingStatus(' remarked ')).toBe('remarked');
		expect(resolveOnboardingStatus('APPROVED')).toBe('read_only');
		expect(resolveOnboardingStatus('ACTIVE')).toBe('read_only');
	});
});
