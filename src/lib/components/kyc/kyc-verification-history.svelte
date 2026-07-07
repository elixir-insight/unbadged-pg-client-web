<script lang="ts">
	import * as Table from '$lib/components/ui/table';
	import KycStatusBadge from './kyc-status-badge.svelte';
	import type { VerificationHistoryEntry } from './types';

	let { history }: { history: VerificationHistoryEntry[] } = $props();
</script>

<div>
	<p class="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
		Verification history
	</p>
	<div class="overflow-hidden rounded-xl border border-border bg-card">
		<Table.Root>
			<Table.Header>
				<Table.Row class="border-b border-border hover:bg-transparent">
					<Table.Head
						class="px-4 py-2.5 text-[11px] font-medium tracking-wider text-muted-foreground uppercase"
					>
						Timestamp
					</Table.Head>
					<Table.Head
						class="px-4 py-2.5 text-[11px] font-medium tracking-wider text-muted-foreground uppercase"
					>
						Method
					</Table.Head>
					<Table.Head
						class="px-4 py-2.5 text-[11px] font-medium tracking-wider text-muted-foreground uppercase"
					>
						Identifier
					</Table.Head>
					<Table.Head
						class="px-4 py-2.5 text-[11px] font-medium tracking-wider text-muted-foreground uppercase"
					>
						Initiated by
					</Table.Head>
					<Table.Head
						class="px-4 py-2.5 text-[11px] font-medium tracking-wider text-muted-foreground uppercase"
					>
						Status
					</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each history as entry (entry.id)}
					<Table.Row class="border-b border-border/50 last:border-0">
						<Table.Cell class="px-4 py-2.5 font-mono text-xs text-muted-foreground">
							{entry.timestamp.toLocaleString()}
						</Table.Cell>
						<Table.Cell class="px-4 py-2.5 text-foreground">{entry.method}</Table.Cell>
						<Table.Cell class="px-4 py-2.5 font-mono text-xs text-foreground">
							{entry.identifier}
						</Table.Cell>
						<Table.Cell class="px-4 py-2.5 text-foreground">{entry.initiatedBy}</Table.Cell>
						<Table.Cell class="px-4 py-2.5">
							<KycStatusBadge status={entry.status} />
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
</div>
