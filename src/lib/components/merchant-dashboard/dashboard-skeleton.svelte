<script lang="ts">
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { cn } from '$lib/utils';

	interface Props {
		class?: string;
	}

	let { class: className }: Props = $props();
</script>

<div
	class={cn('space-y-4 pb-1', className)}
	aria-busy="true"
	aria-live="polite"
	aria-label="Loading dashboard"
>
	<section aria-hidden="true" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
		{#each Array.from({ length: 4 }, (_, i) => i) as i (i)}
			<article class="flex min-h-32 flex-col rounded-lg border border-border bg-card p-5 shadow-xs">
				<Skeleton class="h-4 w-28" />
				<Skeleton class="mt-3 h-8 w-24" />
				<Skeleton class="mt-auto h-4 w-32 pt-3" />
			</article>
		{/each}
	</section>

	<section aria-hidden="true" class="grid grid-cols-12 gap-4">
		<div
			class="col-span-12 flex min-h-80 flex-col rounded-lg border border-border bg-card p-4 shadow-xs lg:col-span-8"
		>
			<div class="mb-4 flex items-center justify-between gap-3">
				<div class="space-y-2">
					<Skeleton class="h-4 w-36" />
					<Skeleton class="h-3 w-48" />
				</div>
				<Skeleton class="h-8 w-28 rounded-md" />
			</div>
			<Skeleton class="min-h-0 w-full flex-1 rounded-md" />
		</div>
		<div
			class="col-span-12 flex min-h-80 flex-col rounded-lg border border-border bg-card p-4 shadow-xs lg:col-span-4"
		>
			<div class="mb-4 space-y-2">
				<Skeleton class="h-4 w-28" />
				<Skeleton class="h-3 w-40" />
			</div>
			<Skeleton class="mx-auto size-40 rounded-full" />
			<div class="mt-6 space-y-3">
				{#each Array.from({ length: 4 }, (_, i) => i) as i (i)}
					<div class="flex items-center justify-between gap-3">
						<Skeleton class="h-3 w-24" />
						<Skeleton class="h-3 w-12" />
					</div>
				{/each}
			</div>
		</div>
	</section>

	<section aria-hidden="true" class="grid grid-cols-12 items-stretch gap-4">
		<div
			class="col-span-12 flex h-full min-h-72 flex-col rounded-lg border border-border bg-card p-4 shadow-xs lg:col-span-5"
		>
			<div class="mb-4 space-y-2">
				<Skeleton class="h-4 w-32" />
				<Skeleton class="h-3 w-40" />
			</div>
			<div class="flex flex-1 flex-col justify-center gap-3">
				<Skeleton class="h-10 w-full rounded-md" />
				<Skeleton class="h-10 w-11/12 rounded-md" />
				<Skeleton class="h-10 w-4/5 rounded-md" />
				<Skeleton class="h-10 w-3/5 rounded-md" />
			</div>
		</div>
		<div
			class="col-span-12 flex h-full min-h-72 flex-col overflow-hidden rounded-lg border border-border bg-card shadow-xs lg:col-span-7"
		>
			<div class="flex items-center justify-between gap-3 px-4 py-3">
				<div class="space-y-2">
					<Skeleton class="h-4 w-36" />
					<Skeleton class="h-3 w-40" />
				</div>
				<Skeleton class="h-3 w-16" />
			</div>
			<div class="border-y border-border bg-muted/40 px-4 py-2.5">
				<div class="flex gap-4">
					<Skeleton class="h-3 w-16" />
					<Skeleton class="h-3 w-20" />
					<Skeleton class="hidden h-3 w-16 lg:block" />
					<Skeleton class="h-3 w-14" />
					<Skeleton class="ml-auto h-3 w-16" />
				</div>
			</div>
			<div class="divide-y divide-border">
				{#each Array.from({ length: 6 }, (_, i) => i) as i (i)}
					<div class="flex items-center gap-4 px-4 py-3">
						<div class="min-w-0 flex-1 space-y-1.5">
							<Skeleton class="h-3 w-28" />
							<Skeleton class="h-3 w-20" />
						</div>
						<Skeleton class="h-3 w-24" />
						<Skeleton class="h-5 w-16 rounded-full" />
						<Skeleton class="ml-auto h-3 w-16" />
					</div>
				{/each}
			</div>
		</div>
	</section>

	<section
		aria-hidden="true"
		class="overflow-hidden rounded-lg border border-border bg-card shadow-xs"
	>
		<div class="flex items-center justify-between gap-3 px-3 py-3">
			<div class="space-y-2">
				<Skeleton class="h-4 w-28" />
				<Skeleton class="h-3 w-40" />
			</div>
			<Skeleton class="h-3 w-16" />
		</div>
		<div
			class="mx-3 mb-3 grid gap-3 rounded-md border border-border bg-muted/30 p-3 sm:grid-cols-4"
		>
			{#each Array.from({ length: 4 }, (_, i) => i) as i (i)}
				<div class="space-y-2">
					<Skeleton class="h-3 w-20" />
					<Skeleton class="h-4 w-24" />
				</div>
			{/each}
		</div>
		<div class="border-y border-border bg-muted/40 px-3 py-2">
			<div class="flex gap-4">
				<Skeleton class="h-3 w-24" />
				<Skeleton class="h-3 w-16" />
				<Skeleton class="ml-auto h-3 w-14" />
				<Skeleton class="h-3 w-16" />
				<Skeleton class="h-3 w-20" />
			</div>
		</div>
		<div class="divide-y divide-border">
			{#each Array.from({ length: 5 }, (_, i) => i) as i (i)}
				<div class="flex items-center gap-3 px-3 py-2">
					<Skeleton class="h-3 w-28" />
					<Skeleton class="h-3 w-20" />
					<Skeleton class="ml-auto h-3 w-16" />
					<Skeleton class="h-3 w-14" />
					<Skeleton class="h-5 w-16 rounded-full" />
				</div>
			{/each}
		</div>
	</section>
</div>
