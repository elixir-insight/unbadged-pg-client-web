export type NotificationsApiPortal = 'management' | 'merchant';

export function parseNotificationsPortal(value: string | null): NotificationsApiPortal | null {
	if (value === 'management' || value === 'merchant') return value;
	return null;
}

export function notificationsBasePath(portal: NotificationsApiPortal): string {
	return `/api/v1/${portal}`;
}
