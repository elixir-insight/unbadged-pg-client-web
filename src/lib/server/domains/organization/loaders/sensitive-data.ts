import type { Logger } from 'pino';
import type { Organization } from '$lib/data/mockData';
import { isMaskedAadhar, isMaskedPan } from '$lib/validation/organization-kyb';
import { buildUrl } from '$lib/server/http/query';
import { organizationClient } from '../client';
import type { SensitiveDataQuery } from '../schema';

/**
 * Pulls the decrypted value out of a sensitive-data response `data`. The response shape isn't
 * documented, so accept a bare string, an array (first entry), or an object keyed by one of `keys`
 * (falling back to its only string value).
 */
export function extractSensitiveValue(data: unknown, keys: readonly string[]): string {
	if (typeof data === 'string') return data.trim();
	if (Array.isArray(data)) return data.length > 0 ? extractSensitiveValue(data[0], keys) : '';
	if (!data || typeof data !== 'object') return '';

	const record = data as Record<string, unknown>;
	for (const key of keys) {
		const value = record[key];
		if (typeof value === 'string' && value.trim()) return value.trim();
	}
	const strings = Object.values(record).filter(
		(value): value is string => typeof value === 'string' && value.trim() !== ''
	);
	return strings.length === 1 ? strings[0].trim() : '';
}

const BUSINESS_PAN_KEYS = ['businessPan', 'orgPan', 'pan', 'value', 'decryptedValue'] as const;
const DIRECTOR_KEYS = {
	pan: ['pan', 'value', 'decryptedValue'],
	aadhar: ['aadhar', 'aadhaar', 'value', 'decryptedValue']
} as const;

/**
 * KYB review only: swaps masked Business PAN and director PAN / Aadhaar for their decrypted values
 * so the reviewer can check them. A failed lookup keeps the masked value and is reported back.
 */
export async function unmaskOrganizationForReview(params: {
	fetch: typeof fetch;
	log: Logger;
	accessToken: string;
	gatewayToken: string;
	orgId: string;
	organization: Organization;
}): Promise<{ organization: Organization; sensitiveDataError: string | null }> {
	const { fetch, log, accessToken, gatewayToken, orgId, organization } = params;
	const failures: string[] = [];

	async function reveal(
		label: string,
		query: SensitiveDataQuery,
		keys: readonly string[],
		masked: string
	): Promise<string> {
		const result = await organizationClient.getSensitiveData(
			fetch,
			log,
			accessToken,
			gatewayToken,
			orgId,
			query
		);
		const url = buildUrl(
			`api/v1/management/organizations/${encodeURIComponent(orgId)}/sensitive-data`,
			query
		);
		if (!result.ok) {
			const { error } = result;
			log.error(
				{
					label,
					orgId,
					query,
					url,
					kind: error.kind,
					status: error.kind === 'http' ? error.status : undefined,
					exceptionCode: error.kind === 'http' ? error.code : undefined,
					message: error.message,
					// Full upstream body (or validation issues) — the decrypted value is never in it on failure.
					response: error.kind === 'http' ? error.body : undefined,
					issues: error.kind === 'validation' ? error.issues : undefined
				},
				`GET sensitive-data failed for ${label} — ${error.message}`
			);
			failures.push(`${label}: ${error.message}`);
			return masked;
		}
		const value = extractSensitiveValue(result.data.data, keys);
		if (!value) {
			log.error(
				{ label, orgId, query, url, responseType: typeof result.data.data },
				`GET sensitive-data returned no usable value for ${label}`
			);
			failures.push(`${label}: no value returned`);
			return masked;
		}
		// Never log the decrypted value itself.
		log.info({ label, orgId, query, url }, `GET sensitive-data succeeded for ${label}`);
		return value;
	}

	const { kyb, directors } = organization;
	const [businessPan, unmaskedDirectors] = await Promise.all([
		isMaskedPan(kyb.businessPan)
			? reveal(
					'Business PAN',
					{ entityType: 'onboarding', field: 'pan' },
					BUSINESS_PAN_KEYS,
					kyb.businessPan
				)
			: kyb.businessPan,
		Promise.all(
			directors.map(async (director, index) => {
				const label = `Director ${index + 1}`;
				const [pan, aadhar] = await Promise.all([
					isMaskedPan(director.pan)
						? reveal(
								`${label} PAN`,
								{ entityType: 'director', field: 'pan', entityId: director.id },
								DIRECTOR_KEYS.pan,
								director.pan
							)
						: director.pan,
					isMaskedAadhar(director.aadhar)
						? reveal(
								`${label} Aadhaar`,
								{ entityType: 'director', field: 'aadhar', entityId: director.id },
								DIRECTOR_KEYS.aadhar,
								director.aadhar
							)
						: director.aadhar
				]);
				return { ...director, pan, aadhar };
			})
		)
	]);

	return {
		organization: { ...organization, kyb: { ...kyb, businessPan }, directors: unmaskedDirectors },
		sensitiveDataError: failures.length > 0 ? failures.join('; ') : null
	};
}
