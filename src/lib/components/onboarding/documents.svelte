<script lang="ts">
	import * as v from 'valibot';
	import { FileUpload, Dropdown } from '$lib/components/reusable';
	import { cn } from '$lib/utils';
	import { buildDocumentsSchema, flattenIssues } from '$lib/validation/onboarding';
	import { FileText } from '$lib/assets/icons';
	import OnboardingStepShell from './onboarding-step-shell.svelte';
	import OnboardingSection from './onboarding-section.svelte';
	import StepNavFooter from './step-nav-footer.svelte';

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

	const isPrivateLimited = $derived(
		businessType.toUpperCase().replace(/\s+/g, '_') === 'PRIVATE_LIMITED'
	);

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
	const totalDocs = $derived(businessDocKeys.length + additionalDocKeys.length);
	const totalUploaded = $derived(businessDocsUploaded + additionalDocsUploaded);

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
			<span class="shrink-0 text-[10px] text-muted-foreground">Max {maxSize}</span>
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

<OnboardingStepShell
	icon={FileText}
	title="Document Verification"
	description="Upload required compliance documents for KYB approval"
>
	{#snippet trailing()}
		<div class="shrink-0 text-right">
			<p class="text-sm font-semibold tabular-nums">
				{totalUploaded}<span class="text-muted-foreground">/{totalDocs}</span>
			</p>
			<p class="text-[10px] text-muted-foreground">uploaded</p>
		</div>
	{/snippet}

	<OnboardingSection
		title="Business Documents"
		description="Core compliance certificates · {businessDocsUploaded}/3 uploaded"
	>
		<div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
	</OnboardingSection>

	<OnboardingSection
		title="Additional Documents"
		description="GST, identity and compliance · {additionalDocsUploaded}/{additionalDocKeys.length} uploaded"
	>
		<div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
				{@render documentField('Memorandum of Association Certificate (MOA)', '5MB', moaCertBody)}

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
	</OnboardingSection>

	<OnboardingSection
		title="Director Documents"
		description="Identity documents for {directors.length} director{directors.length === 1
			? ''
			: 's'}"
	>
		<div class="divide-y divide-border/30">
			{#each directors as director, i (director.id)}
				<div class={cn('space-y-4', i > 0 && 'pt-5', i < directors.length - 1 && 'pb-5')}>
					<p class="text-sm font-medium">
						{director.name || `Director ${i + 1}`}
					</p>
					<div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
						{#snippet aadhaarBody()}
							<FileUpload
								bind:file={directorDocFiles[director.id].aadhaar}
								placeholder="Upload Aadhaar"
							/>
						{/snippet}
						{@render documentField('Aadhaar Card', '2MB', aadhaarBody, false)}

						{#snippet panBody()}
							<FileUpload bind:file={directorDocFiles[director.id].pan} placeholder="Upload PAN" />
						{/snippet}
						{@render documentField('PAN Card', '2MB', panBody, false)}
					</div>
				</div>
			{/each}
		</div>
	</OnboardingSection>

	{#snippet footer()}
		<StepNavFooter
			showPrev
			{onprev}
			showClear
			onclear={clearDocuments}
			onnext={handleSaveAndContinue}
			nextLabel="Save & Continue"
			nextDisabled={!canContinue}
		/>
	{/snippet}
</OnboardingStepShell>
