<script lang="ts">
	import { Button, FileUpload, Dropdown, toast } from '$lib/components/reusable';
	import { Building2, FileText, Users, ArrowLeft, CheckCircle2 } from '$lib/assets/icons';
	import { cn } from '$lib/utils';
	import type { DocumentFormKey } from '$lib/utils/document-upload-form';

	interface Director {
		id: number;
		name: string;
		aadhaar: string;
		pan: string;
		email: string;
		phone: string;
	}

	interface Props {
		directors: Director[];
		directorDocFiles?: Record<number, { aadhaar: File | null; pan: File | null }>;
		docFiles?: Record<DocumentFormKey, File | null>;
		bizCertType?: string;
		proofOfFundsType?: string;
		rentalAgreementType?: string;
		businessType?: string;
		onsaved?: () => void;
		oncancel?: () => void;
	}

	let {
		directors,
		directorDocFiles = $bindable<Record<number, { aadhaar: File | null; pan: File | null }>>({}),
		docFiles = $bindable<Record<DocumentFormKey, File | null>>({
			bizCert: null,
			proofOfFunds: null,
			rentalAgreement: null,
			gstCert: null,
			proprietorPhoto: null,
			bizPan: null,
			bizTan: null,
			aoaCert: null,
			moaCert: null
		}),
		bizCertType = $bindable('incorporation_certificate'),
		proofOfFundsType = $bindable('last_3_months_bank_statements'),
		rentalAgreementType = $bindable(''),
		businessType = '',
		onsaved,
		oncancel
	}: Props = $props();

	const isPrivateLimited = $derived(
		businessType.toUpperCase().replace(/\s+/g, '_') === 'PRIVATE_LIMITED'
	);

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

	const businessDocKeys = ['bizCert', 'proofOfFunds', 'rentalAgreement'] as const;

	const additionalDocKeys = $derived(
		isPrivateLimited
			? (['gstCert', 'proprietorPhoto', 'bizPan', 'bizTan', 'aoaCert', 'moaCert'] as const)
			: (['gstCert', 'proprietorPhoto'] as const)
	);

	const businessUploaded = $derived(businessDocKeys.filter((k) => docFiles[k] !== null).length);
	const additionalUploaded = $derived(additionalDocKeys.filter((k) => docFiles[k] !== null).length);

	const directorUploaded = $derived(
		directors.reduce((count, director) => {
			const files = directorDocFiles[director.id];
			if (!files) return count;
			return count + (files.aadhaar ? 1 : 0) + (files.pan ? 1 : 0);
		}, 0)
	);

	const directorTotal = $derived(directors.length * 2);

	$effect(() => {
		for (const director of directors) {
			if (!directorDocFiles[director.id]) {
				directorDocFiles[director.id] = { aadhaar: null, pan: null };
			}
		}
	});

	function handleSave() {
		toast.success('Documents updated successfully');
		onsaved?.();
	}
</script>

{#snippet uploadCard(
	title: string,
	description: string,
	maxSize: string,
	uploaded: boolean,
	children: import('svelte').Snippet
)}
	<div
		class={cn(
			'flex flex-col gap-3 rounded-xl border p-4 transition-colors',
			uploaded ? 'border-primary/25 bg-primary/3' : 'border-border/60 bg-background/50'
		)}
	>
		<div class="flex items-start justify-between gap-3">
			<div class="min-w-0 flex-1 space-y-0.5">
				<div class="flex items-center gap-2">
					<p class="text-sm font-medium">{title}</p>
					{#if uploaded}
						<CheckCircle2 class="size-3.5 shrink-0 text-success" />
					{/if}
				</div>
				<p class="text-xs text-muted-foreground">{description}</p>
			</div>
			<span
				class="shrink-0 rounded-md border border-border/50 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
			>
				{maxSize}
			</span>
		</div>
		{@render children()}
	</div>
{/snippet}

{#snippet sectionHeading(
	title: string,
	description: string,
	icon: typeof Building2,
	uploaded: number,
	total: number
)}
	{@const Icon = icon}
	<div class="flex items-start gap-3">
		<div
			class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground shadow"
		>
			<Icon class="size-4" />
		</div>
		<div class="min-w-0">
			<h2 class="text-sm font-semibold text-foreground">{title}</h2>
			<p class="mt-0.5 text-xs text-muted-foreground">
				{uploaded}/{total} uploaded · {description}
			</p>
		</div>
	</div>
{/snippet}

<div class="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-xs">
	<div class="gradient-primary h-0.5"></div>

	<!-- Header -->
	<div class="border-b border-border/60 p-4 sm:p-5">
		<div class="flex items-start gap-3">
			<button
				type="button"
				onclick={oncancel}
				class="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
				aria-label="Back to documents"
			>
				<ArrowLeft class="size-4" />
			</button>
			<div class="min-w-0">
				<p class="text-base font-semibold">Edit Documents</p>
				<p class="mt-0.5 text-xs text-muted-foreground">
					Upload or replace compliance documents for this organization
				</p>
			</div>
		</div>
	</div>

	<div class="space-y-6 p-4 sm:p-5">
		<!-- Business Documents -->
		<section class="space-y-4">
			{@render sectionHeading(
				'Business Documents',
				'Core compliance certificates',
				Building2,
				businessUploaded,
				businessDocKeys.length
			)}
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				{@render uploadCard(
					'Business Certificate',
					'Incorporation or registration certificate',
					'Max 2MB',
					docFiles.bizCert !== null,
					businessCertFields
				)}
				{@render uploadCard(
					'Proof Of Funds',
					'Bank statements or audited financials',
					'Max 1MB',
					docFiles.proofOfFunds !== null,
					proofOfFundsFields
				)}
				{@render uploadCard(
					'Rental Agreement',
					'Lease or ownership proof for business premises',
					'Max 5MB',
					docFiles.rentalAgreement !== null,
					rentalAgreementFields
				)}
			</div>
		</section>

		<!-- Additional Documents -->
		<section class="space-y-4 border-t border-border/60 pt-6">
			{@render sectionHeading(
				'Additional Documents',
				'GST, identity and compliance',
				FileText,
				additionalUploaded,
				additionalDocKeys.length
			)}
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				{@render uploadCard(
					'GST Certificate',
					'Goods and Services Tax registration',
					'Max 2MB',
					docFiles.gstCert !== null,
					gstCertField
				)}
				{@render uploadCard(
					'Proprietor Photo with Stamp',
					'Photo with official business stamp',
					'Max 5MB',
					docFiles.proprietorPhoto !== null,
					proprietorPhotoField
				)}

				{#if isPrivateLimited}
					{@render uploadCard(
						'Business PAN card',
						'Permanent Account Number card',
						'Max 1MB',
						docFiles.bizPan !== null,
						bizPanField
					)}
					{@render uploadCard(
						'Memorandum of Association (MOA)',
						"Defines the company's scope and objectives",
						'Max 5MB',
						docFiles.moaCert !== null,
						moaCertField
					)}
					{@render uploadCard(
						'Article of Association (AOA)',
						"Governs the company's internal affairs",
						'Max 5MB',
						docFiles.aoaCert !== null,
						aoaCertField
					)}
					{@render uploadCard(
						'Business TAN',
						'Tax Deduction Account Number certificate',
						'Max 5MB',
						docFiles.bizTan !== null,
						bizTanField
					)}
				{/if}
			</div>
		</section>

		<!-- Director Documents -->
		<section class="space-y-4 border-t border-border/60 pt-6">
			{@render sectionHeading(
				'Director Documents',
				'Identity documents per director',
				Users,
				directorUploaded,
				directorTotal
			)}
			<div class="space-y-6">
				{#each directors as director, i (director.id)}
					{@const files = directorDocFiles[director.id]}
					<div class="space-y-4">
						<div class="flex items-center gap-2.5">
							<div
								class="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground"
							>
								{i + 1}
							</div>
							<div class="min-w-0">
								<p class="text-sm font-semibold">{director.name || `Director ${i + 1}`}</p>
								{#if director.email}
									<p class="truncate text-xs text-muted-foreground">{director.email}</p>
								{/if}
							</div>
						</div>
						<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
							{#snippet directorAadhaarField()}
								<FileUpload
									bind:file={directorDocFiles[director.id].aadhaar}
									placeholder="Upload Aadhaar"
								/>
							{/snippet}
							{#snippet directorPanField()}
								<FileUpload
									bind:file={directorDocFiles[director.id].pan}
									placeholder="Upload PAN"
								/>
							{/snippet}
							{@render uploadCard(
								'Aadhaar Card',
								'Government-issued identity proof',
								'Max 2MB',
								!!files?.aadhaar,
								directorAadhaarField
							)}
							{@render uploadCard(
								'PAN Card',
								'Permanent Account Number card',
								'Max 2MB',
								!!files?.pan,
								directorPanField
							)}
						</div>
					</div>
				{/each}
			</div>
		</section>
	</div>

	<!-- Sticky actions -->
	<div
		class="sticky bottom-0 z-10 flex items-center justify-end gap-2 border-t border-border/60 bg-background/95 px-4 py-3 backdrop-blur-sm sm:px-5"
	>
		<Button size="sm" variant="ghost" onclick={oncancel}>Cancel</Button>
		<Button size="sm" class="gradient-primary text-primary-foreground" onclick={handleSave}>
			Save changes
		</Button>
	</div>
</div>

{#snippet businessCertFields()}
	<Dropdown options={bizCertOptions} bind:value={bizCertType} />
	<FileUpload bind:file={docFiles.bizCert} placeholder="Click to upload or drag & drop" />
{/snippet}

{#snippet proofOfFundsFields()}
	<Dropdown options={proofOfFundsOptions} bind:value={proofOfFundsType} />
	<FileUpload bind:file={docFiles.proofOfFunds} placeholder="Click to upload or drag & drop" />
{/snippet}

{#snippet rentalAgreementFields()}
	<Dropdown options={rentalAgreementOptions} bind:value={rentalAgreementType} />
	<FileUpload bind:file={docFiles.rentalAgreement} placeholder="Click to upload or drag & drop" />
{/snippet}

{#snippet gstCertField()}
	<FileUpload bind:file={docFiles.gstCert} placeholder="Click to upload or drag & drop" />
{/snippet}

{#snippet proprietorPhotoField()}
	<FileUpload bind:file={docFiles.proprietorPhoto} placeholder="Click to upload or drag & drop" />
{/snippet}

{#snippet bizPanField()}
	<FileUpload bind:file={docFiles.bizPan} placeholder="Click to upload or drag & drop" />
{/snippet}

{#snippet moaCertField()}
	<FileUpload bind:file={docFiles.moaCert} placeholder="Click to upload or drag & drop" />
{/snippet}

{#snippet aoaCertField()}
	<FileUpload bind:file={docFiles.aoaCert} placeholder="Click to upload or drag & drop" />
{/snippet}

{#snippet bizTanField()}
	<FileUpload bind:file={docFiles.bizTan} placeholder="Click to upload or drag & drop" />
{/snippet}
