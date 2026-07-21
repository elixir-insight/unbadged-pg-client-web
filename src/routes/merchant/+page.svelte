<script lang="ts">
	import { merchantSession } from '$lib/stores/auth/session.svelte';
	import { StatCard, Avatar } from '$lib/components/reusable';
	import {
		TransactionVolumeChart,
		RefundInsightsCard,
		SettlementsCard,
		RecentActivityCard,
		// RefundsDisputesCard,
		type RecentPayment
	} from '$lib/components/merchant-dashboard';
	import { Undo, ArrowDownToLine, Landmark, Wallet } from '$lib/assets/icons';

	const merchantName = $derived(merchantSession.session?.merchantName ?? 'there');

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

	const refundStats = { completed: 18, initiated: 5, failed: 2 };

	const latestPayments: RecentPayment[] = [
		{
			name: 'John Smith',
			method: 'UPI',
			time: 'Today, 11:42 AM',
			amount: '₹12,500',
			status: 'success'
		},
		{
			name: 'Emma Wilson',
			method: 'Card',
			time: 'Today, 10:05 AM',
			amount: '₹8,200',
			status: 'success'
		},
		{
			name: 'Alex Brown',
			method: 'Bank transfer',
			time: 'Today, 9:20 AM',
			amount: '₹5,750',
			status: 'pending'
		},
		{ name: 'Sophia Lee', method: 'UPI', time: 'Yesterday', amount: '₹3,400', status: 'success' },
		{ name: 'David Miller', method: 'Card', time: 'Yesterday', amount: '₹2,900', status: 'failed' }
	];
</script>

<div class="flex flex-col lg:min-h-0 lg:flex-1">
	{#if merchantSession.hasBothServices()}
		<div class="flex flex-col gap-3 lg:min-h-0 lg:flex-1">
			<div class="flex shrink-0 items-center justify-between">
				<h2 class="text-base leading-tight font-semibold">Welcome back, {merchantName}</h2>
			</div>

			<div
				class="grid gap-3 lg:min-h-0 lg:flex-1 lg:grid-rows-[91px_minmax(220px,1.3fr)_minmax(170px,1fr)]"
			>
				<!-- Row 1 · KPI overview -->
				<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
					<StatCard
						label="Today's collection"
						value="₹6,42,300"
						subtext="128 transactions"
						icon={ArrowDownToLine}
						class="h-full "
					/>
					<StatCard
						label="Available funds"
						value="₹18,42,650"
						badge={{ label: '4.2%', variant: 'success', trend: 'up' }}
						subtext="Last settled ₹7,65,400"
						icon={Wallet}
						class="h-full"
					/>
					<StatCard
						label="Pending Settlements"
						value="₹38,900"
						subtext="Settles tomorrow"
						icon={Landmark}
						class="h-full"
					/>
					<StatCard
						label="Refunds"
						value="25"
						subtext="5 initiated · 2 failed"
						icon={Undo}
						class="h-full"
					/>
				</div>

				<!-- Row 2 · Primary analytics · Transaction volume matches Disputes + Settlement combined width -->
				<div class="grid min-h-0 grid-cols-12 gap-3">
					<TransactionVolumeChart
						data={transactionVolume}
						class="col-span-12 h-full min-h-0 lg:col-span-8"
					/>
					<RecentActivityCard
						payments={latestPayments}
						class="col-span-12 h-full min-h-0 lg:col-span-4"
					/>
				</div>

				<!-- Row 3 · Operational overview -->
				<div class="grid min-h-0 grid-cols-12 gap-3">
					<SettlementsCard
						availableFunds="₹18,42,650"
						availableFundsChangeLabel="+4.2%"
						pendingSettlement="₹38,900"
						lastSettlementAmount="₹7,65,400"
						class="col-span-12 h-full min-h-0 md:col-span-6"
					/>
					<RefundInsightsCard
						completed={refundStats.completed}
						initiated={refundStats.initiated}
						failed={refundStats.failed}
						class="col-span-12 h-full min-h-0 md:col-span-6"
					/>
					<!-- Dispute overview is temporarily hidden.
					<RefundsDisputesCard
						open={3}
						pending={4}
						resolved={5}
						avgResolutionTime="1.8 days"
						class="col-span-12 h-full min-h-0 md:col-span-12 lg:col-span-4"
					/>
					-->
				</div>
			</div>
		</div>
	{:else if merchantSession.hasPayinAccess()}
		<div class="space-y-6">
			<div class="flex items-center justify-between">
				<h2 class="text-lg font-semibold">Welcome back, {merchantName}</h2>
				<div class="flex items-center gap-2">
					<Avatar name={merchantName} size="sm" />
				</div>
			</div>

			<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
		</div>
	{:else if merchantSession.hasPayoutAccess()}
		<div class="space-y-6">
			<div class="flex items-center justify-between">
				<h2 class="text-lg font-semibold">Welcome back, {merchantName}</h2>
				<div class="flex items-center gap-2">
					<Avatar name={merchantName} size="sm" />
				</div>
			</div>

			<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
		</div>
	{:else}
		<p class="text-sm text-muted-foreground">Loading...</p>
	{/if}
</div>
