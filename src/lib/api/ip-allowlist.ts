export interface WhitelistedIp extends Record<string, unknown> {
	id: number;
	ipAddress: string;
	createdAt: string;
}

interface IpAllowlistResponseBody {
	data: WhitelistedIp[];
	message: string;
	statusCode: number;
}

interface ErrorResponseBody {
	message?: string;
}

export interface CreateIpAllowlistRequest {
	ipAddress: string;
}

interface CreateIpAllowlistResponseBody {
	data: unknown[];
	message: string;
	statusCode: number;
}

export async function fetchIpAllowlist(): Promise<WhitelistedIp[]> {
	const res = await fetch('/api/ip-allowlist');
	if (!res.ok) {
		const body: ErrorResponseBody = await res.json();
		throw new Error(body.message ?? `Request failed (${res.status})`);
	}
	const body: IpAllowlistResponseBody = await res.json();
	return [...body.data].sort(
		(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
	);
}

/** Returns the backend's success message, for use in the confirmation toast. */
export async function addIpToAllowlist(ipAddress: string): Promise<string> {
	const res = await fetch('/api/ip-allowlist', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ ipAddress } satisfies CreateIpAllowlistRequest)
	});
	if (!res.ok) {
		const body: ErrorResponseBody = await res.json();
		throw new Error(body.message ?? `Request failed (${res.status})`);
	}
	const body: CreateIpAllowlistResponseBody = await res.json();
	return body.message;
}

interface DeleteIpAllowlistResponseBody {
	data: unknown[];
	message: string;
	statusCode: number;
}

/** Returns the backend's success message, for use in the confirmation toast. */
export async function deleteIpFromAllowlist(id: number): Promise<string> {
	const res = await fetch(`/api/ip-allowlist/${id}`, { method: 'DELETE' });
	if (!res.ok) {
		const body: ErrorResponseBody = await res.json();
		throw new Error(body.message ?? `Request failed (${res.status})`);
	}
	const body: DeleteIpAllowlistResponseBody = await res.json();
	return body.message;
}
