<script lang="ts">
	import { beforeNavigate, goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { SvelteURL } from 'svelte/reactivity';
	import { Button, Input } from '$lib/components/reusable';
	import { Pencil, Plus, Trash2 } from '$lib/assets/icons';
	import { createMissingDirectorDocument } from '$lib/data/mockData';
	import {
		cloneOrganization,
		getAdjacentFlowSteps,
		previewPath,
		type FlowStepKey
	} from '../../helpers';

	type DirectorTextField = 'name' | 'pan' | 'email' | 'phone' | 'designation';

	type KybStep = Extract<FlowStepKey, 'legal' | 'address' | 'directors'>;

	const stepIds = new Set<string>(['legal', 'address', 'directors']);

	const stepCopy: Record<KybStep, { title: string; description: string }> = {
		legal: {
			title: 'Business Registration',
			description: 'Enter GSTIN and optional CIN/TAN details.'
		},
		address: {
			title: 'Address',
			description: 'Provide the registered business address.'
		},
		directors: {
			title: 'Directors',
			description: 'Add at least one director before approval.'
		}
	};

	let { data } = $props();

	const organization = $derived(data.organization);
	const orgId = $derived(organization.id);

	let editableKyb = $state(cloneOrganization(data.organization.kyb));
	let editableDirectors = $state(cloneOrganization(data.organization.directors));
	let lastOrgId = $state(data.organization.id);
	let expandedDirectorId = $state<string | null>(null);
	let draftSaved = $state(false);
	let savedClearTimer = $state<ReturnType<typeof setTimeout> | null>(null);

	$effect(() => {
		if (organization.id !== lastOrgId) {
			editableKyb = cloneOrganization(organization.kyb);
			editableDirectors = cloneOrganization(organization.directors);
			lastOrgId = organization.id;
			expandedDirectorId = null;
			clearSavedConfirmation();
		}
	});

	$effect(() => {
		return () => {
			if (savedClearTimer) clearTimeout(savedClearTimer);
		};
	});

	const currentStep = $derived.by((): KybStep => {
		const step = page.url.searchParams.get('step') ?? 'legal';
		return stepIds.has(step) ? (step as KybStep) : 'legal';
	});

	const adjacent = $derived(getAdjacentFlowSteps(organization.category, currentStep));
	const meta = $derived(stepCopy[currentStep]);

	beforeNavigate(({ to }) => {
		if (!to || to.route.id === '/management/organizations') return;
		saveKyb();
	});

	function clearSavedConfirmation() {
		draftSaved = false;
		if (savedClearTimer) {
			clearTimeout(savedClearTimer);
			savedClearTimer = null;
		}
	}

	function saveKyb() {
		Object.assign(organization.kyb, cloneOrganization(editableKyb));
		organization.directors = cloneOrganization(editableDirectors);
		organization.kyb.directors = organization.directors;
	}

	function saveAsDraft() {
		saveKyb();
		draftSaved = true;
		if (savedClearTimer) clearTimeout(savedClearTimer);
		savedClearTimer = setTimeout(() => {
			draftSaved = false;
			savedClearTimer = null;
		}, 3000);
	}

	function setStep(step: KybStep) {
		const url = new SvelteURL(page.url.toString());
		if (step === 'legal') {
			url.searchParams.delete('step');
		} else {
			url.searchParams.set('step', step);
		}
		const href =
			`${page.url.pathname}${url.searchParams.toString() ? `?${url.searchParams.toString()}` : ''}` as `${typeof page.url.pathname}${string}`;
		goto(resolve(href as '/'), {
			replaceState: true,
			noScroll: true,
			keepFocus: true
		});
	}

	function navigateToHref(href: string) {
		goto(resolve(href as '/'));
	}

	function goNext() {
		saveKyb();
		if (!adjacent.next) {
			navigateToHref(previewPath(orgId));
			return;
		}
		if (
			adjacent.next.key === 'legal' ||
			adjacent.next.key === 'address' ||
			adjacent.next.key === 'directors'
		) {
			setStep(adjacent.next.key);
			return;
		}
		navigateToHref(adjacent.next.href(orgId));
	}

	function addDirector() {
		clearSavedConfirmation();
		const id = `director-${Date.now()}`;
		editableDirectors = [
			...editableDirectors,
			{
				id,
				name: '',
				pan: '',
				email: '',
				phone: '',
				designation: '',
				aadharDocument: createMissingDirectorDocument(`${id}-aadhar`),
				panDocument: createMissingDirectorDocument(`${id}-pan`)
			}
		];
		expandedDirectorId = id;
	}

	function removeDirector(id: string) {
		clearSavedConfirmation();
		editableDirectors = editableDirectors.filter((director) => director.id !== id);
		if (expandedDirectorId === id) {
			expandedDirectorId = null;
		}
	}

	function updateDirector(id: string, field: DirectorTextField, value: string) {
		clearSavedConfirmation();
		editableDirectors = editableDirectors.map((director) =>
			director.id === id ? { ...director, [field]: value } : director
		);
	}
</script>

{#snippet textField(
	label: string,
	value: string,
	onChange: (value: string) => void,
	placeholder = '',
	type: 'text' | 'email' | 'tel' | 'url' = 'text'
)}
	<label class="space-y-2">
		<span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
		<Input
			{type}
			{value}
			oninput={(event) => {
				clearSavedConfirmation();
				onChange((event.currentTarget as HTMLInputElement).value);
			}}
			{placeholder}
		/>
	</label>
{/snippet}

<div class="space-y-6">
	<div>
		<h2 class="text-base font-semibold">{meta.title}</h2>
		<p class="mt-1 text-sm text-muted-foreground">{meta.description}</p>
	</div>

	{#if currentStep === 'legal'}
		<div class="grid gap-4 md:grid-cols-2">
			{@render textField('GSTIN', editableKyb.gstin, (value) => {
				editableKyb.gstin = value;
			})}
			{@render textField('CIN (optional)', editableKyb.cin, (value) => {
				editableKyb.cin = value;
			})}

			{@render textField('TAN (optional)', editableKyb.tan, (value) => {
				editableKyb.tan = value;
			})}
		</div>
	{:else if currentStep === 'address'}
		<div class="grid gap-4 md:grid-cols-2">
			{@render textField('Address Line 1', editableKyb.registeredAddress.line1, (value) => {
				editableKyb.registeredAddress.line1 = value;
			})}
			{@render textField('Address Line 2', editableKyb.registeredAddress.line2, (value) => {
				editableKyb.registeredAddress.line2 = value;
			})}
			{@render textField('City', editableKyb.registeredAddress.city, (value) => {
				editableKyb.registeredAddress.city = value;
			})}
			{@render textField('State', editableKyb.registeredAddress.state, (value) => {
				editableKyb.registeredAddress.state = value;
			})}
			{@render textField('Pincode', editableKyb.registeredAddress.pincode, (value) => {
				editableKyb.registeredAddress.pincode = value;
			})}
		</div>
	{:else}
		<div class="space-y-4">
			<div class="flex items-center justify-end">
				<Button variant="outline" size="sm" onclick={addDirector}>
					<Plus class="size-4" />
					Add Director
				</Button>
			</div>

			{#if editableDirectors.length === 0}
				<p class="text-sm text-muted-foreground">Add at least one director before approval.</p>
			{:else}
				<div class="space-y-3">
					{#each editableDirectors as director (director.id)}
						{@const isExpanded = expandedDirectorId === director.id}
						<div class="rounded-xl border border-border/60 p-4">
							{#if isExpanded}
								<div class="mb-4 flex items-center justify-between">
									<p class="text-sm font-medium">{director.name || 'New director'}</p>
									<div class="flex flex-wrap gap-2">
										<Button variant="ghost" size="sm" onclick={() => (expandedDirectorId = null)}>
											Done
										</Button>
										{#if editableDirectors.length > 1}
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
									{@render textField('Designation', director.designation, (value) =>
										updateDirector(director.id, 'designation', value)
									)}
									{@render textField('PAN', director.pan, (value) =>
										updateDirector(director.id, 'pan', value)
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
											{director.designation || 'No designation'}
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
										{#if editableDirectors.length > 1}
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
	{/if}

	<div class="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
		<Button variant="outline" href="/management/organizations">Cancel</Button>
		<div class="flex flex-wrap items-center gap-3">
			{#if draftSaved}
				<span class="text-sm text-muted-foreground">Saved</span>
			{/if}
			<Button variant="outline" onclick={saveAsDraft}>Save as draft</Button>
			<Button onclick={goNext}>
				{adjacent.next?.key === 'review' || !adjacent.next ? 'Review & approve' : 'Next step'}
			</Button>
		</div>
	</div>
</div>
