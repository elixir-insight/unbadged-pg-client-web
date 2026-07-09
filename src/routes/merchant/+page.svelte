<script lang="ts">
	import { merchantSession } from '$lib/stores/auth/session.svelte';
	import { StatCard, TransactionVolumeChart } from '$lib/components/reusable';
	import {
		TriangleAlert,
		ActivityIcon,
		ArrowDownToLine,
		ArrowUpFromLine,
		Undo,
		Download
	} from '$lib/assets/icons';

	const firstName = $derived(merchantSession.session?.merchantName?.split(' ')[0] ?? 'there');

	// Mock data — swap for real metrics once the dashboard API is wired up.
	const balanceTrend = [12, 14, 13, 15, 14, 16, 15, 17, 16, 18.4];

	const transactionVolume = [
		{ day: 'Mon', payin: 2100000, payout: 800000 },
		{ day: 'Tue', payin: 2500000, payout: 900000 },
		{ day: 'Wed', payin: 2300000, payout: 900000 },
		{ day: 'Thu', payin: 3000000, payout: 1000000 },
		{ day: 'Fri', payin: 3200000, payout: 1200000 },
		{ day: 'Sat', payin: 2900000, payout: 1000000 },
		{ day: 'Sun', payin: 3300000, payout: 1100000 }
	];

	const quickActions = [
		{ label: 'Create payment link', icon: ArrowDownToLine },
		{ label: 'Initiate payout', icon: ArrowUpFromLine },
		{ label: 'Issue refund', icon: Undo },
		{ label: 'Download report', icon: Download }
	];
</script>

<div class="space-y-6">
	<div>
		<h2 class="text-lg font-semibold">Welcome back, {firstName}</h2>
		<p class="text-sm text-muted-foreground">Here's what's happening with your account today.</p>
	</div>

	{#if merchantSession.hasBothServices()}
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<StatCard
				label="Available balance"
				value="₹18,42,650"
				badge={{ label: '4.2%', variant: 'success', trend: 'up' }}
				sparkline={balanceTrend}
			/>
			<StatCard
				label="PayIn · today"
				value="₹6,42,300"
				badge={{ label: '96.8%', variant: 'success' }}
				subtext="128 transactions · 4 failed"
			/>
			<StatCard
				label="Reserved"
				value="₹45,000"
				icon={TriangleAlert}
				iconVariant="muted"
				subtext="Rolling reserve"
			/>
			<StatCard
				label="Today's net volume"
				value="₹21,25,220"
				icon={ActivityIcon}
				iconVariant="success"
				// subtext="PayIn minus Payout"
				trend={{ direction: 'up', label: '+12.4% vs yesterday' }}
			/>
		</div>

		<div class="grid grid-cols-1 gap-4 lg:grid-cols-4">
			<TransactionVolumeChart data={transactionVolume} class="lg:col-span-3" />

			<div class="rounded-lg border border-border bg-background p-4 shadow-xs">
				<p class="text-sm font-semibold">Quick actions</p>
				<p class="text-xs text-muted-foreground">Jump into common tasks</p>

				<div class="mt-4 grid grid-cols-2 gap-3">
					{#each quickActions as action (action.label)}
						<button
							type="button"
							class="flex flex-col items-start gap-2 rounded-lg border border-border p-3 text-left transition-colors hover:bg-muted"
						>
							<span class="flex size-8 items-center justify-center rounded-lg bg-muted">
								<action.icon class="size-4" />
							</span>
							<span class="text-xs font-medium">{action.label}</span>
						</button>
					{/each}
				</div>
			</div>
		</div>
	{:else if merchantSession.hasPayinAccess()}
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			<StatCard
				label="Available balance"
				value="₹18,42,650"
				badge={{ label: '4.2%', variant: 'success', trend: 'up' }}
				sparkline={balanceTrend}
			/>
			<StatCard
				label="PayIn · today"
				value="₹6,42,300"
				badge={{ label: '96.8%', variant: 'success' }}
				subtext="128 transactions · 4 failed"
			/>
			<StatCard
				label="Needs attention"
				value="2"
				unit="disputes"
				badge={{ label: 'Action', variant: 'warning' }}
				subtext="6 refunds pending · ₹42,500"
			/>
		</div>
	{:else if merchantSession.hasPayoutAccess()}
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			<StatCard
				label="Wallet balance"
				value="₹18,42,650"
				badge={{ label: '4.2%', variant: 'success', trend: 'up' }}
				sparkline={balanceTrend}
			/>
			<StatCard
				label="Payout · today"
				value="₹3,18,900"
				badge={{ label: '99.1%', variant: 'success' }}
				subtext="47 transactions · 1 pending"
			/>
			<StatCard
				label="Needs attention"
				value="6"
				unit="refunds"
				badge={{ label: 'Action', variant: 'warning' }}
				subtext="₹42,500 pending payout"
			/>
		</div>
	{:else}
		<p class="text-sm text-muted-foreground">Loading...</p>
	{/if}
</div>
