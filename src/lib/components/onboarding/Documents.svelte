<script lang="ts">
	import * as v from 'valibot';
	import { Button, FileUpload, Dropdown, toast } from '$lib/components/reusable';
	import { fly } from 'svelte/transition';
	import { buildDocumentsSchema, flattenIssues } from '$lib/validation/onboarding';
	import { Building2, FileText, Users, ArrowLeft, ArrowRight } from '$lib/assets/icons';

	interface Director {
		id: number;
		name: string;
		aadhaar: string;
		pan: string;
		email: string;
		phone: string;
	}

	let {
		directors,
		directorDocFiles = $bindable<Record<number, { aadhaar: File | null; pan: File | null }>>({}),
		businessType = '',
		isValid = $bindable(false),
		hideNavigation = false,
		onnext = () => {},
		onprev = () => {}
	}: {
		directors: Director[];
		directorDocFiles: Record<number, { aadhaar: File | null; pan: File | null }>;
		businessType?: string;
		isValid?: boolean;
		hideNavigation?: boolean;
		onnext?: () => void;
		onprev?: () => void;
	} = $props();

	// businessType arrives either as 'PRIVATE_LIMITED' (mockData) or 'Private Limited'
	// (onboarding drafts) — normalize before comparing.
	const isPrivateLimited = $derived(
		businessType.toUpperCase().replace(/\s+/g, '_') === 'PRIVATE_LIMITED'
	);

	// ── Document upload state ────────────────────────────────────────
	function mockFile(name: string, sizeInBytes: number, type = 'application/pdf'): File {
		return new File([new Uint8Array(sizeInBytes)], name, { type });
	}

	let docFiles = $state<Record<string, File | null>>({
		bizCert: mockFile('incorp_certificate.pdf', 1258291),
		proofOfFunds: mockFile('bank_statement.in.pdf', 911360),
		rentalAgreement: null,
		gstCert: null,
		proprietorPhoto: null,
		bizPan: null,
		bizTan: null,
		aoaCert: null,
		moaCert: null
	});

	let bizCertType = $state('incorporation_certificate');
	let proofOfFundsType = $state('last_3_months_bank_statements');
	let rentalAgreementType = $state('');

	const bizCertOptions = [
		{ value: 'incorporation_certificate', label: 'Incorporation Certificate' },
		{ value: 'msme_certificate', label: 'MSME Certificate' },
		{ value: 'udyam_certificate', label: 'Udyam Certificate' }
	];

	const proofOfFundsOptions = [
		{ value: 'last_3_months_bank_statements', label: 'Last 3 months bank statements' },
		{ value: 'cancelled_cheque', label: 'Cancelled Cheque' }
	];

	const rentalAgreementOptions = [
		{ value: 'rental_agreement', label: 'Rental Agreement' },
		{ value: 'electricity_bill', label: 'Electricity Bill' }
	];

	// ── Upload progress ───────────────────────────────────────────────
	const businessDocKeys = ['bizCert', 'proofOfFunds', 'rentalAgreement'];
	const additionalDocKeys = $derived(
		isPrivateLimited
			? ['gstCert', 'proprietorPhoto', 'bizPan', 'bizTan', 'aoaCert', 'moaCert']
			: ['gstCert', 'proprietorPhoto']
	);
	const businessDocsUploaded = $derived(businessDocKeys.filter((k) => docFiles[k] !== null).length);
	const additionalDocsUploaded = $derived(
		additionalDocKeys.filter((k) => docFiles[k] !== null).length
	);

	// ── Validation ─────────────────────────────────────────────────
	let errors = $state<Record<string, string>>({});
	let submitAttempted = $state(false);

	function validate(): boolean {
		const result = v.safeParse(buildDocumentsSchema(isPrivateLimited), docFiles);
		errors = result.success ? {} : flattenIssues(result.issues);
		return result.success;
	}

	const canContinue = $derived(
		v.safeParse(buildDocumentsSchema(isPrivateLimited), docFiles).success
	);

	$effect(() => {
		if (isValid !== canContinue) {
			isValid = canContinue;
		}
	});

	function onFieldInput() {
		if (submitAttempted) validate();
	}

	function handleSaveAndContinue() {
		submitAttempted = true;
		if (!validate()) return;
		onnext();
	}

	// Ensure every director has a doc-file slot before FileUpload binds to it directly.
	$effect(() => {
		for (const d of directors) {
			if (!directorDocFiles[d.id]) directorDocFiles[d.id] = { aadhaar: null, pan: null };
		}
	});

	function handlePanelSave() {
		submitAttempted = true;
		if (!validate()) return;
		toast.success('Documents updated successfully');
	}

	function clearDocuments() {
		docFiles = {
			bizCert: null,
			proofOfFunds: null,
			rentalAgreement: null,
			gstCert: null,
			proprietorPhoto: null,
			bizPan: null,
			bizTan: null,
			aoaCert: null,
			moaCert: null
		};
		bizCertType = '';
		proofOfFundsType = '';
		rentalAgreementType = '';
		directorDocFiles = directors.reduce(
			(acc, d) => ({ ...acc, [d.id]: { aadhaar: null, pan: null } }),
			{}
		);
		errors = {};
		submitAttempted = false;
	}
</script>

<!-- Compact upload field -->
{#snippet uploadField(key: string, placeholder: string)}
	<FileUpload bind:file={docFiles[key]} {placeholder} onchange={onFieldInput} />
	{#if errors[key]}
		<p class="text-xs text-rose-500">{errors[key]}</p>
	{/if}
{/snippet}

<div in:fly={{ y: 10, duration: 220 }} class="space-y-3">
	<!-- Header -->
	<div
		class="flex items-center gap-3 rounded-2xl border border-border/40 bg-background/80 px-4 py-4 shadow-sm backdrop-blur-sm sm:px-5"
	>
		<div
			class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
		>
			<FileText class="size-4.5" />
		</div>
		<div class="min-w-0 flex-1">
			<p class="text-base leading-none font-semibold">Document Verification</p>
			<p class="mt-0.5 text-xs text-muted-foreground">
				Upload required compliance documents for KYB approval
			</p>
		</div>
		<div class="shrink-0 text-right">
			<p class="text-sm font-semibold tabular-nums">
				{businessDocsUploaded + additionalDocsUploaded}<span class="text-muted-foreground"
					>/{businessDocKeys.length + additionalDocKeys.length}</span
				>
			</p>
			<p class="text-[10px] text-muted-foreground">uploaded</p>
		</div>
	</div>

	<!-- ① Business Documents -->
	<div
		class="overflow-hidden rounded-2xl border border-border/40 bg-background/80 shadow-sm backdrop-blur-sm"
	>
		<div class="flex items-center justify-between border-b border-border/30 px-4 py-3.5 sm:px-5">
			<div class="flex items-center gap-2.5">
				<div class="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
					<Building2 class="size-3.5" />
				</div>
				<div>
					<p class="text-sm font-semibold">Business Documents</p>
					<p class="text-xs text-muted-foreground">Core compliance certificates</p>
				</div>
			</div>
			<span
				class="rounded-full bg-muted/70 px-2.5 py-1 text-[10px] font-medium text-muted-foreground tabular-nums"
			>
				{businessDocsUploaded}/3 uploaded
			</span>
		</div>

		<div class="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-5">
			<!-- Business Certificate -->
			<div class="flex flex-col gap-3 rounded-xl border border-border/20 p-4">
				<div class="flex items-start justify-between gap-3">
					<div class="space-y-0.5">
						<p class="text-sm font-medium">
							Business Certificate <span class="text-rose-500">*</span>
						</p>
						<p class="text-xs text-muted-foreground">Incorporation or registration certificate</p>
					</div>
					<span
						class="shrink-0 rounded-full bg-muted/70 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
						>Max 2MB</span
					>
				</div>
				<div class="flex flex-col gap-1.5">
					<Dropdown options={bizCertOptions} bind:value={bizCertType} />
					{@render uploadField('bizCert', 'Click to upload or drag & drop')}
				</div>
			</div>

			<!-- Proof Of Funds -->
			<div class="flex flex-col gap-3 rounded-xl border border-border/20 p-4">
				<div class="flex items-start justify-between gap-3">
					<div class="space-y-0.5">
						<p class="text-sm font-medium">Proof Of Funds <span class="text-rose-500">*</span></p>
						<p class="text-xs text-muted-foreground">Bank statements or audited financials</p>
					</div>
					<span
						class="shrink-0 rounded-full bg-muted/70 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
						>Max 1MB</span
					>
				</div>
				<div class="flex flex-col gap-1.5">
					<Dropdown options={proofOfFundsOptions} bind:value={proofOfFundsType} />
					{@render uploadField('proofOfFunds', 'Click to upload or drag & drop')}
				</div>
			</div>

			<!-- Rental Agreement -->
			<div class="flex flex-col gap-3 rounded-xl border border-border/20 p-4">
				<div class="flex items-start justify-between gap-3">
					<div class="space-y-0.5">
						<p class="text-sm font-medium">Rental Agreement <span class="text-rose-500">*</span></p>
						<p class="text-xs text-muted-foreground">
							Lease or ownership proof for business premises
						</p>
					</div>
					<span
						class="shrink-0 rounded-full bg-muted/70 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
						>Max 5MB</span
					>
				</div>
				<div class="flex flex-col gap-1.5">
					<Dropdown options={rentalAgreementOptions} bind:value={rentalAgreementType} />
					{@render uploadField('rentalAgreement', 'Click to upload or drag & drop')}
				</div>
			</div>
		</div>
	</div>

	<!-- ② Additional Documents -->
	<div
		class="overflow-hidden rounded-2xl border border-border/40 bg-background/80 shadow-sm backdrop-blur-sm"
	>
		<div class="flex items-center justify-between border-b border-border/30 px-4 py-3.5 sm:px-5">
			<div class="flex items-center gap-2.5">
				<div class="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
					<FileText class="size-3.5" />
				</div>
				<div>
					<p class="text-sm font-semibold">Additional Documents</p>
					<p class="text-xs text-muted-foreground">GST, identity and compliance documents</p>
				</div>
			</div>
			<span
				class="rounded-full bg-muted/70 px-2.5 py-1 text-[10px] font-medium text-muted-foreground tabular-nums"
			>
				{additionalDocsUploaded}/{additionalDocKeys.length} uploaded
			</span>
		</div>

		<div class="divide-y divide-border/20 grid grid-cols-1 sm:grid-cols-2">
			<div class="space-y-2 p-4 sm:p-5">
				<div class="flex items-start justify-between gap-3">
					<div class="space-y-0.5">
						<p class="text-sm font-medium">GST Certificate <span class="text-rose-500">*</span></p>
						<p class="text-xs text-muted-foreground">Goods and Services Tax registration</p>
					</div>
					<span
						class="shrink-0 rounded-full bg-muted/70 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
						>Max 2MB</span
					>
				</div>
				{@render uploadField('gstCert', 'Click to upload or drag & drop')}
			</div>

			<div class="space-y-2 p-4 sm:p-5">
				<div class="flex items-start justify-between gap-3">
					<div class="space-y-0.5">
						<p class="text-sm font-medium">
							Proprietor Photo with Stamp <span class="text-rose-500">*</span>
						</p>
						<p class="text-xs text-muted-foreground">Photo with official business stamp</p>
					</div>
					<span
						class="shrink-0 rounded-full bg-muted/70 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
						>Max 5MB</span
					>
				</div>
				{@render uploadField('proprietorPhoto', 'Click to upload or drag & drop')}
			</div>

			{#if isPrivateLimited}
				<div class="space-y-2 p-4 sm:p-5">
					<div class="flex items-start justify-between gap-3">
						<div class="space-y-0.5">
							<p class="text-sm font-medium">
								Business PAN card <span class="text-rose-500">*</span>
							</p>
							<p class="text-xs text-muted-foreground">Permanent Account Number card</p>
						</div>
						<span
							class="shrink-0 rounded-full bg-muted/70 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
							>Max 1MB</span
						>
					</div>
					{@render uploadField('bizPan', 'Click to upload or drag & drop')}
				</div>

				<div class="space-y-2 p-4 sm:p-5">
					<div class="flex items-start justify-between gap-3">
						<div class="space-y-0.5">
							<p class="text-sm font-medium">
								Memorandum of Association Certificate (MOA) <span class="text-rose-500">*</span>
							</p>
							<p class="text-xs text-muted-foreground">
								Defines the company's scope and objectives
							</p>
						</div>
						<span
							class="shrink-0 rounded-full bg-muted/70 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
							>Max 5MB</span
						>
					</div>
					{@render uploadField('moaCert', 'Click to upload or drag & drop')}
				</div>

				<div class="space-y-2 p-4 sm:p-5">
					<div class="flex items-start justify-between gap-3">
						<div class="space-y-0.5">
							<p class="text-sm font-medium">
								Article of Association Certificate (AOA) <span class="text-rose-500">*</span>
							</p>
							<p class="text-xs text-muted-foreground">Governs the company's internal affairs</p>
						</div>
						<span
							class="shrink-0 rounded-full bg-muted/70 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
							>Max 5MB</span
						>
					</div>
					{@render uploadField('aoaCert', 'Click to upload or drag & drop')}
				</div>

				<div class="space-y-2 p-4 sm:p-5">
					<div class="flex items-start justify-between gap-3">
						<div class="space-y-0.5">
							<p class="text-sm font-medium">Business TAN <span class="text-rose-500">*</span></p>
							<p class="text-xs text-muted-foreground">Tax Deduction Account Number certificate</p>
						</div>
						<span
							class="shrink-0 rounded-full bg-muted/70 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
							>Max 5MB</span
						>
					</div>
					{@render uploadField('bizTan', 'Click to upload or drag & drop')}
				</div>
			{/if}
		</div>
	</div>

	<!-- ③ Director Documents -->
	<div
		class="overflow-hidden rounded-2xl border border-border/40 bg-background/80 shadow-sm backdrop-blur-sm"
	>
		<div class="flex items-center justify-between border-b border-border/30 px-4 py-3.5 sm:px-5">
			<div class="flex items-center gap-2.5">
				<div class="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
					<Users class="size-3.5" />
				</div>
				<div>
					<p class="text-sm font-semibold">Director Documents</p>
					<p class="text-xs text-muted-foreground">Identity documents for each director</p>
				</div>
			</div>
			<span
				class="rounded-full bg-muted/70 px-2.5 py-1 text-[10px] font-medium text-muted-foreground tabular-nums"
			>
				{directors.length}
				{directors.length === 1 ? 'director' : 'directors'}
			</span>
		</div>

		<div class="divide-y divide-border/20">
			{#each directors as director, i (director.id)}
				<div class="p-4 sm:p-5" in:fly={{ y: 6, duration: 200 }}>
					<div class="mb-3 flex items-center gap-2">
						<div
							class="flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary"
						>
							{i + 1}
						</div>
						<p class="text-sm font-semibold">
							{director.name || `Director ${i + 1}`}
						</p>
						<span class="text-xs text-muted-foreground">(Director)</span>
					</div>

					<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
						<!-- Aadhaar upload -->
						<div class="space-y-1.5">
							<div class="flex items-center justify-between">
								<p class="text-xs font-medium text-muted-foreground">Aadhaar Card</p>
								<span class="text-[10px] text-muted-foreground">Max 2MB</span>
							</div>
							<FileUpload
								bind:file={directorDocFiles[director.id].aadhaar}
								placeholder="Upload Aadhaar"
							/>
						</div>

						<!-- PAN upload -->
						<div class="space-y-1.5">
							<div class="flex items-center justify-between">
								<p class="text-xs font-medium text-muted-foreground">PAN Card</p>
								<span class="text-[10px] text-muted-foreground">Max 2MB</span>
							</div>
							<FileUpload bind:file={directorDocFiles[director.id].pan} placeholder="Upload PAN" />
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Actions bar -->
	{#if !hideNavigation}
		<div
			class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/40 bg-background/80 px-4 py-3.5 shadow-sm backdrop-blur-sm sm:px-5"
		>
			<Button variant="ghost" size="sm" onclick={onprev}>
				<ArrowLeft class="size-4" />
				Previous
			</Button>
			<div class="flex items-center gap-2">
				<!-- Hide Clear on mobile -->
				<Button variant="ghost" size="sm" onclick={clearDocuments} class="hidden sm:inline-flex">
					Clear all
				</Button>
				<Button
					size="sm"
					class="gradient-primary text-primary-foreground"
					onclick={handleSaveAndContinue}
					disabled={!canContinue}
				>
					Save & Continue
					<ArrowRight class="size-4" />
				</Button>
			</div>
		</div>
	{:else}
		<div
			class="flex items-center justify-end rounded-2xl border border-border/40 bg-background/80 px-4 py-3.5 shadow-sm backdrop-blur-sm sm:px-5"
		>
			<Button
				size="sm"
				class="gradient-primary text-primary-foreground"
				onclick={handlePanelSave}
				disabled={!canContinue}
			>
				Save changes
			</Button>
		</div>
	{/if}
</div>
