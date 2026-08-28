<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { SvelteSet } from 'svelte/reactivity';
	import { SvelteURL } from 'svelte/reactivity';
	import { Bell, BellOff, Check, MessageSquareWarning } from '$lib/assets/icons';
	import { Button, Pagination, Search, Tooltip, toast } from '$lib/components/reusable';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { formatRelativeTime } from '$lib/utils/format-time';
	import { debounce } from '$lib/utils/debounce.js';
	import { cn } from '$lib/utils';
	import { resolveNotificationModule } from '$lib/components/notifications/notification-module';
	import {
		fetchNotificationModules,
		fetchNotificationSubscriptions,
		fetchNotifications,
		markNotificationDone,
		markNotificationRead,
		updateNotificationSubscriptions,
		type NotificationItem,
		type NotificationModule,
		type NotificationsPagination,
		type NotificationsPortal
	} from '$lib/api/notifications';

	const DEFAULT_LIMIT = 25;
	const HEADER_GRID = 'grid grid-cols-[12px_16px_1fr] items-center gap-3';
	const ROW_GRID = 'grid grid-cols-[12px_16px_1fr_auto] items-start gap-3';

	let loading = $state(false);
	let errorMessage = $state<string | null>(null);
	let items = $state<NotificationItem[]>([]);
	let pagination = $state<NotificationsPagination>({ page: 1, limit: DEFAULT_LIMIT, total: 0 });
	let markingAll = $state(false);
	let bulkAction = $state(false);
	let hasLoadedOnce = $state(false);
	const selectedIds = new SvelteSet<number>();
	const doneIds = new SvelteSet<number>();
	const pendingSubscriptions = new SvelteSet<string>();

	let modules = $state<NotificationModule[]>([]);
	let subscribed = $state<Record<string, boolean>>({});

	const portal = $derived<NotificationsPortal>(
		page.url.pathname.startsWith('/merchant') ? 'merchant' : 'management'
	);

	const currentPage = $derived(Math.max(1, Number(page.url.searchParams.get('page')) || 1));
	const limit = $derived(Math.max(1, Number(page.url.searchParams.get('limit')) || DEFAULT_LIMIT));
	const statusFilter = $derived(
		page.url.searchParams.get('status') === 'unread' ? 'unread' : 'all'
	);
	const searchQuery = $derived(page.url.searchParams.get('search') ?? '');

	const pageCount = $derived(Math.max(1, Math.ceil(pagination.total / limit)));

	const visibleItems = $derived.by(() => {
		const query = searchQuery.trim().toLowerCase();
		if (!query) return items;
		return items.filter(
			(item) => item.title.toLowerCase().includes(query) || item.body.toLowerCase().includes(query)
		);
	});

	const unreadOnPage = $derived(visibleItems.filter((item) => !item.read));
	const selectedCount = $derived(selectedIds.size);
	const allVisibleSelected = $derived(
		visibleItems.length > 0 && visibleItems.every((item) => selectedIds.has(item.notificationId))
	);
	const someVisibleSelected = $derived(
		visibleItems.some((item) => selectedIds.has(item.notificationId)) && !allVisibleSelected
	);

	$effect.pre(() => {
		void currentPage;
		void statusFilter;
		void limit;
		selectedIds.clear();
	});

	async function loadNotifications() {
		loading = true;
		errorMessage = null;
		try {
			const read = statusFilter === 'unread' ? false : undefined;
			const { items: fetched, pagination: nextPagination } = await fetchNotifications(
				currentPage,
				limit,
				{ read }
			);
			items = statusFilter === 'unread' ? fetched.filter((item) => !item.read) : fetched;
			pagination = nextPagination;
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Could not load notifications.';
		} finally {
			loading = false;
			hasLoadedOnce = true;
		}
	}

	$effect(() => {
		void currentPage;
		void limit;
		void statusFilter;
		loadNotifications();
	});

	$effect(() => {
		void portal;
		loadSubscriptionData();
	});

	function subscriptionKey(moduleCode: string): string {
		return `${moduleCode}:IN_APP`;
	}

	function getModule(item: NotificationItem): NotificationModule | undefined {
		return resolveNotificationModule(item, modules);
	}

	function canManageSubscription(item: NotificationItem): boolean {
		return getModule(item) !== undefined;
	}

	function isSubscribed(item: NotificationItem): boolean {
		const module = getModule(item);
		if (!module) return true;
		return subscribed[subscriptionKey(module.moduleCode)] ?? false;
	}

	async function loadSubscriptionData() {
		try {
			const [moduleList, subscriptionList] = await Promise.all([
				fetchNotificationModules(portal),
				fetchNotificationSubscriptions()
			]);
			modules = moduleList;
			const next: Record<string, boolean> = {};
			for (const subscription of subscriptionList) {
				next[`${subscription.moduleCode}:${subscription.channel}`] = true;
			}
			subscribed = next;
		} catch {
			modules = [];
			subscribed = {};
		}
	}

	async function toggleSubscription(event: MouseEvent, item: NotificationItem, nextValue: boolean) {
		event.stopPropagation();
		const module = getModule(item);
		if (!module?.subscribable) return;

		const key = subscriptionKey(module.moduleCode);
		if (pendingSubscriptions.has(key)) return;

		const previousValue = subscribed[key] ?? false;
		pendingSubscriptions.add(key);
		subscribed = { ...subscribed, [key]: nextValue };

		try {
			await updateNotificationSubscriptions([
				{ channel: 'IN_APP', moduleCode: module.moduleCode, subscribed: nextValue }
			]);
		} catch (error) {
			subscribed = { ...subscribed, [key]: previousValue };
			toast.error(`Failed to ${nextValue ? 'subscribe' : 'unsubscribe'}`, {
				description: error instanceof Error ? error.message : 'Something went wrong.'
			});
		} finally {
			pendingSubscriptions.delete(key);
		}
	}

	function navigateParams(updates: Record<string, string | null>, replace = false) {
		const url = new SvelteURL(page.url.toString());
		for (const [key, value] of Object.entries(updates)) {
			if (value === null || value === '') {
				url.searchParams.delete(key);
			} else {
				url.searchParams.set(key, value);
			}
		}
		goto(resolve(`${url.pathname}${url.search}` as '/'), {
			replaceState: replace,
			keepFocus: true,
			noScroll: true
		});
	}

	function setStatusFilter(next: 'all' | 'unread') {
		navigateParams({ status: next === 'all' ? null : next, page: '1' });
	}

	const debouncedSetSearch = debounce((value: string) => {
		navigateParams({ search: value || null, page: '1' }, true);
	}, 200);

	function setPage(nextPage: number) {
		const clamped = Math.min(Math.max(nextPage, 1), pageCount);
		navigateParams({ page: clamped === 1 ? null : String(clamped) });
	}

	function toggleSelectAll(checked: boolean) {
		if (checked) {
			for (const item of visibleItems) {
				selectedIds.add(item.notificationId);
			}
		} else {
			for (const item of visibleItems) {
				selectedIds.delete(item.notificationId);
			}
		}
	}

	function toggleSelected(notificationId: number, checked: boolean) {
		if (checked) {
			selectedIds.add(notificationId);
		} else {
			selectedIds.delete(notificationId);
		}
	}

	async function handleItemClick(item: NotificationItem) {
		if (!item.read) {
			items = items.map((notification) =>
				notification.notificationId === item.notificationId
					? { ...notification, read: true }
					: notification
			);
			try {
				await markNotificationRead(item.notificationId);
			} catch {
				items = items.map((notification) =>
					notification.notificationId === item.notificationId
						? { ...notification, read: false }
						: notification
				);
			}
		}
		if (item.actionUrl) {
			window.location.href = item.actionUrl;
		}
	}

	async function handleMarkDone(event: MouseEvent, item: NotificationItem) {
		event.stopPropagation();
		if (doneIds.has(item.notificationId)) return;

		doneIds.add(item.notificationId);
		selectedIds.delete(item.notificationId);
		const previous = items;
		items = items.filter((notification) => notification.notificationId !== item.notificationId);
		pagination = { ...pagination, total: Math.max(0, pagination.total - 1) };

		try {
			await markNotificationDone(item.notificationId);
		} catch (error) {
			items = previous;
			pagination = { ...pagination, total: pagination.total + 1 };
			toast.error('Failed to mark notification as done', {
				description: error instanceof Error ? error.message : 'Something went wrong.'
			});
		} finally {
			doneIds.delete(item.notificationId);
		}
	}

	async function handleMarkAllRead() {
		const unread = items.filter((item) => !item.read);
		if (unread.length === 0 || markingAll) return;

		markingAll = true;
		const previous = items;
		items = items.map((item) => ({ ...item, read: true }));
		try {
			await Promise.all(unread.map((item) => markNotificationRead(item.notificationId)));
		} catch {
			items = previous;
			toast.error('Failed to mark all as read');
		} finally {
			markingAll = false;
		}
	}

	async function handleBulkMarkRead() {
		const targets = items.filter((item) => selectedIds.has(item.notificationId) && !item.read);
		if (targets.length === 0 || bulkAction) return;

		bulkAction = true;
		const previous = items;
		items = items.map((item) =>
			selectedIds.has(item.notificationId) ? { ...item, read: true } : item
		);
		try {
			await Promise.all(targets.map((item) => markNotificationRead(item.notificationId)));
			selectedIds.clear();
		} catch {
			items = previous;
			toast.error('Failed to mark selected notifications as read');
		} finally {
			bulkAction = false;
		}
	}

	async function handleBulkMarkDone() {
		const targets = items.filter((item) => selectedIds.has(item.notificationId));
		if (targets.length === 0 || bulkAction) return;

		bulkAction = true;
		const previousItems = items;
		const previousPagination = pagination;
		const targetIds = targets.map((item) => item.notificationId);
		items = items.filter((item) => !targetIds.includes(item.notificationId));
		pagination = {
			...pagination,
			total: Math.max(0, pagination.total - targetIds.length)
		};

		try {
			await Promise.all(targetIds.map((id) => markNotificationDone(id)));
			selectedIds.clear();
		} catch (error) {
			items = previousItems;
			pagination = previousPagination;
			toast.error('Failed to mark selected notifications as done', {
				description: error instanceof Error ? error.message : 'Something went wrong.'
			});
		} finally {
			bulkAction = false;
		}
	}
</script>

<div class="flex flex-col gap-4">
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
		{#if unreadOnPage.length > 0}
			<Button
				variant="link"
				class="h-auto self-start p-0 text-sm"
				disabled={markingAll}
				onclick={handleMarkAllRead}
			>
				Mark all as read
			</Button>
		{/if}
	</div>

	<div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
		<div class="flex items-center gap-1 rounded-lg border border-border p-1">
			<Button
				variant={statusFilter === 'all' ? 'secondary' : 'ghost'}
				size="sm"
				class="h-8"
				onclick={() => setStatusFilter('all')}
			>
				All
			</Button>
			<Button
				variant={statusFilter === 'unread' ? 'secondary' : 'ghost'}
				size="sm"
				class="h-8"
				onclick={() => setStatusFilter('unread')}
			>
				Unread
			</Button>
		</div>

		<Search
			value={searchQuery}
			placeholder="Search notifications"
			variant="bordered"
			class="w-full lg:max-w-sm"
			oninput={(event) => debouncedSetSearch((event.currentTarget as HTMLInputElement).value)}
		/>
	</div>

	{#if selectedCount > 0}
		<div
			class="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2"
		>
			<span class="text-sm text-muted-foreground">{selectedCount} selected</span>
			<Button variant="outline" size="sm" disabled={bulkAction} onclick={handleBulkMarkRead}>
				Mark selected as read
			</Button>
			<Button variant="outline" size="sm" disabled={bulkAction} onclick={handleBulkMarkDone}>
				Mark selected as done
			</Button>
		</div>
	{/if}

	<div class="overflow-hidden rounded-lg border border-border">
		<div class="{HEADER_GRID} border-b border-border bg-muted/30 px-3 py-2">
			<span class="size-2 shrink-0" aria-hidden="true"></span>
			<Checkbox
				checked={allVisibleSelected}
				indeterminate={someVisibleSelected}
				disabled={visibleItems.length === 0}
				onCheckedChange={(checked) => toggleSelectAll(checked === true)}
				aria-label="Select all notifications"
			/>
			<span class="text-sm font-medium text-muted-foreground">Select all</span>
		</div>

		{#if loading && !hasLoadedOnce}
			<p class="px-4 py-10 text-center text-sm text-muted-foreground">Loading…</p>
		{:else if errorMessage}
			<div class="flex flex-col items-center gap-2 px-4 py-10 text-center">
				<MessageSquareWarning class="size-5 text-muted-foreground" />
				<p class="text-sm text-muted-foreground">{errorMessage}</p>
				<Button variant="outline" size="sm" onclick={loadNotifications}>Retry</Button>
			</div>
		{:else if visibleItems.length === 0}
			<div class="flex flex-col items-center gap-2 px-4 py-10 text-center">
				<BellOff class="size-5 text-muted-foreground" />
				<p class="text-sm text-muted-foreground">
					{searchQuery ? 'No notifications match your search.' : "You're all caught up."}
				</p>
			</div>
		{:else}
			<ul class="divide-y divide-border" role="list">
				{#each visibleItems as item (item.notificationId)}
					<li class="group relative">
						<div
							class={cn(
								ROW_GRID,
								'px-3 py-3 transition-colors hover:bg-accent/50',
								!item.read && 'bg-accent/20'
							)}
						>
							<span
								class={cn(
									'mt-1.5 size-2 shrink-0 rounded-full',
									!item.read ? 'bg-primary' : 'invisible'
								)}
								aria-hidden="true"
							></span>

							<Checkbox
								class="mt-0.5"
								checked={selectedIds.has(item.notificationId)}
								onCheckedChange={(checked) => toggleSelected(item.notificationId, checked === true)}
								aria-label={`Select ${item.title}`}
							/>

							<button type="button" class="min-w-0 text-left" onclick={() => handleItemClick(item)}>
								<p class="text-sm font-medium text-foreground">{item.title}</p>
								<p class="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{item.body}</p>
								<p class="mt-1 text-xs text-muted-foreground">
									{formatRelativeTime(new Date(item.createdAt).getTime())}
								</p>
							</button>

							<div
								class="flex items-center gap-1 self-center opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
							>
								<Tooltip content="Mark as done">
									<button
										type="button"
										class="flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
										disabled={doneIds.has(item.notificationId)}
										onclick={(event) => handleMarkDone(event, item)}
										aria-label="Mark as done"
									>
										<Check class="size-3.5" />
									</button>
								</Tooltip>

								{#if canManageSubscription(item)}
									{#if isSubscribed(item)}
										<Tooltip content="Unsubscribe">
											<button
												type="button"
												class="flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
												disabled={pendingSubscriptions.has(
													subscriptionKey(getModule(item)!.moduleCode)
												)}
												onclick={(event) => toggleSubscription(event, item, false)}
												aria-label="Unsubscribe"
											>
												<BellOff class="size-3.5" />
											</button>
										</Tooltip>
									{:else}
										<Tooltip content="Subscribe">
											<button
												type="button"
												class="flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
												disabled={pendingSubscriptions.has(
													subscriptionKey(getModule(item)!.moduleCode)
												)}
												onclick={(event) => toggleSubscription(event, item, true)}
												aria-label="Subscribe"
											>
												<Bell class="size-3.5" />
											</button>
										</Tooltip>
									{/if}
								{/if}
							</div>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</div>

	{#if pagination.total > 0}
		<div class="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
			<p class="text-sm text-muted-foreground">
				{#if searchQuery}
					Showing {visibleItems.length} result{visibleItems.length === 1 ? '' : 's'} on this page
				{:else if pagination.total === 0}
					No results
				{:else}
					Showing {(currentPage - 1) * limit + 1}–{Math.min(currentPage * limit, pagination.total)}
					of {pagination.total}
				{/if}
			</p>
			{#if !searchQuery && pageCount > 1}
				<Pagination
					{pageCount}
					{currentPage}
					handlePreviousClick={() => setPage(currentPage - 1)}
					handleNextClick={() => setPage(currentPage + 1)}
					handleEnterPress={setPage}
				/>
			{/if}
		</div>
	{/if}
</div>
