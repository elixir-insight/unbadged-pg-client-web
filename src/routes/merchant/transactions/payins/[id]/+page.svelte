<script lang="ts">
	import { page } from '$app/state';
	import { Chip } from '$lib/components/ui/badge';
	import type { BadgeVariant } from '$lib/components/ui/badge/badge.svelte';
	import { Button } from '$lib/components/ui/button';
	import { ArrowDown, Undo } from '$lib/assets/icons';
	import { cn } from '$lib/utils';
	import Timeline, { type TimelineEntry } from './timeline.svelte';
	import Details, { type DetailSection } from './details.svelte';
	import RefundModal from './refund-modal.svelte';
	import { toast } from '$lib/components/reusable';
	import { userPermissions } from '$lib/stores/rbac';
	import { settlements as mockSettlements } from '$lib/data/settlement-mock';

	type TransactionStatus = 'success' | 'pending' | 'failed';

	interface Transaction {
		txnId: string;
		customerName: string;
		customerEmail: string;
		customerPhoneNumber: string;
		transactionAmount: string;
		paymentMethod: string;
		paymentMode: string;
		paymentChannel: string;
		transactionStatus: TransactionStatus;
		statusDescription: string;
		clientDescription: string;
		date: string;
		expiresAt: string;
		processingFee: string;
		gatewayFee: string;
		gatewayGst: string;
		commissionId: string;
		refundableAmount: string;
		orgId: string;
		partnerFee: string;
		partnerGst: string;
		vaIdentifier: string;
		affiliateId: string;
		crn: string;
		payerVpa: string;
		payeeVpa: string;
		orderId: string;
		virtualAccountNumber: string;
		bankPipelineCode: string;
		accountNumber: string;
		ifsc: string;
		transactionTimeline: TimelineEntry[];
	}

	const mockTransactions: Record<string, Transaction> = {
		'TXN-1001': {
			txnId: 'TXN-1001',
			customerName: 'Arjun Mehta',
			customerEmail: 'arjun.mehta@example.com',
			customerPhoneNumber: '+91 98765 43210',
			transactionAmount: '₹4,500.00',
			paymentMethod: 'UPI',
			paymentMode: 'ONLINE',
			paymentChannel: 'UPI_COLLECT',
			transactionStatus: 'success',
			statusDescription: 'Payment received successfully',
			clientDescription: 'Order payment for INV-2024-001',
			date: '2026-06-27',
			expiresAt: '2026-06-28',
			processingFee: '₹45.00',
			gatewayFee: '₹22.50',
			gatewayGst: '₹4.05',
			commissionId: 'COMM-001',
			refundableAmount: '₹4,428.45',
			orgId: 'ORG-001',
			partnerFee: '₹10.00',
			partnerGst: '₹1.80',
			vaIdentifier: 'VA-001',
			affiliateId: 'AFF-001',
			crn: 'CRN2026062700001',
			payerVpa: 'arjun@okaxis',
			payeeVpa: 'merchant@okhdfc',
			orderId: 'ORD-2026-001',
			virtualAccountNumber: '1234567890',
			bankPipelineCode: 'AXIS',
			accountNumber: 'XXXX1234',
			ifsc: 'AXIS0001234',
			transactionTimeline: [
				{
					entryTitle: 'You created the payment link',
					entryType: 'payment_created',
					entryDescription: 'Order created and sent to customer for payment.',
					txnAmount: '₹4,500.00',
					refundAmount: '',
					transactionStatus: 'pending',
					paymentMethod: 'UPI',
					paymentChannel: 'UPI_COLLECT',
					crn: 'CRN2026062700001',
					utr: '',
					bankRRN: '',
					cardNumber: '',
					cardType: '',
					transactionMessage: '',
					errorDescription: '',
					refundId: '',
					refundSpeed: '',
					refundMode: '',
					refundType: '',
					remark: '',
					timestamp: 'Friday, 27 June at 14:30',
					isCompleted: true
				},
				{
					entryTitle: 'Arjun authorised the payment',
					entryType: 'payment_authorized',
					entryDescription: 'Customer approved the request in their UPI app.',
					txnAmount: '₹4,500.00',
					refundAmount: '',
					transactionStatus: 'authorized',
					paymentMethod: 'UPI',
					paymentChannel: 'UPI_COLLECT',
					crn: 'CRN2026062700001',
					utr: '',
					bankRRN: '',
					cardNumber: '',
					cardType: '',
					transactionMessage: '',
					errorDescription: '',
					refundId: '',
					refundSpeed: '',
					refundMode: '',
					refundType: '',
					remark: '',
					timestamp: 'Friday, 27 June at 14:30',
					isCompleted: true
				},
				{
					entryTitle: "Payment's complete",
					entryType: 'payment_completed',
					entryDescription: 'We received ₹4,500.00 from Arjun Mehta.',
					txnAmount: '₹4,500.00',
					refundAmount: '',
					transactionStatus: 'success',
					paymentMethod: 'UPI',
					paymentChannel: 'UPI_COLLECT',
					crn: 'CRN2026062700001',
					utr: 'AXISC2706270001',
					bankRRN: '442109887651',
					cardNumber: '',
					cardType: '',
					transactionMessage: 'Payment successful',
					errorDescription: '',
					refundId: '',
					refundSpeed: '',
					refundMode: '',
					refundType: '',
					remark: '',
					timestamp: 'Friday, 27 June at 14:32',
					isCompleted: true
				}
			]
		},
		'TXN-1002': {
			txnId: 'TXN-1002',
			customerName: 'Priya Sharma',
			customerEmail: 'priya.sharma@example.com',
			customerPhoneNumber: '+91 87654 32109',
			transactionAmount: '₹12,000.00',
			paymentMethod: 'Net Banking',
			paymentMode: 'ONLINE',
			paymentChannel: 'NETBANKING',
			transactionStatus: 'pending',
			statusDescription: 'Awaiting bank confirmation',
			clientDescription: 'Subscription renewal payment',
			date: '2026-06-26',
			expiresAt: '2026-06-27',
			processingFee: '₹120.00',
			gatewayFee: '₹60.00',
			gatewayGst: '₹10.80',
			commissionId: 'COMM-002',
			refundableAmount: '₹11,809.20',
			orgId: 'ORG-001',
			partnerFee: '₹25.00',
			partnerGst: '₹4.50',
			vaIdentifier: 'VA-002',
			affiliateId: 'AFF-001',
			crn: 'CRN2026062600002',
			payerVpa: '',
			payeeVpa: '',
			orderId: 'ORD-2026-002',
			virtualAccountNumber: '9876543210',
			bankPipelineCode: 'HDFC',
			accountNumber: 'XXXX5678',
			ifsc: 'HDFC0001234',
			transactionTimeline: [
				{
					entryTitle: 'You created the payment link',
					entryType: 'payment_created',
					entryDescription: 'Order created and sent to customer for payment.',
					txnAmount: '₹12,000.00',
					refundAmount: '',
					transactionStatus: 'pending',
					paymentMethod: 'Net Banking',
					paymentChannel: 'NETBANKING',
					crn: 'CRN2026062600002',
					utr: '',
					bankRRN: '',
					cardNumber: '',
					cardType: '',
					transactionMessage: '',
					errorDescription: '',
					refundId: '',
					refundSpeed: '',
					refundMode: '',
					refundType: '',
					remark: '',
					timestamp: 'Thursday, 26 June at 10:15',
					isCompleted: true
				},
				{
					entryTitle: 'Priya initiated payment',
					entryType: 'payment_initiated',
					entryDescription: 'Customer started payment via HDFC Net Banking.',
					txnAmount: '₹12,000.00',
					refundAmount: '',
					transactionStatus: 'pending',
					paymentMethod: 'Net Banking',
					paymentChannel: 'NETBANKING',
					crn: 'CRN2026062600002',
					utr: '',
					bankRRN: '',
					cardNumber: '',
					cardType: '',
					transactionMessage: '',
					errorDescription: '',
					refundId: '',
					refundSpeed: '',
					refundMode: '',
					refundType: '',
					remark: '',
					timestamp: 'Thursday, 26 June at 10:18',
					isCompleted: false
				}
			]
		},
		'TXN-1003': {
			txnId: 'TXN-1003',
			customerName: 'Vikram Nair',
			customerEmail: 'vikram.nair@example.com',
			customerPhoneNumber: '+91 76543 21098',
			transactionAmount: '₹2,750.00',
			paymentMethod: 'Credit Card',
			paymentMode: 'ONLINE',
			paymentChannel: 'CARD',
			transactionStatus: 'failed',
			statusDescription: 'Insufficient funds',
			clientDescription: 'Product purchase',
			date: '2026-06-25',
			expiresAt: '2026-06-26',
			processingFee: '₹0.00',
			gatewayFee: '₹0.00',
			gatewayGst: '₹0.00',
			commissionId: 'COMM-003',
			refundableAmount: '₹0.00',
			orgId: 'ORG-001',
			partnerFee: '₹0.00',
			partnerGst: '₹0.00',
			vaIdentifier: 'VA-003',
			affiliateId: '',
			crn: 'CRN2026062500003',
			payerVpa: '',
			payeeVpa: '',
			orderId: 'ORD-2026-003',
			virtualAccountNumber: '',
			bankPipelineCode: 'ICICI',
			accountNumber: '',
			ifsc: '',
			transactionTimeline: [
				{
					entryTitle: 'You created the payment link',
					entryType: 'payment_created',
					entryDescription: 'Order created and sent to customer for payment.',
					txnAmount: '₹2,750.00',
					refundAmount: '',
					transactionStatus: 'pending',
					paymentMethod: 'Credit Card',
					paymentChannel: 'CARD',
					crn: 'CRN2026062500003',
					utr: '',
					bankRRN: '',
					cardNumber: '',
					cardType: '',
					transactionMessage: '',
					errorDescription: '',
					refundId: '',
					refundSpeed: '',
					refundMode: '',
					refundType: '',
					remark: '',
					timestamp: 'Wednesday, 25 June at 09:00',
					isCompleted: true
				},
				{
					entryTitle: 'Vikram attempted payment',
					entryType: 'payment_attempted',
					entryDescription: 'Customer attempted payment with Visa credit card.',
					txnAmount: '₹2,750.00',
					refundAmount: '',
					transactionStatus: 'failed',
					paymentMethod: 'Credit Card',
					paymentChannel: 'CARD',
					crn: 'CRN2026062500003',
					utr: '',
					bankRRN: 'ICICI2062500001',
					cardNumber: 'XXXX XXXX XXXX 4242',
					cardType: 'VISA',
					transactionMessage: 'Transaction declined',
					errorDescription: 'Insufficient funds in account',
					refundId: '',
					refundSpeed: '',
					refundMode: '',
					refundType: '',
					remark: '',
					timestamp: 'Wednesday, 25 June at 09:03',
					isCompleted: true
				},
				{
					entryTitle: 'Payment failed',
					entryType: 'payment_failed',
					entryDescription: "Transaction declined by Vikram's bank.",
					txnAmount: '₹2,750.00',
					refundAmount: '',
					transactionStatus: 'failed',
					paymentMethod: 'Credit Card',
					paymentChannel: 'CARD',
					crn: 'CRN2026062500003',
					utr: '',
					bankRRN: 'ICICI2062500001',
					cardNumber: 'XXXX XXXX XXXX 4242',
					cardType: 'VISA',
					transactionMessage: 'Transaction declined',
					errorDescription: 'Insufficient funds in account',
					refundId: '',
					refundSpeed: '',
					refundMode: '',
					refundType: '',
					remark: '',
					timestamp: 'Wednesday, 25 June at 09:03',
					isCompleted: true
				}
			]
		}
	};

	// ── Settlement orders (ORD-*) linked in from the settlements flow — same
	// mock source as $lib/data/settlement-mock, so clicking an order row there
	// resolves to a real transaction here instead of "not found".
	const settlementOrderPaymentMethods = [
		{ method: 'UPI', channel: 'UPI_COLLECT' },
		{ method: 'Credit Card', channel: 'CARD' },
		{ method: 'Net Banking', channel: 'NETBANKING' }
	];

	const settlementOrderCustomers = [
		{ name: 'Arjun Mehta', email: 'arjun.mehta@example.com', phone: '+91 98765 43210' },
		{ name: 'Priya Sharma', email: 'priya.sharma@example.com', phone: '+91 87654 32109' },
		{ name: 'Vikram Nair', email: 'vikram.nair@example.com', phone: '+91 76543 21098' }
	];

	function formatInr(amount: number): string {
		return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	}

	let settlementOrderIndex = 0;
	for (const settlement of mockSettlements) {
		for (const order of settlement.orders) {
			const methodInfo =
				settlementOrderPaymentMethods[settlementOrderIndex % settlementOrderPaymentMethods.length];
			const customer =
				settlementOrderCustomers[settlementOrderIndex % settlementOrderCustomers.length];
			settlementOrderIndex++;

			const isUpi = methodInfo.channel === 'UPI_COLLECT';
			const dateStr =
				settlement.settledOn ?? settlement.expectedOn ?? new Date().toISOString().slice(0, 10);
			const crn = `CRN${order.id.replace(/\D/g, '')}`;
			const bankRrn = `RRN${order.id.replace(/\D/g, '').slice(-12).padStart(12, '0')}`;
			const bankCode = settlement.settledTo.bankName.split(' ')[0].toUpperCase();

			mockTransactions[order.id] = {
				txnId: order.id,
				customerName: customer.name,
				customerEmail: customer.email,
				customerPhoneNumber: customer.phone,
				transactionAmount: formatInr(order.amount),
				paymentMethod: methodInfo.method,
				paymentMode: 'ONLINE',
				paymentChannel: methodInfo.channel,
				transactionStatus: 'success',
				statusDescription: 'Payment received successfully',
				clientDescription: order.description,
				date: dateStr,
				expiresAt: dateStr,
				processingFee: formatInr(order.feeBreakdown.processingFee),
				gatewayFee: '₹0.00',
				gatewayGst: formatInr(order.feeBreakdown.gst),
				commissionId: `COMM-${order.id}`,
				refundableAmount: formatInr(order.netAmount),
				orgId: 'ORG-001',
				partnerFee: '₹0.00',
				partnerGst: '₹0.00',
				vaIdentifier: `VA-${order.id}`,
				affiliateId: 'AFF-001',
				crn,
				payerVpa: isUpi ? customer.email.replace('@example.com', '@okaxis') : '',
				payeeVpa: isUpi ? 'merchant@okhdfc' : '',
				orderId: order.id,
				virtualAccountNumber: order.id.replace(/\D/g, '').slice(-10),
				bankPipelineCode: bankCode,
				accountNumber: `XXXX${settlement.settledTo.accountLast4}`,
				ifsc: `${bankCode}0001234`,
				transactionTimeline: [
					{
						entryTitle: 'You created the payment link',
						entryType: 'payment_created',
						entryDescription: 'Order created and sent to customer for payment.',
						txnAmount: formatInr(order.amount),
						refundAmount: '',
						transactionStatus: 'pending',
						paymentMethod: methodInfo.method,
						paymentChannel: methodInfo.channel,
						crn,
						utr: '',
						bankRRN: '',
						cardNumber: '',
						cardType: '',
						transactionMessage: '',
						errorDescription: '',
						refundId: '',
						refundSpeed: '',
						refundMode: '',
						refundType: '',
						remark: '',
						timestamp: dateStr,
						isCompleted: true
					},
					{
						entryTitle: "Payment's complete",
						entryType: 'payment_completed',
						entryDescription: `We received ${formatInr(order.amount)} from ${customer.name}.`,
						txnAmount: formatInr(order.amount),
						refundAmount: '',
						transactionStatus: 'success',
						paymentMethod: methodInfo.method,
						paymentChannel: methodInfo.channel,
						crn,
						utr: settlement.utr ?? '',
						bankRRN: bankRrn,
						cardNumber: '',
						cardType: '',
						transactionMessage: 'Payment successful',
						errorDescription: '',
						refundId: '',
						refundSpeed: '',
						refundMode: '',
						refundType: '',
						remark: '',
						timestamp: dateStr,
						isCompleted: true
					}
				]
			};
		}
	}

	function getTransaction(id: string): Transaction | null {
		return mockTransactions[id] ?? null;
	}

	const txnId = $derived(page.params.id ?? '');
	const transaction = $derived(getTransaction(txnId));

	let activeTab = $state<'updates' | 'details'>('updates');

	const statusBadgeVariant = $derived<BadgeVariant>(
		transaction?.transactionStatus === 'success'
			? 'success'
			: transaction?.transactionStatus === 'failed'
				? 'error'
				: 'warning'
	);

	const statusLabel = $derived(
		transaction?.transactionStatus === 'success'
			? 'Success'
			: transaction?.transactionStatus === 'failed'
				? 'Failed'
				: 'Pending'
	);

	function parseFee(s: string): number {
		return parseFloat(s.replace(/[₹,]/g, '')) || 0;
	}

	function neg(s: string): string {
		return `−${s}`;
	}

	function formatMethodChannel(method: string, channel: string): string {
		const mode = channel.split('_').pop() ?? channel;
		return `${method} · ${mode.charAt(0).toUpperCase() + mode.slice(1).toLowerCase()}`;
	}
	function formatFee(value: number): string {
		return `₹${value.toFixed(2)}`;
	}

	let refundModalOpen = $state(false);

	async function handleRefund(amount: string, remarks: string) {
		await new Promise((r) => setTimeout(r, 1000));
		toast.success(`Refund of ₹${parseFloat(amount).toFixed(2)} initiated successfully`, {
			description: `Remarks: ${remarks}`
		});
	}

	const detailSections = $derived<DetailSection[]>(
		transaction
			? [
					{
						title: 'Order & Customer',
						rows: [
							{ label: 'Order ID', value: transaction.orderId, copyable: true, mono: true },
							{ label: 'CRN', value: transaction.crn, copyable: true, mono: true },
							{ label: 'Name', value: transaction.customerName, bold: true },
							{ label: 'Email', value: transaction.customerEmail, mono: true },
							{ label: 'Phone', value: transaction.customerPhoneNumber, mono: true }
						]
					},
					{
						title: 'Payment & Bank',
						rows: [
							{
								label: 'Payment method',
								value: formatMethodChannel(transaction.paymentMethod, transaction.paymentChannel)
							},
							{ label: 'Payer VPA', value: transaction.payerVpa || '—', mono: true },
							{ label: 'Bank pipeline', value: transaction.bankPipelineCode, mono: true }
						]
					},
					{
						title: 'Fees & Settlement',
						rows: [
							{ label: 'Transaction amount', value: transaction.transactionAmount },
							{
								label: 'Processing fee',
								value: neg(
									formatFee(
										parseFee(transaction.processingFee) +
											parseFee(transaction.gatewayFee) +
											parseFee(transaction.gatewayGst) +
											parseFee(transaction.partnerFee) +
											parseFee(transaction.partnerGst)
									)
								),
								variant: 'negative'
							},
							{
								label: 'Net settlement',
								value: transaction.refundableAmount,
								variant: 'positive',
								bold: true
							}
						]
					}
				]
			: []
	);
</script>

<div class="flex flex-col gap-4">
	<!-- Page header -->
	<div class="flex items-center justify-between gap-3">
		<!-- <button
			type="button"
			onclick={() => goto(resolve('/merchant/transactions/payins'))}
			class="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
			aria-label="Back to Pay-ins"
		>
			<ArrowLeft class="size-4" />
		</button> -->
		<h1 class="text-lg font-semibold text-foreground">Transaction Details</h1>
		{#if userPermissions.can('PAYINS', 'write')}
			<Button
				onclick={() => (refundModalOpen = true)}
				disabled={transaction?.transactionStatus !== 'success'}
			>
				<Undo class="size-4" />
				Initiate refund
			</Button>
		{/if}
	</div>

	{#if !transaction}
		<div
			class="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-background p-16 text-center shadow-sm"
		>
			<p class="text-sm font-medium text-foreground">Transaction not found</p>
			<p class="text-xs text-muted-foreground">No record found for ID: {txnId}</p>
		</div>
	{:else}
		<div class="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
			<!-- Header -->
			<div
				class="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:px-6 sm:py-5"
			>
				<div class="flex items-center gap-3">
					<div
						class="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground sm:size-11"
					>
						<ArrowDown class="size-5" />
					</div>
					<div>
						<p class="text-base font-semibold text-foreground">{transaction.customerName}</p>
						<p class="text-sm text-muted-foreground">Received</p>
					</div>
				</div>
				<div class="sm:text-right">
					<p class="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
						{transaction.transactionAmount}
					</p>
					<!-- <p class="text-sm text-muted-foreground">
						{transaction.paymentMethod} · {transaction.date}
					</p> -->
					<Chip variant={statusBadgeVariant}>
						{statusLabel}
					</Chip>
				</div>
			</div>

			<div class="border-t border-border"></div>

			<!-- Tab bar -->
			<div class="flex items-center justify-between gap-2 px-4 sm:px-6">
				<div class="flex">
					<button
						type="button"
						onclick={() => (activeTab = 'updates')}
						class={cn(
							'-mb-px px-1 pt-3.5 pb-3 text-sm font-medium transition-colors',
							activeTab === 'updates'
								? 'border-b-2 border-primary text-primary'
								: 'text-muted-foreground hover:text-foreground'
						)}
					>
						Updates
					</button>
					<button
						type="button"
						onclick={() => (activeTab = 'details')}
						class={cn(
							'-mb-px ml-4 px-1 pt-3.5 pb-3 text-sm font-medium transition-colors',
							activeTab === 'details'
								? 'border-b-2 border-primary text-primary'
								: 'text-muted-foreground hover:text-foreground'
						)}
					>
						Details
					</button>
				</div>
				<div class="flex items-center"></div>
			</div>

			<div class="border-t border-border"></div>

			<!-- Tab content -->
			<div class="px-4 py-5 sm:px-6">
				{#if activeTab === 'updates'}
					<Timeline entries={transaction.transactionTimeline} />
				{:else}
					<Details sections={detailSections} />
				{/if}
			</div>

			<!-- <div class="border-t border-border"></div> -->

			<!-- Footer actions -->
			<!-- <div class="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-6 sm:py-4">
			
			</div> -->
		</div>
	{/if}
</div>

{#if transaction}
	<RefundModal
		bind:open={refundModalOpen}
		refundableAmount={transaction.refundableAmount}
		customerName={transaction.customerName}
		onconfirm={handleRefund}
	/>
{/if}
