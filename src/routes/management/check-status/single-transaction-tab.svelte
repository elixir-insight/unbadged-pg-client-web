<script lang="ts">
	import SearchWithDropdown from '$lib/components/reusable/search-with-dropdown/SearchWithDropdown.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Chip } from '$lib/components/ui/badge';
	import * as Card from '$lib/components/ui/card';
	import { checkTransactionStatus, CheckStatusApiError } from '$lib/api/check-status';
	import {
		SEARCH_BY_OPTIONS,
		SEARCH_BY_PLACEHOLDERS,
		searchByLabel,
		formatInr,
		formatDateTime,
		type SearchByType,
		type SingleResult,
		type SingleStatus
	} from '$lib/types/check-status';
	import { cn } from '$lib/utils';
	import CircleCheckBig from '@lucide/svelte/icons/circle-check-big';
	import Clock from '@lucide/svelte/icons/clock';
	import CircleX from '@lucide/svelte/icons/circle-x';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import Search from '@lucide/svelte/icons/search';
	import X from '@lucide/svelte/icons/x';
	import type { BadgeVariant } from '$lib/components/ui/badge';

	let searchBy = $state<SearchByType>('utr');
	let searchValue = $state('');
	let isLoading = $state(false);
	let errorMessage = $state<string | null>(null);
	let notFound = $state(false);
	let result = $state<SingleResult | null>(null);

	const selectedLabel = $derived(searchByLabel(searchBy));
	const isSubmitDisabled = $derived(isLoading || searchValue.trim().length === 0);

	const statusConfig: Record<
		SingleStatus,
		{
			icon: typeof CircleCheckBig;
			header: string;
			badgeVariant: BadgeVariant;
			container: string;
			iconWrap: string;
		}
	> = {
		Success: {
			icon: CircleCheckBig,
			header: 'bg-success/8 border-success/40',
			badgeVariant: 'success',
			container: 'border-success/40',
			iconWrap: 'text-success'
		},
		Pending: {
			icon: Clock,
			header: 'bg-warning/8 border-warning/40',
			badgeVariant: 'warning',
			container: 'border-warning/40',
			iconWrap: 'text-warning'
		},
		Failed: {
			icon: CircleX,
			header: 'bg-destructive/8 border-destructive/40',
			badgeVariant: 'error',
			container: 'border-destructive/40',
			iconWrap: 'text-destructive'
		}
	};

	function resetResult() {
		result = null;
		notFound = false;
		errorMessage = null;
	}

	function handleSearchByChange() {
		searchValue = '';
		resetResult();
	}

	function clearInput() {
		searchValue = '';
		resetResult();
	}

	async function handleSearch() {
		const value = searchValue.trim();
		if (!value || isLoading) return;

		isLoading = true;
		errorMessage = null;
		notFound = false;
		result = null;

		try {
			result = await checkTransactionStatus(searchBy, value);
		} catch (error) {
			if (error instanceof CheckStatusApiError && error.status === 404) {
				notFound = true;
			} else {
				errorMessage =
					error instanceof CheckStatusApiError
						? error.message
						: 'Unable to check status. Please try again.';
			}
		} finally {
			isLoading = false;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			void handleSearch();
		}
	}
</script>

<div class="grid gap-6 lg:grid-cols-[minmax(0,32rem)_1fr] lg:items-stretch">
	<Card.Root class="flex h-full flex-col gap-0 py-0 shadow-sm">
		<Card.Content class="flex h-full flex-col gap-6 p-4 sm:p-5">
			<SearchWithDropdown
				label="Search By"
				bind:value={searchBy}
				options={[...SEARCH_BY_OPTIONS]}
				onValueChange={handleSearchByChange}
			/>

			<div class="flex flex-col gap-3">
				<label for="single-status-search" class="text-sm font-medium text-foreground">
					{selectedLabel}
				</label>
				<div class="relative">
					<Search
						class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
					/>
					<Input
						id="single-status-search"
						bind:value={searchValue}
						placeholder={SEARCH_BY_PLACEHOLDERS[searchBy]}
						class="pr-9 pl-9"
						onkeydown={handleKeydown}
					/>
					{#if searchValue}
						<button
							type="button"
							class="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
							aria-label="Clear search"
							onclick={clearInput}
						>
							<X class="size-4" />
						</button>
					{/if}
				</div>
			</div>

			<div class="flex flex-col gap-3 pt-1">
				<Button disabled={isSubmitDisabled} onclick={() => void handleSearch()}>
					{#if isLoading}
						<LoaderCircle class="size-4 animate-spin" />
						Checking...
					{:else}
						Check Status
					{/if}
				</Button>
				{#if errorMessage}
					<p class="text-sm text-destructive" role="alert">{errorMessage}</p>
				{/if}
			</div>
		</Card.Content>
	</Card.Root>

	{#if result}
		{@const config = statusConfig[result.status]}
		{@const StatusIcon = config.icon}
		<Card.Root
			class={cn('flex h-full flex-col gap-0 overflow-hidden py-0 shadow-sm', config.container)}
		>
			<div
				class={cn(
					'flex flex-col gap-2 border-b px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5',
					config.header
				)}
			>
				<div class="flex items-center gap-2">
					<StatusIcon class={cn('size-5', config.iconWrap)} />
					<p class="text-base font-semibold text-foreground">Transaction Found</p>
				</div>
				<Chip variant={config.badgeVariant}>{result.status}</Chip>
			</div>
			{#if result.status === 'Failed' && result.failureReason}
				<p class="border-b px-4 py-2.5 text-sm text-destructive sm:px-5">{result.failureReason}</p>
			{/if}
			<Card.Content class="flex flex-1 flex-col p-5 sm:p-6">
				<dl class="grid h-full gap-5 sm:grid-cols-2 sm:grid-rows-2">
					<div class="flex flex-col gap-2">
						<dt class="text-sm text-muted-foreground">Transaction ID</dt>
						<dd class="font-mono text-base font-medium text-foreground">{result.transactionId}</dd>
					</div>
					<div class="flex flex-col gap-2">
						<dt class="text-sm text-muted-foreground">Amount</dt>
						<dd class="text-base font-medium text-foreground">{formatInr(result.amount)}</dd>
					</div>
					<div class="flex flex-col gap-2">
						<dt class="text-sm text-muted-foreground">Date &amp; Time</dt>
						<dd class="text-base font-medium text-foreground">{formatDateTime(result.date)}</dd>
					</div>
					<div class="flex flex-col gap-2">
						<dt class="text-sm text-muted-foreground">Merchant Name</dt>
						<dd class="text-base font-medium text-foreground">{result.merchantName}</dd>
					</div>
				</dl>
			</Card.Content>
		</Card.Root>
	{:else if notFound}
		<Card.Root class="flex h-full flex-col gap-0 py-0 shadow-sm">
			<Card.Content
				class="flex h-full flex-col items-center justify-center gap-3 p-5 text-center sm:p-6"
			>
				<CircleX class="size-10 text-muted-foreground" />
				<div class="space-y-1">
					<p class="text-sm font-semibold text-foreground">No transaction found</p>
					<p class="text-sm text-muted-foreground">
						We could not find a transaction matching the {selectedLabel.toLowerCase()} you entered. Check
						the value and try again.
					</p>
				</div>
			</Card.Content>
		</Card.Root>
	{/if}
</div>
