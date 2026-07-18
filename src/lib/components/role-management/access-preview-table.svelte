<script lang="ts">
	import PermissionDot from '$lib/components/role-management/permission-dot.svelte';
	import type { PermModule } from '$lib/stores/role-management/role-management';

	let { modules }: { modules: PermModule[] } = $props();

	const permColumns = [
		{ key: 'read', label: 'Read' },
		{ key: 'writeUnrestricted', label: 'Write\n(unrestricted)' },
		{ key: 'writeRestricted', label: 'Write\n(restricted)' },
		{ key: 'delete', label: 'Delete' },
		{ key: 'approve', label: 'Approve' }
	] as const;
</script>

<div class="rounded-xl border border-border bg-card p-5 shadow">
	<div class="mb-4">
		<h2 class="text-sm font-semibold text-foreground">Access &amp; permissions</h2>
	</div>

	<div class="overflow-x-auto">
		<table class="w-full min-w-160">
			<thead>
				<tr>
					<th class="w-60 pb-3 text-left"></th>
					{#each permColumns as col (col.key)}
						<th class="min-w-20 pb-3 text-center text-xs font-medium text-muted-foreground">
							{#each col.label.split('\n') as line, i (i)}
								{#if i > 0}<br />{/if}{line}
							{/each}
						</th>
					{/each}
				</tr>
			</thead>
			<tbody class="divide-y divide-border">
				{#each modules as mod (mod.name)}
					<tr>
						<td class="py-3 pr-4">
							<div class="flex items-center gap-3">
								<div
									class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground shadow"
								>
									<mod.icon class="h-4 w-4" />
								</div>
								<span class="text-sm text-foreground">{mod.name}</span>
							</div>
						</td>
						{#each permColumns as col (col.key)}
							<td class="py-3 text-center">
								<div class="flex justify-center">
									<PermissionDot status={mod[col.key]} />
								</div>
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
