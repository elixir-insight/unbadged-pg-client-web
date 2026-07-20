<script lang="ts">
	import { Skeleton } from '$lib/components/ui/skeleton';
</script>

<div class="m-auto w-full space-y-6 md:w-[75%]" aria-busy="true" aria-label="Loading user details">
	<!-- Header -->
	<div class="flex flex-wrap items-start justify-between gap-4">
		<div class="space-y-2">
			<Skeleton class="h-8 w-40" />
			<Skeleton class="h-4 w-56" />
		</div>
		<Skeleton class="h-9 w-20 rounded-md" />
	</div>

	<div class="space-y-6 rounded-xl border border-border p-8 shadow">
		<!-- Hero -->
		<div class="rounded-xl border border-primary/20 bg-primary/5 p-5 shadow-sm">
			<div class="flex flex-wrap items-center gap-4">
				<Skeleton class="h-16 w-16 shrink-0 rounded-xl" />
				<div class="min-w-0 flex-1 space-y-2">
					<div class="flex flex-wrap items-center gap-2">
						<Skeleton class="h-5 w-40" />
						<Skeleton class="h-5 w-16 rounded-full" />
					</div>
					<Skeleton class="h-4 w-52" />
					<div class="flex flex-wrap gap-2 pt-1">
						<Skeleton class="h-6 w-24 rounded-full" />
						<Skeleton class="h-6 w-20 rounded-full" />
					</div>
				</div>
			</div>
		</div>

		<!-- Contact Information -->
		<div class="space-y-4">
			<Skeleton class="h-3 w-36" />
			<div class="grid gap-4 sm:grid-cols-2">
				{#each [0, 1, 2, 3] as i (i)}
					<div class="rounded-xl border border-border bg-card p-4 shadow-sm">
						<div class="flex items-start gap-3">
							<Skeleton class="h-10 w-10 shrink-0 rounded-full" />
							<div class="min-w-0 flex-1 space-y-2">
								<Skeleton class="h-3 w-20" />
								<Skeleton class="h-4 w-36" />
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Assigned Roles -->
		<div class="space-y-4">
			<div class="flex items-center gap-2">
				<Skeleton class="h-8 w-8 rounded-lg" />
				<Skeleton class="h-3 w-28" />
				<Skeleton class="h-5 w-6 rounded-full" />
			</div>
			<div class="flex flex-wrap gap-2">
				{#each [0, 1, 2] as i (i)}
					<Skeleton class="h-7 w-28 rounded-full" />
				{/each}
			</div>
		</div>
	</div>

	<!-- Footer actions -->
	<div class="flex justify-end gap-2 pt-2">
		<Skeleton class="h-9 w-24 rounded-md" />
		<Skeleton class="h-9 w-20 rounded-md" />
	</div>
</div>
