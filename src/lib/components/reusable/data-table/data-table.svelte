<script lang="ts" generics="TData extends Record<string, unknown>">
	import type { ColumnDef, SortingState } from '@tanstack/table-core';
	import { getCoreRowModel, getSortedRowModel, getFilteredRowModel } from '@tanstack/table-core';
	import { createSvelteTable, FlexRender } from '$lib/components/ui/data-table';
	import * as Table from '$lib/components/ui/table';
	import { cn } from '$lib/utils';
	import Pagination from '$lib/components/reusable/pagination/pagination.svelte';
	import { Skeleton } from '$lib/components/ui/skeleton';

	let {
		data,
		columns,
		caption = '',
		class: className = '',
		onRowClick,
		isRowClickable,
		getRowAriaLabel,
		variant = 'default',
		pageNumber,
		setPageNumber,
		totalPages,
		loading = false,
		skeletonRows = 6
	}: {
		data: TData[];
		columns: ColumnDef<TData>[];
		caption?: string;
		class?: string;
		onRowClick?: (row: TData) => void;
		/** When set, rows for which this returns false render inert and muted instead of clickable. */
		isRowClickable?: (row: TData) => boolean;
		getRowAriaLabel?: (row: TData) => string;
		variant?: 'default' | 'bordered' | 'borderless';
		pageNumber: number;
		setPageNumber: (page: number) => void;
		totalPages: number;
		loading?: boolean;
		skeletonRows?: number;
	} = $props();

	let sorting = $state<SortingState>([]);
	let globalFilter = $state('');

	const table = createSvelteTable<TData>({
		get data() {
			return data;
		},
		get columns() {
			return columns;
		},
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onSortingChange: (updater) => {
			sorting = updater instanceof Function ? updater(sorting) : updater;
		},
		onGlobalFilterChange: (updater) => {
			globalFilter = updater instanceof Function ? updater(globalFilter) : updater;
		}
	});

	const handlePreviousClick = () => {
		if (pageNumber > 1) setPageNumber(pageNumber - 1);
	};
	const handleNextClick = () => {
		if (pageNumber < totalPages) setPageNumber(pageNumber + 1);
	};
	const handleEnterPress = (value: number) => {
		if (value >= 1 && value <= totalPages) setPageNumber(value);
	};
</script>

<div class={cn('w-full min-w-0', className)}>
	<Table.Root
		class={cn(
			'min-w-max',
			variant === 'bordered' && 'border-collapse overflow-hidden rounded-sm border border-border/50'
		)}
	>
		{#if caption}
			<Table.Caption>{caption}</Table.Caption>
		{/if}

		<Table.Header>
			{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
				<Table.Row
					class={cn(
						'table-header-premium h-11 border-y border-border rounded-lg',
						variant === 'borderless' && 'border-b-0'
					)}
				>
					{#each headerGroup.headers as header (header.id)}
						<Table.Head
							colspan={header.colSpan}
							class={cn(
								'text-xs font-semibold tracking-wide text-muted-foreground/70 uppercase',
								header.column.getCanSort() &&
									'cursor-pointer transition-colors select-none hover:text-foreground',
								variant === 'bordered' && 'border border-border/50'
							)}
							onclick={() => header.column.getCanSort() && header.column.toggleSorting()}
						>
							{#if !header.isPlaceholder}
								<div class="flex items-center gap-1.5">
									<FlexRender
										content={header.column.columnDef.header}
										context={header.getContext()}
									/>
								</div>
							{/if}
						</Table.Head>
					{/each}
				</Table.Row>
			{/each}
		</Table.Header>

		<Table.Body>
			{#if loading}
				{#each Array.from({ length: skeletonRows }, (_, i) => i) as rowIdx (rowIdx)}
					<Table.Row
						class={cn(
							'border-b border-border/40',
							variant === 'borderless' && 'border-b-0',
							variant === 'bordered' && 'border-b-border/50'
						)}
					>
						{#each Array.from({ length: columns.length }, (_, i) => i) as colIdx (colIdx)}
							<Table.Cell class={cn('py-3.5', variant === 'bordered' && 'border border-border/50')}>
								<Skeleton
									class={cn('h-4', colIdx % 3 === 0 ? 'w-24' : colIdx % 3 === 1 ? 'w-32' : 'w-20')}
								/>
							</Table.Cell>
						{/each}
					</Table.Row>
				{/each}
			{:else}
				{#each table.getRowModel().rows as row (row.id)}
					{@const clickable = !!onRowClick && (!isRowClickable || isRowClickable(row.original))}
					<Table.Row
						class={cn(
							'tr-shine border-b border-border/40',
							clickable && [
								'cursor-pointer',
								'focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none focus-visible:ring-inset'
							],
							!!onRowClick && !clickable && 'cursor-default opacity-60 hover:bg-transparent',
							variant === 'borderless' && 'border-b-0',
							variant === 'bordered' && 'border-b-border/50'
						)}
						onclick={() => clickable && onRowClick?.(row.original)}
						onkeydown={clickable
							? (e: KeyboardEvent) => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault();
										onRowClick?.(row.original);
									}
								}
							: undefined}
						tabindex={clickable ? 0 : undefined}
						aria-label={clickable ? getRowAriaLabel?.(row.original) : undefined}
						data-state={row.getIsSelected() ? 'selected' : undefined}
					>
						{#each row.getVisibleCells() as cell (cell.id)}
							<Table.Cell
								class={cn('py-3.5 text-sm', variant === 'bordered' && 'border border-border/50')}
							>
								<FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
							</Table.Cell>
						{/each}
					</Table.Row>
				{:else}
					<Table.Row class={cn(variant === 'borderless' && 'border-b-0')}>
						<Table.Cell
							colspan={columns.length}
							class={cn('h-40 text-center', variant === 'bordered' && 'border border-border/50')}
						>
							<div class="flex flex-col items-center gap-2 py-4">
								<div
									class="flex size-12 items-center justify-center rounded-2xl
									            border border-dashed border-border bg-muted/10"
								>
									<svg
										class="size-5 text-muted-foreground/25"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="1.5"
											d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
										/>
									</svg>
								</div>
								<p class="text-sm font-medium text-muted-foreground/60">No results found</p>
								<p class="text-xs text-muted-foreground/40">Try adjusting your filters</p>
							</div>
						</Table.Cell>
					</Table.Row>
				{/each}
			{/if}
		</Table.Body>
	</Table.Root>
</div>

<div
	class={cn(
		'flex min-w-0 flex-wrap items-center justify-center gap-y-3 px-4 py-4 sm:flex-nowrap',
		variant !== 'bordered' && 'border-t border-border/30'
	)}
>
	{#if totalPages > 1}
		<Pagination
			currentPage={pageNumber}
			pageCount={totalPages}
			{handlePreviousClick}
			{handleNextClick}
			{handleEnterPress}
		/>
	{/if}
</div>
