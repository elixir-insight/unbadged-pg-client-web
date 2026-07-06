<script lang="ts">
	import * as v from 'valibot';
	import { Button, FileUpload, Dropdown } from '$lib/components/reusable';
	import { fly } from 'svelte/transition';
	import { cn } from '$lib/utils';
	import { buildDocumentsSchema, flattenIssues } from '$lib/validation/onboarding';
	import { Building2, FileText, Users, ArrowLeft, ArrowRight } from '$lib/assets/icons';
	import Card from './Card.svelte';

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
		onnext = () => {},
		onprev = () => {}
	}: {
		directors: Director[];
		directorDocFiles: Record<number, { aadhaar: File | null; pan: File | null }>;
		businessType?: string;
		isValid?: boolean;
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

<!-- Document field -->
{#snippet documentField(
	label: string,
	maxSize: string,
	body: import('svelte').Snippet,
	required = true
)}
	<div class="flex flex-col gap-3">
		<div class="flex items-center justify-between gap-3">
			<p class="text-sm font-medium">
				{label}
				{#if required}
					<span class="text-rose-500">*</span>
				{/if}
			</p>
			<span
				class="shrink-0 rounded-full bg-muted/70 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
				>Max {maxSize}</span
			>
		</div>
		{@render body()}
	</div>
{/snippet}

{#snippet uploadField(key: string, placeholder: string)}
	<FileUpload bind:file={docFiles[key]} {placeholder} onchange={onFieldInput} />
	{#if errors[key]}
		<p class="text-xs text-rose-500">{errors[key]}</p>
	{/if}
{/snippet}

<div in:fly={{ y: 10, duration: 220 }} class="space-y-3">
	<Card class="bg-background">
		{#snippet header()}
			<div class="flex items-center gap-3">
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
		{/snippet}
	</Card>

	<Card class="overflow-hidden bg-background">
		<div class="-mx-6 -my-4 divide-y divide-border/30">
			<!-- Business Documents -->
			<section class="flex flex-col gap-5 px-6 py-5">
				<div class="flex items-center justify-between gap-3">
					<div class="flex items-center gap-2.5">
						<div
							class="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary"
						>
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

				<div class="grid grid-cols-2 gap-5">
					{#snippet bizCertBody()}
						<Dropdown options={bizCertOptions} bind:value={bizCertType} />
						{@render uploadField('bizCert', 'Click to upload or drag & drop')}
					{/snippet}
					{@render documentField('Business Certificate', '2MB', bizCertBody)}

					{#snippet proofOfFundsBody()}
						<Dropdown options={proofOfFundsOptions} bind:value={proofOfFundsType} />
						{@render uploadField('proofOfFunds', 'Click to upload or drag & drop')}
					{/snippet}
					{@render documentField('Proof Of Funds', '1MB', proofOfFundsBody)}

					{#snippet rentalAgreementBody()}
						<Dropdown options={rentalAgreementOptions} bind:value={rentalAgreementType} />
						{@render uploadField('rentalAgreement', 'Click to upload or drag & drop')}
					{/snippet}
					{@render documentField('Rental Agreement', '5MB', rentalAgreementBody)}
				</div>
			</section>

			<!-- Additional Documents -->
			<section class="flex flex-col gap-5 px-6 py-5">
				<div class="flex items-center justify-between gap-3">
					<div class="flex items-center gap-2.5">
						<div
							class="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary"
						>
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

				<div class="grid grid-cols-2 gap-5">
					{#snippet gstCertBody()}
						{@render uploadField('gstCert', 'Click to upload or drag & drop')}
					{/snippet}
					{@render documentField('GST Certificate', '2MB', gstCertBody)}

					{#snippet proprietorPhotoBody()}
						{@render uploadField('proprietorPhoto', 'Click to upload or drag & drop')}
					{/snippet}
					{@render documentField('Proprietor Photo with Stamp', '5MB', proprietorPhotoBody)}

					{#if isPrivateLimited}
						{#snippet bizPanBody()}
							{@render uploadField('bizPan', 'Click to upload or drag & drop')}
						{/snippet}
						{@render documentField('Business PAN card', '1MB', bizPanBody)}

						{#snippet moaCertBody()}
							{@render uploadField('moaCert', 'Click to upload or drag & drop')}
						{/snippet}
						{@render documentField(
							'Memorandum of Association Certificate (MOA)',
							'5MB',
							moaCertBody
						)}

						{#snippet aoaCertBody()}
							{@render uploadField('aoaCert', 'Click to upload or drag & drop')}
						{/snippet}
						{@render documentField('Article of Association Certificate (AOA)', '5MB', aoaCertBody)}

						{#snippet bizTanBody()}
							{@render uploadField('bizTan', 'Click to upload or drag & drop')}
						{/snippet}
						{@render documentField('Business TAN', '5MB', bizTanBody)}
					{/if}
				</div>
			</section>

			<!-- Director Documents -->
			<section class="flex flex-col gap-5 px-6 py-5">
				<div class="flex items-center justify-between gap-3">
					<div class="flex items-center gap-2.5">
						<div
							class="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary"
						>
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
						<div
							class={cn('flex flex-col gap-5', i > 0 && 'pt-5', i < directors.length - 1 && 'pb-5')}
							in:fly={{ y: 6, duration: 200 }}
						>
							<div class="flex items-center gap-2">
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

							<div class="grid grid-cols-2 gap-5">
								{#snippet aadhaarBody()}
									<FileUpload
										bind:file={directorDocFiles[director.id].aadhaar}
										placeholder="Upload Aadhaar"
									/>
								{/snippet}
								{@render documentField('Aadhaar Card', '2MB', aadhaarBody, false)}

								{#snippet panBody()}
									<FileUpload
										bind:file={directorDocFiles[director.id].pan}
										placeholder="Upload PAN"
									/>
								{/snippet}
								{@render documentField('PAN Card', '2MB', panBody, false)}
							</div>
						</div>
					{/each}
				</div>
			</section>
		</div>

		{#snippet footer()}
			<div
				class="flex w-full flex-wrap items-center justify-between gap-3 border-t border-border pt-4"
			>
				<Button variant="ghost" size="sm" onclick={onprev}>
					<ArrowLeft class="size-4" />
					Previous
				</Button>
				<div class="flex items-center gap-2">
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
		{/snippet}
	</Card>
</div>
