<script lang="ts">
	import { merchantSession } from '$lib/stores/auth/session.svelte';
</script>

{#if merchantSession.hasBothServices()}
	<div class="space-y-6">
		<div>
			<h2 class="text-lg font-semibold">Dashboard</h2>
			<p class="text-sm text-muted-foreground">Collections & Disbursements overview</p>
		</div>

		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<div class="rounded-lg border border-border bg-card p-4">
				<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Collections</p>
				<p class="mt-1 text-2xl font-bold">—</p>
			</div>
			<div class="rounded-lg border border-border bg-card p-4">
				<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Settlements</p>
				<p class="mt-1 text-2xl font-bold">—</p>
			</div>
			<div class="rounded-lg border border-border bg-card p-4">
				<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
					Fund Transfers
				</p>
				<p class="mt-1 text-2xl font-bold">—</p>
			</div>
			<div class="rounded-lg border border-border bg-card p-4">
				<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
					Wallet Balance
				</p>
				<p class="mt-1 text-2xl font-bold">—</p>
			</div>
		</div>
	</div>
{:else if merchantSession.hasPayinAccess()}
	<div class="space-y-6">
		<div>
			<h2 class="text-lg font-semibold">Dashboard</h2>
			<p class="text-sm text-muted-foreground">Collections overview</p>
		</div>

		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			<div class="rounded-lg border border-border bg-card p-4">
				<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Collections</p>
				<p class="mt-1 text-2xl font-bold">—</p>
			</div>
			<div class="rounded-lg border border-border bg-card p-4">
				<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
					Transactions
				</p>
				<p class="mt-1 text-2xl font-bold">—</p>
			</div>
			<div class="rounded-lg border border-border bg-card p-4">
				<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Settlements</p>
				<p class="mt-1 text-2xl font-bold">—</p>
			</div>
		</div>
	</div>
{:else if merchantSession.hasPayoutAccess()}
	<div class="space-y-6">
		<div>
			<h2 class="text-lg font-semibold">Dashboard</h2>
			<p class="text-sm text-muted-foreground">Disbursements overview</p>
		</div>

		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			<div class="rounded-lg border border-border bg-card p-4">
				<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
					Fund Transfers
				</p>
				<p class="mt-1 text-2xl font-bold">—</p>
			</div>
			<div class="rounded-lg border border-border bg-card p-4">
				<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
					Wallet Balance
				</p>
				<p class="mt-1 text-2xl font-bold">—</p>
			</div>
			<div class="rounded-lg border border-border bg-card p-4">
				<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
					Beneficiaries
				</p>
				<p class="mt-1 text-2xl font-bold">—</p>
			</div>
		</div>
	</div>
{:else}
	<p class="text-sm text-muted-foreground">Loading...</p>
{/if}
