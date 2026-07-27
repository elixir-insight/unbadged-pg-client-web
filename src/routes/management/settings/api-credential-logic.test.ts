import { describe, expect, it } from 'vitest';
import {
	buildCredentialCsv,
	maskClientId,
	parseGenerateResult,
	parseRevokeResult
} from './api-credential-logic';

describe('maskClientId', () => {
	it('shows first and last 4 characters for long ids', () => {
		expect(maskClientId('client_ABCDEFGH1234')).toBe('clie••••••••1234');
	});

	it('returns short ids unchanged rather than masking to nothing useful', () => {
		expect(maskClientId('abcd1234')).toBe('abcd1234');
		expect(maskClientId('abc')).toBe('abc');
	});
});

describe('buildCredentialCsv', () => {
	it('builds a two-line CSV with headers and the credential row', () => {
		const csv = buildCredentialCsv({ clientId: 'id-1', clientSecret: 'secret-1' });
		expect(csv).toBe('clientId,clientSecret\nid-1,secret-1\n');
	});
});

describe('parseGenerateResult', () => {
	it('extracts the credential on a successful generate', () => {
		const outcome = parseGenerateResult({
			type: 'success',
			status: 200,
			data: { clientId: 'id-1', clientSecret: 'secret-1' }
		});
		expect(outcome).toEqual({
			kind: 'revealed',
			credential: { clientId: 'id-1', clientSecret: 'secret-1' }
		});
	});

	it('treats a malformed success payload as an error rather than throwing', () => {
		const outcome = parseGenerateResult({ type: 'success', status: 200, data: {} });
		expect(outcome.kind).toBe('error');
	});

	it('classifies a 422 selfCorrect failure distinctly from other failures', () => {
		const outcome = parseGenerateResult({
			type: 'failure',
			status: 422,
			data: {
				message: "You've already generated a credential for this organization.",
				selfCorrect: true
			}
		});
		expect(outcome).toEqual({
			kind: 'self-corrected',
			message: "You've already generated a credential for this organization."
		});
	});

	it('classifies a 400 failure as a plain error, not self-correcting', () => {
		const outcome = parseGenerateResult({
			type: 'failure',
			status: 400,
			data: { message: 'Organization/User ID missing' }
		});
		expect(outcome).toEqual({ kind: 'error', message: 'Organization/User ID missing' });
	});

	it('falls back to a generic message when the failure has no message', () => {
		const outcome = parseGenerateResult({ type: 'failure', status: 500, data: {} });
		expect(outcome).toEqual({ kind: 'error', message: 'Something went wrong. Please try again.' });
	});

	it('treats a SvelteKit error result as a generic retryable error', () => {
		const outcome = parseGenerateResult({ type: 'error', error: new Error('boom') });
		expect(outcome.kind).toBe('error');
	});
});

describe('parseRevokeResult', () => {
	it('reports revoked on success', () => {
		expect(parseRevokeResult({ type: 'success', status: 200 })).toEqual({ kind: 'revoked' });
	});

	it('surfaces the failure message for a 400/500 failure', () => {
		const outcome = parseRevokeResult({
			type: 'failure',
			status: 500,
			data: { message: 'Server error' }
		});
		expect(outcome).toEqual({ kind: 'error', message: 'Server error' });
	});

	it('falls back to a generic message when the failure has no message', () => {
		const outcome = parseRevokeResult({ type: 'failure', status: 400, data: {} });
		expect(outcome).toEqual({ kind: 'error', message: 'Something went wrong. Please try again.' });
	});
});
