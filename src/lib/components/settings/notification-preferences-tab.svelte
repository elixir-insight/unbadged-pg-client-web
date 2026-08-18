<script lang="ts">
	import { onMount } from 'svelte';
	import { MessageSquareWarning } from '$lib/assets/icons';
	import { Button, Switch, toast } from '$lib/components/reusable';
	import {
		fetchNotificationModules,
		fetchNotificationSubscriptions,
		updateNotificationSubscriptions,
		type NotificationChannel,
		type NotificationModule,
		type NotificationsPortal,
		type NotificationSubscription
	} from '$lib/api/notifications';

	interface Props {
		portal: NotificationsPortal;
	}

	let { portal }: Props = $props();

	const CHANNELS: { value: NotificationChannel; label: string }[] = [
		{ value: 'IN_APP', label: 'In-app' },
		{ value: 'EMAIL', label: 'Email' }
	];

	let modules = $state<NotificationModule[]>([]);
	/** Key: `${moduleCode}:${channel}` */
	let subscribed = $state<Record<string, boolean>>({});
	/** Key: `${moduleCode}:${channel}` */
	let pending = $state<Record<string, boolean>>({});
	let loading = $state(true);
	let loadErrorMessage = $state<string | null>(null);

	function subscriptionKey(moduleCode: string, channel: NotificationChannel): string {
		return `${moduleCode}:${channel}`;
	}

	async function loadPreferences() {
		loading = true;
		loadErrorMessage = null;
		try {
			const [moduleList, subscriptionList] = await Promise.all([
				fetchNotificationModules(portal),
				fetchNotificationSubscriptions()
			]);
			modules = moduleList;
			const next: Record<string, boolean> = {};
			for (const subscription of subscriptionList as NotificationSubscription[]) {
				next[subscriptionKey(subscription.moduleCode, subscription.channel)] = true;
			}
			subscribed = next;
		} catch (error) {
			loadErrorMessage =
				error instanceof Error ? error.message : 'Could not load notification preferences.';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadPreferences();
	});

	function isChannelApplicable(module: NotificationModule, channel: NotificationChannel): boolean {
		if (!module.subscribable) return false;
		if (channel === 'EMAIL' && !module.emailEnabled) return false;
		return true;
	}

	async function toggleSubscription(
		module: NotificationModule,
		channel: NotificationChannel,
		nextValue: boolean
	) {
		const key = subscriptionKey(module.moduleCode, channel);
		if (pending[key]) return;

		const previousValue = subscribed[key] ?? false;
		pending = { ...pending, [key]: true };
		subscribed = { ...subscribed, [key]: nextValue };

		try {
			await updateNotificationSubscriptions([
				{ channel, moduleCode: module.moduleCode, subscribed: nextValue }
			]);
		} catch (error) {
			subscribed = { ...subscribed, [key]: previousValue };
			toast.error('Failed to update notification preference', {
				description: error instanceof Error ? error.message : 'Something went wrong.'
			});
		} finally {
			pending = { ...pending, [key]: false };
		}
	}
</script>

<div class="flex flex-col gap-4">
	<section class="overflow-hidden rounded-xl border border-border bg-card">
		<div class="px-4 py-4 sm:px-5">
			<h3 class="text-sm font-semibold text-foreground">Notification Preferences</h3>
			<p class="mt-2 text-sm text-muted-foreground">
				Choose which updates you'd like to receive, and how you'd like to receive them.
			</p>
		</div>
	</section>

	{#if loadErrorMessage}
		<section
			class="flex flex-col gap-3 rounded-xl border border-border bg-muted/30 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5"
			role="status"
		>
			<div class="flex min-w-0 items-start gap-3">
				<div
					class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
				>
					<MessageSquareWarning class="size-4" />
				</div>
				<div class="min-w-0">
					<h3 class="text-sm font-semibold text-foreground">
						Backend service temporarily unavailable
					</h3>
					<p class="mt-1 text-sm text-muted-foreground">{loadErrorMessage}</p>
				</div>
			</div>
			<Button size="sm" variant="outline" class="shrink-0" onclick={loadPreferences}>Retry</Button>
		</section>
	{:else}
		<section class="overflow-hidden rounded-xl border border-border bg-card">
			{#if loading}
				<p class="px-4 py-6 text-center text-sm text-muted-foreground sm:px-5">Loading…</p>
			{:else if modules.length === 0}
				<p class="px-4 py-6 text-center text-sm text-muted-foreground sm:px-5">
					No notification modules are available.
				</p>
			{:else}
				{#each modules as module, index (module.moduleCode)}
					<div class={index < modules.length - 1 ? 'border-b border-border/40' : ''}>
						<div
							class="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:px-5"
						>
							<div class="min-w-0 flex-1">
								<h4 class="text-sm font-semibold text-foreground">{module.name}</h4>
								<p class="mt-1 text-sm text-muted-foreground">{module.description}</p>
							</div>

							{#if module.subscribable}
								<div class="flex shrink-0 items-center gap-6">
									{#each CHANNELS as channel (channel.value)}
										{#if isChannelApplicable(module, channel.value)}
											{@const key = subscriptionKey(module.moduleCode, channel.value)}
											<label class="flex cursor-pointer items-center gap-2">
												<span class="text-xs font-medium text-muted-foreground"
													>{channel.label}</span
												>
												<Switch
													size="sm"
													checked={subscribed[key] ?? false}
													disabled={pending[key] ?? false}
													onCheckedChange={(next) =>
														toggleSubscription(module, channel.value, next)}
												/>
											</label>
										{/if}
									{/each}
								</div>
							{/if}
						</div>
					</div>
				{/each}
			{/if}
		</section>
	{/if}
</div>
