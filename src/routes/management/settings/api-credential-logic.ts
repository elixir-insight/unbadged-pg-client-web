export interface RevealedCredential {
	clientId: string;
	clientSecret: string;
}

/** First/last 4 chars visible — e.g. `abcd••••••••wxyz`. */
export function maskClientId(clientId: string): string {
	if (clientId.length <= 8) return clientId;
	return `${clientId.slice(0, 4)}••••••••${clientId.slice(-4)}`;
}

export function buildCredentialCsv({ clientId, clientSecret }: RevealedCredential): string {
	return `clientId,clientSecret\n${clientId},${clientSecret}\n`;
}

type ActionResultLike =
	| { type: 'success'; status: number; data?: Record<string, unknown> }
	| { type: 'failure'; status: number; data?: Record<string, unknown> }
	| { type: 'redirect'; status: number; location: string }
	| { type: 'error'; status?: number; error: unknown };

export type GenerateOutcome =
	| { kind: 'revealed'; credential: RevealedCredential }
	| { kind: 'self-corrected'; message: string }
	| { kind: 'error'; message: string };

const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again.';

export function parseGenerateResult(result: ActionResultLike): GenerateOutcome {
	if (result.type === 'success') {
		const clientId = result.data?.clientId;
		const clientSecret = result.data?.clientSecret;
		if (typeof clientId === 'string' && typeof clientSecret === 'string') {
			return { kind: 'revealed', credential: { clientId, clientSecret } };
		}
		return { kind: 'error', message: GENERIC_ERROR_MESSAGE };
	}
	if (result.type === 'failure') {
		const message = typeof result.data?.message === 'string' ? result.data.message : undefined;
		if (result.data?.selfCorrect === true) {
			return {
				kind: 'self-corrected',
				message: message ?? "You've already generated a credential for this organization."
			};
		}
		return { kind: 'error', message: message ?? GENERIC_ERROR_MESSAGE };
	}
	return { kind: 'error', message: GENERIC_ERROR_MESSAGE };
}

export type RevokeOutcome = { kind: 'revoked' } | { kind: 'error'; message: string };

export function parseRevokeResult(result: ActionResultLike): RevokeOutcome {
	if (result.type === 'success') {
		return { kind: 'revoked' };
	}
	if (result.type === 'failure') {
		const message = typeof result.data?.message === 'string' ? result.data.message : undefined;
		return { kind: 'error', message: message ?? GENERIC_ERROR_MESSAGE };
	}
	return { kind: 'error', message: GENERIC_ERROR_MESSAGE };
}
