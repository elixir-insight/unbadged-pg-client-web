<script lang="ts">
	import { merchantSession } from '$lib/stores/auth/session.svelte';
</script>

{#if merchantSession.hasBothServices()}
	<div class="space-y-6">
		<div>
			<h2 class="text-lg font-semibold">Dashboard</h2>
			<p class="text-sm text-muted-foreground">Payin & Payout overview</p>
		</div>

		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<div class="rounded-lg border border-border bg-card p-4">
				<p class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Collections</p>
				<p class="mt-1 text-2xl font-bold">—</p>
			</div>
			<div class="rounded-lg border border-border bg-card p-4">
				<p class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Settlements</p>
				<p class="mt-1 text-2xl font-bold">—</p>
			</div>
			<div class="rounded-lg border border-border bg-card p-4">
				<p class="text-xs font-medium text-muted-foreground uppercase tracking-wide">
					Fund Transfers
				</p>
				<p class="mt-1 text-2xl font-bold">—</p>
			</div>
			<div class="rounded-lg border border-border bg-card p-4">
				<p class="text-xs font-medium text-muted-foreground uppercase tracking-wide">
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
			<p class="text-sm text-muted-foreground">Payin overview</p>
		</div>

		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			<div class="rounded-lg border border-border bg-card p-4">
				<p class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Collections</p>
				<p class="mt-1 text-2xl font-bold">—</p>
			</div>
			<div class="rounded-lg border border-border bg-card p-4">
				<p class="text-xs font-medium text-muted-foreground uppercase tracking-wide">
					Transactions
				</p>
				<p class="mt-1 text-2xl font-bold">—</p>
			</div>
			<div class="rounded-lg border border-border bg-card p-4">
				<p class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Settlements</p>
				<p class="mt-1 text-2xl font-bold">—</p>
			</div>
		</div>
	</div>
{:else if merchantSession.hasPayoutAccess()}
	<div class="space-y-6">
		<div>
			<h2 class="text-lg font-semibold">Dashboard</h2>
			<p class="text-sm text-muted-foreground">Payout overview</p>
		</div>

		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			<div class="rounded-lg border border-border bg-card p-4">
				<p class="text-xs font-medium text-muted-foreground uppercase tracking-wide">
					Fund Transfers
				</p>
				<p class="mt-1 text-2xl font-bold">—</p>
			</div>
			<div class="rounded-lg border border-border bg-card p-4">
				<p class="text-xs font-medium text-muted-foreground uppercase tracking-wide">
					Wallet Balance
				</p>
				<p class="mt-1 text-2xl font-bold">—</p>
			</div>
			<div class="rounded-lg border border-border bg-card p-4">
				<p class="text-xs font-medium text-muted-foreground uppercase tracking-wide">
					Beneficiaries
				</p>
				<p class="mt-1 text-2xl font-bold">—</p>
			</div>
		</div>
	</div>
{:else}
	<p class="text-sm text-muted-foreground">Loading...</p>
{/if}
