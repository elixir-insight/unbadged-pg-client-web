import type { NotificationItem, NotificationModule } from '$lib/api/notifications';

const EVENT_MODULE_HINTS: Record<string, string> = {
	MFA: 'SECURITY',
	AUTH: 'SECURITY',
	PASSWORD: 'SECURITY',
	LOGIN: 'SECURITY',
	SECURITY: 'SECURITY',
	SETTLEMENT: 'SETTLEMENT',
	ORGANIZATION: 'ORGANIZATION',
	REPORT: 'REPORTS'
};

function findModuleByCode(
	modules: NotificationModule[],
	moduleCode: string
): NotificationModule | undefined {
	return modules.find((module) => module.moduleCode === moduleCode);
}

/** Resolves the notification module used for in-app subscribe/unsubscribe actions. */
export function resolveNotificationModule(
	item: NotificationItem,
	modules: NotificationModule[]
): NotificationModule | undefined {
	const subscribableModules = modules.filter((module) => module.subscribable);
	if (subscribableModules.length === 0) return undefined;

	const fromMetadata = item.metadata?.moduleCode;
	if (typeof fromMetadata === 'string' && fromMetadata.length > 0) {
		const byMetadata = findModuleByCode(subscribableModules, fromMetadata);
		if (byMetadata) return byMetadata;
	}

	const normalizedEvent = item.eventCode.toUpperCase();
	const searchableText = `${item.title} ${item.body} ${item.eventCode}`.toLowerCase();

	for (const module of subscribableModules) {
		const moduleCode = module.moduleCode.toUpperCase();
		if (normalizedEvent.includes(moduleCode)) return module;
	}

	const eventPrefix = normalizedEvent.split('_')[0] ?? '';
	const byPrefix = findModuleByCode(subscribableModules, eventPrefix);
	if (byPrefix) return byPrefix;

	for (const module of subscribableModules) {
		const moduleCode = module.moduleCode.toUpperCase();
		if (moduleCode.startsWith(eventPrefix) || eventPrefix.startsWith(moduleCode)) {
			return module;
		}
	}

	for (const [hint, moduleCode] of Object.entries(EVENT_MODULE_HINTS)) {
		if (normalizedEvent.includes(hint)) {
			const byHint = findModuleByCode(subscribableModules, moduleCode);
			if (byHint) return byHint;
		}
	}

	for (const module of subscribableModules) {
		const moduleName = module.name.toLowerCase();
		const moduleCode = module.moduleCode.toLowerCase();
		if (searchableText.includes(moduleName) || searchableText.includes(moduleCode)) {
			return module;
		}
	}

	if (/mfa|multi-factor|authentication|password|login|security/i.test(searchableText)) {
		return findModuleByCode(subscribableModules, 'SECURITY');
	}

	return undefined;
}
