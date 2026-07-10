<script lang="ts">
	import { merchantSession } from '$lib/stores/auth/session.svelte';
	import { StatCard } from '$lib/components/reusable';
	import {
		TransactionVolumeChart,
		PaymentMethodsCard,
		QuickActionsCard,
		SettlementsCard,
		RecentActivityCard,
		RefundsDisputesCard,
		type QuickAction,
		type RecentPayment,
		type PaymentMethodShare
	} from '$lib/components/merchant-dashboard';
	import { ArrowDownToLine, Undo } from '$lib/assets/icons';

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

	const paymentMethods: PaymentMethodShare[] = [
		{ method: 'UPI', percentage: 48, color: 'var(--color-chart-1)' },
		{ method: 'Card', percentage: 27, color: 'var(--color-chart-2)' },
		{ method: 'Netbanking', percentage: 15, color: 'var(--color-chart-3)' },
		{ method: 'Wallet', percentage: 10, color: 'var(--color-chart-4)' }
	];

	const quickActions: QuickAction[] = [
		{ label: 'Payment link', icon: ArrowDownToLine },
		{ label: 'Refund', icon: Undo }
	];

	const latestPayments: RecentPayment[] = [
		{ name: 'John Smith', amount: '₹12,500', status: 'success' },
		{ name: 'Emma Wilson', amount: '₹8,200', status: 'success' },
		{ name: 'Alex Brown', amount: '₹5,750', status: 'pending' },
		{ name: 'Sophia Lee', amount: '₹3,400', status: 'success' },
		{ name: 'David Miller', amount: '₹2,900', status: 'failed' }
	];
</script>

<div class="flex min-h-0 flex-1 flex-col">
	{#if merchantSession.hasBothServices()}
		<div class="grid h-full grid-rows-[minmax(88px,auto)_1fr_1fr] gap-4">
			<!-- Row 1 · KPI overview -->
			<div class="grid grid-cols-12 gap-4">
				<StatCard label="Available balance" value="₹18,42,650" class="col-span-3" />
				<StatCard
					label="Today's pay-ins"
					value="₹6,42,300"
					subtext="128 transactions"
					class="col-span-3"
				/>
				<StatCard
					label="Pending settlement"
					value="₹38,900"
					subtext="Settles tomorrow"
					class="col-span-3"
				/>
				<StatCard
					label="Success rate"
					value="98.6%"
					subtext="1,204 transactions"
					class="col-span-3"
				/>
			</div>

			<!-- Row 2 · Primary analytics -->
			<div class="grid min-h-0 grid-cols-12 gap-4">
				<TransactionVolumeChart data={transactionVolume} class="col-span-8" />
				<div class="col-span-4 grid min-h-0 grid-rows-2 gap-4">
					<QuickActionsCard actions={quickActions} />
					<SettlementsCard
						nextSettlementAmount="₹8,42,300"
						nextSettlementTime="Tomorrow • 9:30 AM"
						lastSettlementAmount="₹7,65,400"
						lastSettlementTime="Yesterday"
					/>
				</div>
			</div>

			<!-- Row 3 · Operational overview -->
			<div class="grid min-h-0 grid-cols-12 gap-4">
				<RefundsDisputesCard
					open={3}
					pending={4}
					resolved={5}
					attentionText="2 require immediate attention"
					class="col-span-4"
				/>
				<RecentActivityCard payments={latestPayments} class="col-span-4" />
				<PaymentMethodsCard methods={paymentMethods} class="col-span-4" />
			</div>
		</div>
	{:else if merchantSession.hasPayinAccess()}
		<div class="space-y-6">
			<div>
				<h2 class="text-lg font-semibold">Welcome back, {firstName}</h2>
				<p class="text-sm text-muted-foreground">
					Here's what's happening with your account today.
				</p>
			</div>

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
		</div>
	{:else if merchantSession.hasPayoutAccess()}
		<div class="space-y-6">
			<div>
				<h2 class="text-lg font-semibold">Welcome back, {firstName}</h2>
				<p class="text-sm text-muted-foreground">
					Here's what's happening with your account today.
				</p>
			</div>

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
		</div>
	{:else}
		<p class="text-sm text-muted-foreground">Loading...</p>
	{/if}
</div>
