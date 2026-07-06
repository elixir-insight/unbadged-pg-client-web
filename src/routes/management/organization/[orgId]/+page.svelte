<script lang="ts">
	import { page } from '$app/state';
	import { organizations } from '$lib/data/mockData';
	import { Avatar, Chip, Dropdown } from '$lib/components/reusable';
	import type { BadgeVariant } from '$lib/components/ui/badge';
	import { MailIcon, PhoneIcon } from '$lib/assets/icons';
	import { cn } from '$lib/utils';
	import { fade, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { toast } from 'svelte-sonner';
	import { breadcrumb } from '$lib/stores/breadcrumb.svelte';
	import { formatStatusLabel } from '$lib/utils/status_rename';

	import type { TabKey, TabItem, OrgDetail, BankingDetail, IntegrationDetail } from './types';
	import {
		KybTab,
		AccountsTab,
		DocumentsTab,
		ApplicationIntegrationTab,
		ConfigurationTab
	} from './components/index';

	let banks = $state<BankingDetail[]>([
		{
			id: 'bank-1',
			accountHolder: 'Northwind Capital',
			accountNumber: '•••• •••• 4421',
			bank: 'Pinnacle Trust',
			branch: 'San Francisco Downtown',
			routingIFSC: 'PINTUS33',
			status: 'ACTIVE',
			isPrimary: true
		},
		{
			id: 'bank-2',
			accountHolder: 'Northwind Capital LLC',
			accountNumber: '•••• •••• 8810',
			bank: 'Silicon Valley Bank',
			branch: 'Palo Alto',
			routingIFSC: 'SVBKUS6S',
			status: 'ON_HOLD',
			isPrimary: false
		}
	]);

	// ── Data ─────────────────────────────────────────────────────────────────────

	const org = $derived(organizations.find((o) => o.id === page.params.orgId));

	const detail: OrgDetail = {
		email: 'ops@northwindcapital.com',
		phone: '+1 415 555 0100',
		country: 'United States',
		lastUpdated: '2026-04-30',
		kyb: {
			companyName: 'Cochran Riddle Plc',
			country: 'India',
			state: 'Maharashtra',
			city: 'Mumbai',
			pincode: '400021',
			companyGstNumber: '27AADFC7890K1ZM',
			cinNumber: 'U65990MH2012PTC234567',
			tanNumber: 'MUMR45678B',
			companyPhoneNumber: '9823456701',
			companyUrl: 'https://www.cochranriddle.com',
			businessPan: 'AADFC7890K',
			registeredYear: '2012',
			industry: 'Legal & Consulting Services',
			companyLogo: null,
			address: '15, Nariman Point, Tower B',
			directors: [
				{
					name: 'Priya Cochran',
					aadhaar: '345678901234',
					pan: 'DRTPC4567F',
					email: 'priya.cochran@cochranriddle.com',
					phone: '9823456702'
				}
			]
		},
		contact: {
			name: 'Sarah Chen',
			role: 'Compliance Admin',
			email: 'ops@northwindcapital.com',
			phone: '+1 415 555 0100',
			timezone: 'America/Los_Angeles (UTC-7)'
		},
		banks,
		onboarding: [
			{ label: 'KYB completed', done: true },
			{ label: 'Banking verified', done: true },
			{ label: 'Documents uploaded', done: true },
			{ label: 'Compliance reviewed', done: false }
		],
		documents: [
			{
				name: 'Certificate of Incorporation.pdf',
				type: 'Incorporation',
				uploadedDate: '12 May 2026',
				status: 'Approved'
			},
			{
				name: 'Tax Registration.pdf',
				type: 'Tax',
				uploadedDate: '12 May 2026',
				status: 'Approved'
			},
			{
				name: 'Director ID.png',
				type: 'ID Proof',
				uploadedDate: '13 May 2026',
				status: 'In Review'
			},
			{
				name: 'Bank Statement.pdf',
				type: 'Bank Proof',
				uploadedDate: '14 May 2026',
				status: 'Approved'
			}
		]
	};

	// ── Tab config ────────────────────────────────────────────────────────────────

	const allTabs: TabItem[] = [
		{ key: 'kyb', label: 'KYB Details' },
		{ key: 'account', label: 'Bank Accounts' },
		{ key: 'documents', label: 'Documents' },
		{ key: 'integration', label: 'Application Integration' },
		{ key: 'configuration', label: 'Configuration' }
	];

	const tabs = $derived(
		org?.profileType === 'PARTNER' ? allTabs.filter((t) => t.key !== 'configuration') : allTabs
	);

	let activeTab = $state<TabKey>('kyb');

	let integration = $state<IntegrationDetail>({
		callbackUrl: 'https://api.northwindcapital.com/webhooks/payments',
		ipAddress: '203.0.113.10'
	});

	// ── Derived flags ─────────────────────────────────────────────────────────────

	function normalizeStatus(status: string): string {
		return status.toUpperCase().replace(/\s+/g, '_');
	}

	let orgStatusOverride = $state<string | null>(null);
	const effectiveStatus = $derived(orgStatusOverride ?? org?.status ?? '');

	const isPartner = $derived(org?.profileType === 'PARTNER');
	const isApproved = $derived(normalizeStatus(effectiveStatus) === 'APPROVED');
	const isActive = $derived(normalizeStatus(effectiveStatus) === 'ACTIVE');
	const showActivateProfile = $derived(isPartner && isApproved);

	let agreementFile = $state<File | null>(null);
	const agreementUploaded = $derived(agreementFile !== null);
	const configTabLocked = $derived(!isPartner && isApproved && !agreementUploaded);

	let statusChangeSelection = $state<string | undefined>(undefined);

	const statusChangeOptions = [
		{ value: 'ON_HOLD', label: formatStatusLabel('ON_HOLD') },
		{ value: 'FROZEN', label: formatStatusLabel('FROZEN') }
	];

	const documentDirectors = $derived(
		detail.kyb.directors.map((director, index) => ({
			id: index + 1,
			name: director.name,
			aadhaar: director.aadhaar,
			pan: director.pan,
			email: director.email,
			phone: director.phone
		}))
	);

	function handleOpenConfiguration() {
		activeTab = 'configuration';
	}

	// ── Breadcrumb ────────────────────────────────────────────────────────────────

	$effect(() => {
		if (org) {
			breadcrumb.set([
				{ label: 'Organizations', href: '/management/organization' },
				{ label: org.name, href: `/management/organization/${org.id}` }
			]);
		}
		return () => breadcrumb.clear();
	});

	// ── Status badge helpers ──────────────────────────────────────────────────────

	function handleStatusChange(status: string) {
		orgStatusOverride = status;
		statusChangeSelection = undefined;
		toast.success(`Organization status changed to ${formatStatusLabel(status)}`);
	}

	const statusVariantMap: Record<string, BadgeVariant> = {
		PENDING: 'warning',
		IN_REVIEW: 'info',
		IN_PROGRESS: 'alert',
		APPROVED: 'success',
		ACTIVE: 'success',
		ON_HOLD: 'warning',
		FROZEN: 'info',
		REJECTED: 'error'
	};

	const statusVariant = $derived(statusVariantMap[normalizeStatus(effectiveStatus)] ?? 'secondary');

	interface OrgInfoPart {
		icon: typeof MailIcon;
		text: string;
	}

	const orgInfoParts = $derived(
		[
			{ icon: MailIcon, text: detail.email },
			{ icon: PhoneIcon, text: detail.phone }
		].filter((part): part is OrgInfoPart => !!part.text)
	);

	// ── Action handlers ───────────────────────────────────────────────────────────

	function handleAddBank(bank: Omit<BankingDetail, 'id'>) {
		banks.push({ id: `bank-${Date.now()}`, ...bank });
	}

	function handleEditBank(bank: BankingDetail) {
		const index = banks.findIndex((b) => b.id === bank.id);
		if (index !== -1) banks[index] = bank;
	}

	async function handleConfirmActivate(): Promise<void> {
		await new Promise<void>((res) => setTimeout(res, 800));
		orgStatusOverride = 'ACTIVE';
		toast.success('Organization activated successfully');
	}
</script>

{#if org}
	<div class="-m-5 flex min-h-full w-full flex-col">
		<!-- ── Sticky header + tabs ───────────────────────────────────────────── -->
		<div class="sticky top-0 z-10 bg-background">
			<div class="relative overflow-hidden" style="background: var(--gradient-card)">
				<div class="gradient-primary absolute inset-x-0 top-0 h-0.5"></div>

				<div
					class="flex flex-col gap-4 px-4 pt-5 pb-4 sm:flex-row sm:items-start sm:justify-between sm:px-6 sm:pb-5"
				>
					<!-- Identity -->
					<div class="flex items-center gap-4">
						<Avatar name={org.name} size="lg" shape="square" />
						<div class="min-w-0">
							<div class="flex flex-wrap items-center gap-2">
								<h1 class="text-xl font-bold tracking-tight sm:text-2xl">{org.name}</h1>
								<Chip variant={statusVariant}>{formatStatusLabel(effectiveStatus)}</Chip>
							</div>
							<div class="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
								{#each orgInfoParts as part, i (part.text + i)}
									{#if i > 0}
										<span class="text-border">•</span>
									{/if}
									<span class="inline-flex items-center gap-1">
										<part.icon class="size-3.5 shrink-0" />
										{part.text}
									</span>
								{/each}
								{#if orgInfoParts.length > 0}
									<span class="text-border">•</span>
								{/if}
								<span>{formatStatusLabel(org.profileType)}</span>
								<span class="text-border">•</span>
								<span>{formatStatusLabel(org.businessType)}</span>
							</div>
						</div>
					</div>

					{#if isActive}
						<div class="w-full shrink-0 sm:w-52">
							<p class="mb-1.5 text-xs font-medium text-muted-foreground">Change status</p>
							<Dropdown
								bind:value={statusChangeSelection}
								options={statusChangeOptions}
								placeholder="Select status"
								onValueChange={handleStatusChange}
							/>
						</div>
					{/if}
				</div>
			</div>

			<div class="border-b border-border/60 bg-background/98 backdrop-blur-sm">
				<div
					class="flex overflow-x-auto px-4 sm:px-6"
					role="tablist"
					aria-label="Organization sections"
				>
					{#each tabs as tab (tab.key)}
						{@const locked = tab.key === 'configuration' && configTabLocked}
						<button
							type="button"
							role="tab"
							aria-selected={activeTab === tab.key}
							onclick={() => !locked && (activeTab = tab.key)}
							disabled={locked}
							title={locked ? 'Upload agreement document to enable Configuration' : undefined}
							class={cn(
								'relative shrink-0 px-4 py-3.5 text-sm font-medium transition-colors',
								locked
									? 'cursor-not-allowed text-muted-foreground/35'
									: activeTab === tab.key
										? 'text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-t-full after:bg-primary'
										: 'text-muted-foreground hover:text-foreground'
							)}
						>
							{tab.label}
						</button>
					{/each}
				</div>
			</div>
		</div>

		<!-- ── Tab content ────────────────────────────────────────────────────── -->
		<div class="p-4 sm:p-6">
			{#key activeTab}
				<div
					in:fly={{ y: 8, duration: 220, easing: cubicOut }}
					out:fade={{ duration: 80, easing: cubicOut }}
				>
					{#if activeTab === 'kyb'}
						<KybTab kyb={detail.kyb} />
					{:else if activeTab === 'account'}
						<AccountsTab {banks} onaddbank={handleAddBank} oneditbank={handleEditBank} />
					{:else if activeTab === 'documents'}
						<DocumentsTab
							documents={detail.documents}
							directors={documentDirectors}
							businessType={org.businessType}
							bind:agreementFile
							{agreementUploaded}
							showAgreementSection={isApproved}
							{isPartner}
							showActivateButton={showActivateProfile}
							onopenconfiguration={handleOpenConfiguration}
							onactivate={handleConfirmActivate}
						/>
					{:else if activeTab === 'integration'}
						<ApplicationIntegrationTab bind:integration />
					{:else if activeTab === 'configuration'}
						<ConfigurationTab
							orgId={org.id}
							orgStatus={effectiveStatus}
							onactivate={handleConfirmActivate}
						/>
					{/if}
				</div>
			{/key}
		</div>
	</div>
{:else}
	<div class="flex min-h-48 items-center justify-center p-6 text-sm text-muted-foreground">
		Organization not found.
	</div>
{/if}
