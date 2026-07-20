<script lang="ts">
	import { Button, Checkbox, Chip, Input } from '$lib/components/reusable';
	import { AlertCircle, CheckCircle2, Pencil, Plus, Trash2 } from '$lib/assets/icons';
	import {
		createMissingDirectorDocument,
		type OrganizationDirector,
		type OrganizationKyb
	} from '$lib/data/mockData';
	import { addressesEqual } from '../helpers';
	import { untrack } from 'svelte';
	import { formatAadharInput, normalizePanInput } from '$lib/validation/organization-kyb';

	type DirectorTextField = 'name' | 'pan' | 'email' | 'phone' | 'aadhar';
	type AddressField = 'line1' | 'line2' | 'city' | 'state' | 'pincode' | 'country';

	let {
		kybDraft = $bindable(),
		directorsDraft = $bindable()
	}: {
		kybDraft: OrganizationKyb;
		directorsDraft: OrganizationDirector[];
	} = $props();

	let expandedDirectorId = $state<string | null>(null);
	let sameAsRegistered = $state(
		untrack(() => addressesEqual(kybDraft.registeredAddress, kybDraft.communicationAddress))
	);

	const legalConfigured = $derived(
		Boolean(
			kybDraft.gstin &&
			kybDraft.businessPan &&
			kybDraft.businessPhone &&
			kybDraft.industry &&
			kybDraft.organizationWebsite &&
			kybDraft.registeredYear &&
			(kybDraft.businessType !== 'Private Limited' || kybDraft.cin)
		)
	);

	const addressConfigured = $derived(
		Boolean(
			kybDraft.registeredAddress.line1 &&
			kybDraft.registeredAddress.line2 &&
			kybDraft.registeredAddress.city &&
			kybDraft.registeredAddress.state &&
			kybDraft.registeredAddress.pincode &&
			kybDraft.registeredAddress.country &&
			kybDraft.communicationAddress.line1 &&
			kybDraft.communicationAddress.line2 &&
			kybDraft.communicationAddress.city &&
			kybDraft.communicationAddress.state &&
			kybDraft.communicationAddress.pincode &&
			kybDraft.communicationAddress.country
		)
	);

	const directorsConfigured = $derived(
		directorsDraft.length > 0 &&
			directorsDraft.every(
				(director) =>
					director.name && director.pan && director.email && director.phone && director.aadhar
			)
	);

	$effect(() => {
		if (!sameAsRegistered) return;
		kybDraft.communicationAddress = {
			line1: kybDraft.registeredAddress.line1,
			line2: kybDraft.registeredAddress.line2,
			city: kybDraft.registeredAddress.city,
			state: kybDraft.registeredAddress.state,
			pincode: kybDraft.registeredAddress.pincode,
			country: kybDraft.registeredAddress.country
		};
	});

	function updateRegisteredAddress(field: AddressField, value: string) {
		kybDraft.registeredAddress[field] = value;
	}

	function updateCommunicationAddress(field: AddressField, value: string) {
		sameAsRegistered = false;
		kybDraft.communicationAddress[field] = value;
	}

	function addDirector() {
		const id = `director-${Date.now()}`;
		directorsDraft = [
			...directorsDraft,
			{
				id,
				name: '',
				pan: '',
				email: '',
				phone: '',
				aadhar: '',
				aadharDocument: createMissingDirectorDocument(`${id}-aadhar`),
				panDocument: createMissingDirectorDocument(`${id}-pan`)
			}
		];
		expandedDirectorId = id;
	}

	function removeDirector(id: string) {
		directorsDraft = directorsDraft.filter((director) => director.id !== id);
		if (expandedDirectorId === id) {
			expandedDirectorId = null;
		}
	}

	function updateDirector(id: string, field: DirectorTextField, value: string) {
		const normalized =
			field === 'pan'
				? normalizePanInput(value)
				: field === 'aadhar'
					? formatAadharInput(value)
					: value;
		directorsDraft = directorsDraft.map((director) =>
			director.id === id ? { ...director, [field]: normalized } : director
		);
	}
</script>

{#snippet statusChip(configured: boolean)}
	<Chip variant={configured ? 'success' : 'warning'}>
		{#if configured}
			<CheckCircle2 class="size-3" />
			Configured
		{:else}
			<AlertCircle class="size-3" />
			Incomplete
		{/if}
	</Chip>
{/snippet}

{#snippet cardHeader(title: string, subtitle: string, configured: boolean)}
	<div class="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
		<div class="min-w-0">
			<h2 class="text-sm font-semibold text-card-foreground">{title}</h2>
			<p class="mt-1 text-sm text-muted-foreground">{subtitle}</p>
		</div>
		{@render statusChip(configured)}
	</div>
{/snippet}

{#snippet textField(
	label: string,
	value: string,
	onChange: (value: string) => void,
	placeholder = '',
	type: 'text' | 'email' | 'tel' | 'url' | 'number' = 'text',
	disabled = false
)}
	<label class="space-y-2">
		<span class="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</span>
		<Input
			{type}
			{value}
			{disabled}
			oninput={(event) => onChange((event.currentTarget as HTMLInputElement).value)}
			{placeholder}
		/>
	</label>
{/snippet}

<div class="space-y-4">
	<section class="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
		{@render cardHeader(
			'Legal Identity',
			'GSTIN, PAN, and business registration details',
			legalConfigured
		)}
		<div class="grid gap-4 p-5 md:grid-cols-2">
			{@render textField('GSTIN', kybDraft.gstin, (value) => {
				kybDraft.gstin = value;
			})}
			{@render textField('Business PAN', kybDraft.businessPan, (value) => {
				kybDraft.businessPan = value;
			})}
			{@render textField(
				'Business phone',
				kybDraft.businessPhone,
				(value) => {
					kybDraft.businessPhone = value;
				},
				'',
				'tel'
			)}
			{@render textField('Industry', kybDraft.industry, (value) => {
				kybDraft.industry = value;
			})}
			{@render textField(
				'Organization website',
				kybDraft.organizationWebsite,
				(value) => {
					kybDraft.organizationWebsite = value;
				},
				'',
				'url'
			)}
			{@render textField(
				'Registered year',
				kybDraft.registeredYear == null ? '' : String(kybDraft.registeredYear),
				(value) => {
					kybDraft.registeredYear = value === '' ? null : Number(value);
				},
				'',
				'number'
			)}
			{@render textField(
				kybDraft.businessType === 'Private Limited' ? 'CIN' : 'CIN (optional)',
				kybDraft.cin,
				(value) => {
					kybDraft.cin = value;
				}
			)}
			{@render textField('TAN (optional)', kybDraft.tan, (value) => {
				kybDraft.tan = value;
			})}
		</div>
	</section>

	<section class="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
		{@render cardHeader(
			'Address',
			'Registered and communication addresses on file',
			addressConfigured
		)}
		<div class="space-y-6 p-5">
			<div class="space-y-4">
				<h3 class="text-sm font-medium">Registered Address</h3>
				<div class="grid gap-4 md:grid-cols-2">
					{@render textField('Address Line 1', kybDraft.registeredAddress.line1, (value) => {
						updateRegisteredAddress('line1', value);
					})}
					{@render textField('Address Line 2', kybDraft.registeredAddress.line2, (value) => {
						updateRegisteredAddress('line2', value);
					})}
					{@render textField('City', kybDraft.registeredAddress.city, (value) => {
						updateRegisteredAddress('city', value);
					})}
					{@render textField('State', kybDraft.registeredAddress.state, (value) => {
						updateRegisteredAddress('state', value);
					})}
					{@render textField('Pincode', kybDraft.registeredAddress.pincode, (value) => {
						updateRegisteredAddress('pincode', value);
					})}
					{@render textField('Country', kybDraft.registeredAddress.country, (value) => {
						updateRegisteredAddress('country', value);
					})}
				</div>
			</div>

			<div class="space-y-4">
				<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<h3 class="text-sm font-medium">Communication Address</h3>
					<Checkbox label="Same as registered address" bind:checked={sameAsRegistered} />
				</div>
				<div class="grid gap-4 md:grid-cols-2">
					{@render textField(
						'Address Line 1',
						kybDraft.communicationAddress.line1,
						(value) => {
							updateCommunicationAddress('line1', value);
						},
						'',
						'text',
						sameAsRegistered
					)}
					{@render textField(
						'Address Line 2',
						kybDraft.communicationAddress.line2,
						(value) => {
							updateCommunicationAddress('line2', value);
						},
						'',
						'text',
						sameAsRegistered
					)}
					{@render textField(
						'City',
						kybDraft.communicationAddress.city,
						(value) => {
							updateCommunicationAddress('city', value);
						},
						'',
						'text',
						sameAsRegistered
					)}
					{@render textField(
						'State',
						kybDraft.communicationAddress.state,
						(value) => {
							updateCommunicationAddress('state', value);
						},
						'',
						'text',
						sameAsRegistered
					)}
					{@render textField(
						'Pincode',
						kybDraft.communicationAddress.pincode,
						(value) => {
							updateCommunicationAddress('pincode', value);
						},
						'',
						'text',
						sameAsRegistered
					)}
					{@render textField(
						'Country',
						kybDraft.communicationAddress.country,
						(value) => {
							updateCommunicationAddress('country', value);
						},
						'',
						'text',
						sameAsRegistered
					)}
				</div>
			</div>
		</div>
	</section>

	<section class="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
		{@render cardHeader(
			'Directors',
			'People authorized to represent this organization',
			directorsConfigured
		)}
		<div class="space-y-4 p-5">
			<div class="flex items-center justify-end">
				<Button variant="outline" size="sm" onclick={addDirector}>
					<Plus class="size-4" />
					Add Director
				</Button>
			</div>

			{#if directorsDraft.length === 0}
				<p class="text-sm text-muted-foreground">Add at least one director.</p>
			{:else}
				<div class="space-y-3">
					{#each directorsDraft as director (director.id)}
						{@const isExpanded = expandedDirectorId === director.id}
						<div class="rounded-xl border border-border/60 p-4">
							{#if isExpanded}
								<div class="mb-4 flex items-center justify-between">
									<p class="text-sm font-medium">{director.name || 'New director'}</p>
									<div class="flex flex-wrap gap-2">
										<Button variant="ghost" size="sm" onclick={() => (expandedDirectorId = null)}>
											Done
										</Button>
										{#if directorsDraft.length > 1}
											<Button
												variant="ghost"
												size="icon-sm"
												class="text-destructive hover:bg-destructive/10 hover:text-destructive"
												aria-label="Remove director"
												onclick={() => removeDirector(director.id)}
											>
												<Trash2 class="size-4" />
											</Button>
										{/if}
									</div>
								</div>
								<div class="grid gap-4 md:grid-cols-2">
									{@render textField('Name', director.name, (value) =>
										updateDirector(director.id, 'name', value)
									)}
									{@render textField('PAN', director.pan, (value) =>
										updateDirector(director.id, 'pan', value)
									)}
									{@render textField(
										'Aadhar',
										director.aadhar,
										(value) => updateDirector(director.id, 'aadhar', value),
										'XXXX XXXX XXXX'
									)}
									{@render textField(
										'Email',
										director.email,
										(value) => updateDirector(director.id, 'email', value),
										'',
										'email'
									)}
									{@render textField(
										'Phone',
										director.phone,
										(value) => updateDirector(director.id, 'phone', value),
										'',
										'tel'
									)}
								</div>
							{:else}
								<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
									<div class="space-y-0.5">
										<p class="text-sm font-medium">{director.name || 'New director'}</p>
										<p class="text-sm text-muted-foreground">
											PAN {director.pan || '—'} · Aadhar {director.aadhar || '—'}
										</p>
									</div>
									<div class="flex flex-wrap gap-2">
										<Button
											variant="outline"
											size="icon-sm"
											aria-label="Edit director"
											onclick={() => (expandedDirectorId = director.id)}
										>
											<Pencil class="size-4" />
										</Button>
										{#if directorsDraft.length > 1}
											<Button
												variant="ghost"
												size="icon-sm"
												class="text-destructive hover:bg-destructive/10 hover:text-destructive"
												aria-label="Remove director"
												onclick={() => removeDirector(director.id)}
											>
												<Trash2 class="size-4" />
											</Button>
										{/if}
									</div>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</section>
</div>
