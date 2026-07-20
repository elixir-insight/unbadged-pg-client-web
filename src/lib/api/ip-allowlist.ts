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
