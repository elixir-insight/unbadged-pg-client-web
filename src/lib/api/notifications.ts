export type NotificationsPortal = 'management' | 'merchant';

export type NotificationChannel = 'EMAIL' | 'IN_APP';
export type NotificationAction = 'READ' | 'DONE';

export interface NotificationModule {
	moduleCode: string;
	name: string;
	description: string;
	subscribable: boolean;
	emailEnabled: boolean;
}

export interface NotificationItem extends Record<string, unknown> {
	notificationId: number;
	title: string;
	body: string;
	eventCode: string;
	actionUrl?: string | null;
	metadata?: Record<string, unknown>;
	read: boolean;
	createdAt: string;
}

export interface NotificationsPagination {
	limit: number;
	page: number;
	total: number;
}

export interface NotificationSubscription {
	moduleCode: string;
	channel: NotificationChannel;
}

interface ErrorResponseBody {
	message?: string;
}

interface NotificationModulesResponseBody {
	data: NotificationModule[];
	message: string;
	statusCode: number;
}

interface ListNotificationsResponseBody {
	data: NotificationItem[];
	message: string;
	pagination: NotificationsPagination;
	statusCode: number;
}

interface NotificationSubscriptionsResponseBody {
	data: NotificationSubscription[];
	message: string;
	statusCode: number;
}

interface AckResponseBody {
	data: unknown[];
	message: string;
	statusCode: number;
}

async function throwOnError(res: Response): Promise<void> {
	if (res.ok) return;
	const body: ErrorResponseBody = await res.json().catch(() => ({}));
	throw new Error(body.message ?? `Request failed (${res.status})`);
}

export async function fetchNotificationModules(
	portal: NotificationsPortal
): Promise<NotificationModule[]> {
	const res = await fetch(`/api/notifications/modules?portal=${portal}`);
	await throwOnError(res);
	const body: NotificationModulesResponseBody = await res.json();
	return body.data;
}

export type FetchNotificationsOptions = {
	read?: boolean;
};

export async function fetchNotifications(
	page = 1,
	limit = 10,
	options: FetchNotificationsOptions = {}
): Promise<{ items: NotificationItem[]; pagination: NotificationsPagination }> {
	const params = new URLSearchParams({
		page: String(page),
		limit: String(limit)
	});
	if (options.read !== undefined) {
		params.set('read', String(options.read));
	}
	const res = await fetch(`/api/notifications?${params.toString()}`);
	await throwOnError(res);
	const body: ListNotificationsResponseBody = await res.json();
	return { items: body.data, pagination: body.pagination };
}

export async function updateNotificationState(
	notificationId: number,
	action: NotificationAction
): Promise<string> {
	const res = await fetch(`/api/notifications/${notificationId}`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ action })
	});
	await throwOnError(res);
	const body: AckResponseBody = await res.json();
	return body.message;
}

export async function markNotificationRead(notificationId: number): Promise<string> {
	return updateNotificationState(notificationId, 'READ');
}

/** Marks a notification as done, removing it from the user's active notification list. */
export async function markNotificationDone(notificationId: number): Promise<string> {
	return updateNotificationState(notificationId, 'DONE');
}

export async function fetchNotificationSubscriptions(): Promise<NotificationSubscription[]> {
	const res = await fetch('/api/notifications/subscriptions');
	await throwOnError(res);
	const body: NotificationSubscriptionsResponseBody = await res.json();
	return body.data;
}

export async function updateNotificationSubscriptions(
	subscriptions: { channel: NotificationChannel; moduleCode: string; subscribed: boolean }[]
): Promise<string> {
	const res = await fetch('/api/notifications/subscriptions', {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ subscriptions })
	});
	await throwOnError(res);
	const body: AckResponseBody = await res.json();
	return body.message;
}
