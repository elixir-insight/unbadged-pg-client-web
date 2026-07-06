<script lang="ts">
	import * as v from 'valibot';
	import { Button, Input, FileUpload } from '$lib/components/reusable';
	import * as Select from '$lib/components/ui/select';
	import { scale, fly } from 'svelte/transition';
	import { backOut } from 'svelte/easing';
	import { cn } from '$lib/utils';
	import { buildKybSchema, flattenIssues } from '$lib/validation/onboarding';
	import {
		Building2,
		FileText,
		CheckIcon,
		Trash2Icon,
		PlusIcon,
		Globe,
		Users,
		ArrowRight
	} from '$lib/assets/icons';
	import Card from './Card.svelte';

	export interface Director {
		id: number;
		name: string;
		aadhaar: string;
		pan: string;
		email: string;
		phone: string;
	}

	export interface KybFormSeed {
		address?: string;
		country?: string;
		stateVal?: string;
		city?: string;
		pinCode?: string;
		businessPan?: string;
		companyGst?: string;
		cinNumber?: string;
		tanNumber?: string;
		companyPhone?: string;
		companyWebsite?: string;
		industry?: string;
		registeredYear?: string;
		communicationAddress?: string;
	}

	let {
		directors = $bindable<Director[]>([
			{ id: 1, name: '', aadhaar: '', pan: '', email: '', phone: '' }
		]),
		nextDirectorId = $bindable(2),
		directorDocFiles = $bindable<Record<number, { aadhaar: File | null; pan: File | null }>>({
			1: { aadhaar: null, pan: null }
		}),
		businessType = '',
		isValid = $bindable(false),
		seed = undefined as KybFormSeed | undefined,
		readonly = false,
		onnext = () => {}
	}: {
		directors: Director[];
		nextDirectorId: number;
		directorDocFiles: Record<number, { aadhaar: File | null; pan: File | null }>;
		businessType?: string;
		isValid?: boolean;
		seed?: KybFormSeed;
		readonly?: boolean;
		onnext?: () => void;
	} = $props();

	// businessType arrives either as 'PRIVATE_LIMITED' (mockData) or 'Private Limited'
	// (onboarding drafts) — normalize before comparing.
	const isPrivateLimited = $derived(
		businessType.toUpperCase().replace(/\s+/g, '_') === 'PRIVATE_LIMITED'
	);

	// ── Internal form state ───────────────────────────────────────────
	let address = $state('');
	let country = $state('in');
	let stateVal = $state('');
	let city = $state('');
	let pinCode = $state('');
	let businessPan = $state('');
	let companyGst = $state('');
	let cinNumber = $state('');
	let tanNumber = $state('');
	let companyPhone = $state('');
	let companyWebsite = $state('');
	let industry = $state('');
	let registeredYear = $state('');
	let companyLogo = $state<File | null>(null);
	let communicationAddress = $state('');
	let sameAsAddress = $state(false);
	let seedApplied = $state(false);

	$effect.pre(() => {
		if (!seed || seedApplied) return;
		address = seed.address ?? '';
		country = seed.country ?? 'in';
		stateVal = seed.stateVal ?? '';
		city = seed.city ?? '';
		pinCode = seed.pinCode ?? '';
		businessPan = seed.businessPan ?? '';
		companyGst = seed.companyGst ?? '';
		cinNumber = seed.cinNumber ?? '';
		tanNumber = seed.tanNumber ?? '';
		companyPhone = seed.companyPhone ?? '';
		companyWebsite = seed.companyWebsite ?? '';
		industry = seed.industry ?? '';
		registeredYear = seed.registeredYear ?? '';
		communicationAddress = seed.communicationAddress ?? '';
		seedApplied = true;
	});

	// ── Validation ───────────────────────────────────────────────────
	let errors = $state<Record<string, string>>({});
	let submitAttempted = $state(false);

	function getFormData() {
		return {
			address,
			stateVal,
			city,
			pinCode,
			businessPan,
			companyGst,
			cinNumber,
			tanNumber,
			communicationAddress,
			companyPhone,
			companyWebsite,
			registeredYear,
			industry,
			directors
		};
	}

	function validate(): boolean {
		const result = v.safeParse(buildKybSchema(isPrivateLimited), getFormData());
		errors = result.success ? {} : flattenIssues(result.issues);
		return result.success;
	}

	const canContinue = $derived(
		v.safeParse(buildKybSchema(isPrivateLimited), getFormData()).success
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
		if (sameAsAddress) {
			communicationAddress = address;
		}
		if (submitAttempted) validate();
	});

	// ── Lookups ──────────────────────────────────────────────────────
	const countries = [
		{ value: 'in', label: 'India' },
		{ value: 'us', label: 'United States' },
		{ value: 'gb', label: 'United Kingdom' },
		{ value: 'ca', label: 'Canada' },
		{ value: 'au', label: 'Australia' },
		{ value: 'sg', label: 'Singapore' },
		{ value: 'ae', label: 'UAE' }
	];

	const indianStates = [
		'Andhra Pradesh',
		'Arunachal Pradesh',
		'Assam',
		'Bihar',
		'Chhattisgarh',
		'Goa',
		'Gujarat',
		'Haryana',
		'Himachal Pradesh',
		'Jharkhand',
		'Karnataka',
		'Kerala',
		'Madhya Pradesh',
		'Maharashtra',
		'Manipur',
		'Meghalaya',
		'Mizoram',
		'Nagaland',
		'Odisha',
		'Punjab',
		'Rajasthan',
		'Sikkim',
		'Tamil Nadu',
		'Telangana',
		'Tripura',
		'Uttar Pradesh',
		'Uttarakhand',
		'West Bengal',
		'Delhi',
		'Jammu & Kashmir',
		'Ladakh',
		'Puducherry',
		'Chandigarh'
	];

	const selectedCountryLabel = $derived(
		countries.find((c) => c.value === country)?.label ?? 'Select Country'
	);
	const selectedStateLabel = $derived(stateVal || 'Select State');

	// ── Director management ──────────────────────────────────────────
	function addDirector() {
		directors = [
			...directors,
			{ id: nextDirectorId, name: '', aadhaar: '', pan: '', email: '', phone: '' }
		];
		directorDocFiles = { ...directorDocFiles, [nextDirectorId]: { aadhaar: null, pan: null } };
		nextDirectorId++;
		onFieldInput();
	}

	function removeDirector(id: number) {
		if (directors.length > 1) {
			directors = directors.filter((d) => d.id !== id);
			onFieldInput();
		}
	}

	// ── Per-section "required fields missing" indicators ──────────────
	const locationMissing = $derived(
		!address.trim() || !stateVal || !city.trim() || !pinCode.trim() || !communicationAddress.trim()
	);
	const registrationMissing = $derived(
		!businessPan.trim() ||
			!companyGst.trim() ||
			!registeredYear.trim() ||
			!industry.trim() ||
			(isPrivateLimited && (!cinNumber.trim() || !tanNumber.trim()))
	);
	const contactMissing = $derived(!companyPhone.trim() || !companyWebsite.trim());
	const directorsMissing = $derived(
		directors.some(
			(d) =>
				!d.name.trim() || !d.aadhaar.trim() || !d.pan.trim() || !d.email.trim() || !d.phone.trim()
		)
	);

	const allMandatoryFilled = $derived(
		!locationMissing && !registrationMissing && !contactMissing && !directorsMissing
	);

	const canSave = $derived(allMandatoryFilled && Object.keys(errors).length === 0);

	function clearKyb() {
		address = '';
		country = 'in';
		stateVal = '';
		city = '';
		pinCode = '';
		businessPan = '';
		companyGst = '';
		cinNumber = '';
		tanNumber = '';
		companyPhone = '';
		companyWebsite = '';
		industry = '';
		registeredYear = '';
		companyLogo = null;
		communicationAddress = '';
		sameAsAddress = false;
		directors = [{ id: 1, name: '', aadhaar: '', pan: '', email: '', phone: '' }];
		nextDirectorId = 2;
		errors = {};
		submitAttempted = false;
	}
</script>

<div in:fly={{ y: 10, duration: 220 }} class="space-y-3">
	<Card class="bg-background">
		{#snippet header()}
			<div class="flex items-center justify-between gap-3">
				<div class="flex items-center gap-3">
					<div
						class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
					>
						<Building2 class="size-4.5" />
					</div>
					<div class="min-w-0 flex-1">
						<p class="text-base leading-none font-semibold">Know Your Business</p>
						<p class="mt-0.5 text-xs text-muted-foreground">
							Complete all sections to verify your business identity
						</p>
					</div>
				</div>
				{#if !allMandatoryFilled}
					<span
						class="shrink-0 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-medium whitespace-nowrap text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
					>
						Required fields missing
					</span>
				{/if}
			</div>
		{/snippet}
	</Card>

	<Card class="overflow-hidden bg-background">
		<div class="-mx-6 -my-4 divide-y divide-border/30">
			<!-- Address & Location -->
			<section class="px-6 py-5">
				<div class="mb-6 flex items-center gap-2.5">
					<div
						class="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary"
					>
						<Building2 class="size-3.5" />
					</div>
					<div>
						<p class="text-sm font-semibold">Address & Location</p>
						<p class="text-xs text-muted-foreground">Registered address and region</p>
					</div>
				</div>

				<div class="space-y-4">
					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div class="flex flex-col gap-3">
							<label class="text-sm font-medium" for="kyb-address"
								>Address <span class="text-rose-500">*</span></label
							>
							<Input
								id="kyb-address"
								bind:value={address}
								oninput={onFieldInput}
								placeholder="Enter Address"
								disabled={readonly}
								class={cn(errors.address && 'border-destructive focus-visible:ring-destructive/30')}
							/>
							{#if submitAttempted && errors.address}
								<p class="text-xs text-rose-500">{errors.address}</p>
							{/if}
						</div>
						<div class="flex flex-col gap-3">
							<label class="text-sm font-medium" for="kyb-country">Country</label>
							<Select.Root type="single" bind:value={country}>
								<Select.Trigger id="kyb-country" class="w-full">
									{selectedCountryLabel}
								</Select.Trigger>
								<Select.Content>
									{#each countries as c (c.value)}
										<Select.Item value={c.value} label={c.label} />
									{/each}
								</Select.Content>
							</Select.Root>
						</div>
					</div>

					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div class="flex flex-col gap-3">
							<label class="text-sm font-medium" for="kyb-state"
								>State <span class="text-rose-500">*</span></label
							>
							<Select.Root type="single" bind:value={stateVal} onValueChange={onFieldInput}>
								<Select.Trigger
									id="kyb-state"
									class={cn('w-full', errors.stateVal && 'border-destructive')}
								>
									{selectedStateLabel}
								</Select.Trigger>
								<Select.Content>
									{#each indianStates as s (s)}
										<Select.Item value={s} label={s} />
									{/each}
								</Select.Content>
							</Select.Root>
							{#if submitAttempted && errors.stateVal}
								<p class="text-xs text-rose-500">{errors.stateVal}</p>
							{/if}
						</div>
						<div class="flex flex-col gap-3">
							<label class="text-sm font-medium" for="kyb-city"
								>City <span class="text-rose-500">*</span></label
							>
							<Input
								id="kyb-city"
								bind:value={city}
								oninput={onFieldInput}
								placeholder="Enter City"
								class={cn(errors.city && 'border-destructive focus-visible:ring-destructive/30')}
							/>
							{#if submitAttempted && errors.city}
								<p class="text-xs text-rose-500">{errors.city}</p>
							{/if}
						</div>
					</div>

					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div class="flex flex-col gap-3">
							<label class="text-sm font-medium" for="kyb-comm"
								>Communication Address <span class="text-rose-500">*</span></label
							>
							<Input
								id="kyb-comm"
								bind:value={communicationAddress}
								oninput={onFieldInput}
								placeholder="Enter Communication Address"
								disabled={sameAsAddress}
								class={cn(
									sameAsAddress ? 'opacity-60' : '',
									errors.communicationAddress &&
										'border-destructive focus-visible:ring-destructive/30'
								)}
							/>
							{#if submitAttempted && errors.communicationAddress}
								<p class="text-xs text-rose-500">{errors.communicationAddress}</p>
							{/if}
							<label class="flex cursor-pointer items-center gap-2.5 text-sm select-none">
								<div class="relative size-4 shrink-0">
									<input type="checkbox" bind:checked={sameAsAddress} class="peer sr-only" />
									<div
										class="flex size-4 items-center justify-center rounded-sm border border-border bg-background transition-all duration-150 peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-1"
									>
										{#if sameAsAddress}
											<span in:scale={{ duration: 140, easing: backOut, start: 0.2 }}>
												<CheckIcon class="size-2.5 text-primary-foreground" />
											</span>
										{/if}
									</div>
								</div>
								<span class="text-muted-foreground">Same as registered address</span>
							</label>
						</div>
						<div class="flex flex-col gap-3">
							<label class="text-sm font-medium" for="kyb-pin"
								>PIN code <span class="text-rose-500">*</span></label
							>
							<Input
								id="kyb-pin"
								bind:value={pinCode}
								oninput={onFieldInput}
								placeholder="Enter Pin Code"
								class={cn(errors.pinCode && 'border-destructive focus-visible:ring-destructive/30')}
							/>
							{#if submitAttempted && errors.pinCode}
								<p class="text-xs text-rose-500">{errors.pinCode}</p>
							{/if}
						</div>
					</div>
				</div>
			</section>

			<!-- Business Registration -->
			<section class="px-6 py-5">
				<div class="mb-6 flex items-center gap-2.5">
					<div
						class="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary"
					>
						<FileText class="size-3.5" />
					</div>
					<div>
						<p class="text-sm font-semibold">Business Registration</p>
						<p class="text-xs text-muted-foreground">PAN, GST, CIN, TAN and more</p>
					</div>
				</div>

				<div class="space-y-4">
					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div class="flex flex-col gap-3">
							<label class="text-sm font-medium" for="kyb-pan"
								>Business PAN <span class="text-rose-500">*</span></label
							>
							<Input
								id="kyb-pan"
								bind:value={businessPan}
								oninput={onFieldInput}
								placeholder="Enter Business PAN"
								class={cn(
									errors.businessPan && 'border-destructive focus-visible:ring-destructive/30'
								)}
							/>
							{#if submitAttempted && errors.businessPan}
								<p class="text-xs text-rose-500">{errors.businessPan}</p>
							{/if}
						</div>
						<div class="flex flex-col gap-3">
							<label class="text-sm font-medium" for="kyb-gst"
								>Company GST number <span class="text-rose-500">*</span></label
							>
							<Input
								id="kyb-gst"
								bind:value={companyGst}
								oninput={onFieldInput}
								placeholder="Enter Company GST Number"
								class={cn(
									errors.companyGst && 'border-destructive focus-visible:ring-destructive/30'
								)}
							/>
							{#if submitAttempted && errors.companyGst}
								<p class="text-xs text-rose-500">{errors.companyGst}</p>
							{/if}
						</div>
					</div>

					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div class="flex flex-col gap-3">
							<label class="text-sm font-medium" for="kyb-cin"
								>CIN number
								{#if isPrivateLimited}
									<span class="text-rose-500">*</span>
								{/if}</label
							>
							<Input
								id="kyb-cin"
								bind:value={cinNumber}
								oninput={onFieldInput}
								placeholder="Enter CIN Number"
								class={cn(
									errors.cinNumber && 'border-destructive focus-visible:ring-destructive/30'
								)}
							/>
							{#if submitAttempted && errors.cinNumber}
								<p class="text-xs text-rose-500">{errors.cinNumber}</p>
							{/if}
						</div>
						<div class="flex flex-col gap-3">
							<label class="text-sm font-medium" for="kyb-tan"
								>TAN number
								{#if isPrivateLimited}
									<span class="text-rose-500">*</span>
								{/if}</label
							>
							<Input
								id="kyb-tan"
								bind:value={tanNumber}
								oninput={onFieldInput}
								placeholder="Enter TAN Number"
								class={cn(
									errors.tanNumber && 'border-destructive focus-visible:ring-destructive/30'
								)}
							/>
							{#if submitAttempted && errors.tanNumber}
								<p class="text-xs text-rose-500">{errors.tanNumber}</p>
							{/if}
						</div>
					</div>

					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div class="flex flex-col gap-3">
							<label class="text-sm font-medium" for="kyb-year"
								>Registered Year <span class="text-rose-500">*</span></label
							>
							<Input
								id="kyb-year"
								bind:value={registeredYear}
								oninput={onFieldInput}
								placeholder="Enter Registered Year"
								class={cn(
									errors.registeredYear && 'border-destructive focus-visible:ring-destructive/30'
								)}
							/>
							{#if submitAttempted && errors.registeredYear}
								<p class="text-xs text-rose-500">{errors.registeredYear}</p>
							{/if}
						</div>
						<div class="flex flex-col gap-3">
							<label class="text-sm font-medium" for="kyb-industry"
								>Industry <span class="text-rose-500">*</span></label
							>
							<Input
								id="kyb-industry"
								bind:value={industry}
								oninput={onFieldInput}
								placeholder="Enter Industry type"
								class={cn(
									errors.industry && 'border-destructive focus-visible:ring-destructive/30'
								)}
							/>
							{#if submitAttempted && errors.industry}
								<p class="text-xs text-rose-500">{errors.industry}</p>
							{/if}
						</div>
					</div>
				</div>
			</section>

			<!-- Contact & Branding -->
			<section class="px-6 py-5">
				<div class="mb-6 flex items-center gap-2.5">
					<div
						class="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary"
					>
						<Globe class="size-3.5" />
					</div>
					<div>
						<p class="text-sm font-semibold">Contact & Branding</p>
						<p class="text-xs text-muted-foreground">Phone, website and company logo</p>
					</div>
				</div>

				<div class="space-y-4">
					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div class="flex flex-col gap-3">
							<label class="text-sm font-medium" for="kyb-phone"
								>Company Phone <span class="text-rose-500">*</span></label
							>
							<Input
								id="kyb-phone"
								type="tel"
								bind:value={companyPhone}
								oninput={onFieldInput}
								placeholder="Enter Company phone number"
								class={cn(
									errors.companyPhone && 'border-destructive focus-visible:ring-destructive/30'
								)}
							/>
							{#if submitAttempted && errors.companyPhone}
								<p class="text-xs text-rose-500">{errors.companyPhone}</p>
							{/if}
						</div>
						<div class="flex flex-col gap-3">
							<label class="text-sm font-medium" for="kyb-website"
								>Website URL <span class="text-rose-500">*</span></label
							>
							<Input
								id="kyb-website"
								type="text"
								bind:value={companyWebsite}
								oninput={onFieldInput}
								placeholder="Enter Company Website URL"
								class={cn(
									errors.companyWebsite && 'border-destructive focus-visible:ring-destructive/30'
								)}
							/>
							{#if submitAttempted && errors.companyWebsite}
								<p class="text-xs text-rose-500">{errors.companyWebsite}</p>
							{/if}
						</div>
					</div>

					<div class="flex flex-col gap-3">
						<p class="text-sm font-medium">
							Company Logo
							<span class="ml-1 text-xs font-normal text-muted-foreground">(Optional)</span>
						</p>
						<FileUpload
							bind:file={companyLogo}
							accept="image/*"
							placeholder="Upload Company Logo"
						/>
					</div>
				</div>
			</section>

			<!-- Directors & Signatories -->
			<section class="px-6 py-5">
				<div class="mb-6 flex items-center gap-2.5">
					<div
						class="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary"
					>
						<Users class="size-3.5" />
					</div>
					<div>
						<p class="text-sm font-semibold">Directors & Signatories</p>
						<p class="text-xs text-muted-foreground">
							{directors.length}
							{directors.length === 1 ? 'director' : 'directors'} added
						</p>
					</div>
				</div>

				<div class="space-y-4">
					<div class="space-y-4">
						{#each directors as director, i (director.id)}
							<div class="space-y-3" in:fly={{ y: 6, duration: 200 }}>
								<div class="flex items-center justify-between">
									<p class="text-sm font-semibold text-foreground">
										{i + 1}. Director
									</p>
									{#if i > 0}
										<button
											onclick={() => removeDirector(director.id)}
											class="rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
											aria-label="Remove director"
										>
											<Trash2Icon class="size-3.5" />
										</button>
									{/if}
								</div>
								<div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
									<div class="flex flex-col gap-1.5">
										<Input
											bind:value={directors[i].name}
											oninput={onFieldInput}
											placeholder="Enter Name"
											class={cn(
												errors[`directors.${i}.name`] &&
													'border-destructive focus-visible:ring-destructive/30'
											)}
										/>
										{#if submitAttempted && errors[`directors.${i}.name`]}
											<p class="text-xs text-rose-500">{errors[`directors.${i}.name`]}</p>
										{/if}
									</div>
									<div class="flex flex-col gap-1.5">
										<Input
											bind:value={directors[i].aadhaar}
											oninput={onFieldInput}
											placeholder="Enter Aadhaar"
											class={cn(
												errors[`directors.${i}.aadhaar`] &&
													'border-destructive focus-visible:ring-destructive/30'
											)}
										/>
										{#if submitAttempted && errors[`directors.${i}.aadhaar`]}
											<p class="text-xs text-rose-500">{errors[`directors.${i}.aadhaar`]}</p>
										{/if}
									</div>
									<div class="flex flex-col gap-1.5">
										<Input
											bind:value={directors[i].pan}
											oninput={onFieldInput}
											placeholder="Enter PAN"
											class={cn(
												errors[`directors.${i}.pan`] &&
													'border-destructive focus-visible:ring-destructive/30'
											)}
										/>
										{#if submitAttempted && errors[`directors.${i}.pan`]}
											<p class="text-xs text-rose-500">{errors[`directors.${i}.pan`]}</p>
										{/if}
									</div>
								</div>
								<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
									<div class="flex flex-col gap-1.5">
										<Input
											bind:value={directors[i].email}
											oninput={onFieldInput}
											type="email"
											placeholder="Enter Email"
											class={cn(
												errors[`directors.${i}.email`] &&
													'border-destructive focus-visible:ring-destructive/30'
											)}
										/>
										{#if submitAttempted && errors[`directors.${i}.email`]}
											<p class="text-xs text-rose-500">{errors[`directors.${i}.email`]}</p>
										{/if}
									</div>
									<div class="flex flex-col gap-1.5">
										<Input
											bind:value={directors[i].phone}
											oninput={onFieldInput}
											type="tel"
											placeholder="Enter Phone"
											class={cn(
												errors[`directors.${i}.phone`] &&
													'border-destructive focus-visible:ring-destructive/30'
											)}
										/>
										{#if submitAttempted && errors[`directors.${i}.phone`]}
											<p class="text-xs text-rose-500">{errors[`directors.${i}.phone`]}</p>
										{/if}
									</div>
								</div>
							</div>
							{#if i < directors.length - 1}
								<hr class="border-border/30" />
							{/if}
						{/each}
					</div>

					<button
						onclick={addDirector}
						class="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/8"
					>
						<PlusIcon class="size-4" />
						Add Director
					</button>
				</div>
			</section>
		</div>

		{#snippet footer()}
			<div class="flex w-full items-center justify-end gap-2 border-t border-border pt-4">
				<Button variant="ghost" size="sm" onclick={clearKyb}>Clear all</Button>
				<Button
					size="sm"
					class="gradient-primary text-primary-foreground"
					onclick={handleSaveAndContinue}
					disabled={!canSave}
				>
					Save & continue
					<ArrowRight class="size-4" />
				</Button>
			</div>
		{/snippet}
	</Card>
</div>
