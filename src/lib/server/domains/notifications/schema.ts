import * as v from 'valibot';

export const NOTIFICATION_CHANNELS = ['EMAIL', 'IN_APP'] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export const NOTIFICATION_ACTIONS = ['READ', 'DONE'] as const;
export type NotificationAction = (typeof NOTIFICATION_ACTIONS)[number];

export const NotificationModuleSchema = v.object({
	moduleCode: v.string(),
	name: v.string(),
	description: v.string(),
	subscribable: v.boolean(),
	emailEnabled: v.boolean()
});

export const GetNotificationModulesResponseSchema = v.object({
	data: v.array(NotificationModuleSchema),
	message: v.string(),
	statusCode: v.number()
});

export type NotificationModule = v.InferOutput<typeof NotificationModuleSchema>;
export type GetNotificationModulesResponse = v.InferOutput<
	typeof GetNotificationModulesResponseSchema
>;

export const NotificationSchema = v.object({
	notificationId: v.number(),
	title: v.string(),
	body: v.string(),
	eventCode: v.string(),
	actionUrl: v.optional(v.nullable(v.string())),
	metadata: v.optional(v.record(v.string(), v.unknown())),
	read: v.boolean(),
	createdAt: v.string()
});

export const NotificationPaginationSchema = v.object({
	limit: v.number(),
	page: v.number(),
	total: v.number()
});

export const ListNotificationsResponseSchema = v.object({
	data: v.array(NotificationSchema),
	message: v.string(),
	pagination: NotificationPaginationSchema,
	statusCode: v.number()
});

export type Notification = v.InferOutput<typeof NotificationSchema>;
export type NotificationPagination = v.InferOutput<typeof NotificationPaginationSchema>;
export type ListNotificationsResponse = v.InferOutput<typeof ListNotificationsResponseSchema>;

export const UpdateNotificationStateRequestSchema = v.object({
	action: v.picklist(NOTIFICATION_ACTIONS)
});

export type UpdateNotificationStateRequest = v.InferOutput<
	typeof UpdateNotificationStateRequestSchema
>;

export const UpdateNotificationStateResponseSchema = v.object({
	data: v.array(v.unknown()),
	message: v.string(),
	statusCode: v.number()
});

export type UpdateNotificationStateResponse = v.InferOutput<
	typeof UpdateNotificationStateResponseSchema
>;

export const NotificationSubscriptionSchema = v.object({
	moduleCode: v.string(),
	channel: v.picklist(NOTIFICATION_CHANNELS)
});

export const GetNotificationSubscriptionsResponseSchema = v.object({
	data: v.array(NotificationSubscriptionSchema),
	message: v.string(),
	statusCode: v.number()
});

export type NotificationSubscription = v.InferOutput<typeof NotificationSubscriptionSchema>;
export type GetNotificationSubscriptionsResponse = v.InferOutput<
	typeof GetNotificationSubscriptionsResponseSchema
>;

export const UpdateNotificationSubscriptionsRequestSchema = v.object({
	subscriptions: v.array(
		v.object({
			channel: v.picklist(NOTIFICATION_CHANNELS),
			moduleCode: v.string(),
			subscribed: v.boolean()
		})
	)
});

export type UpdateNotificationSubscriptionsRequest = v.InferOutput<
	typeof UpdateNotificationSubscriptionsRequestSchema
>;

export const UpdateNotificationSubscriptionsResponseSchema = v.object({
	data: v.array(v.unknown()),
	message: v.string(),
	statusCode: v.number()
});

export type UpdateNotificationSubscriptionsResponse = v.InferOutput<
	typeof UpdateNotificationSubscriptionsResponseSchema
>;
