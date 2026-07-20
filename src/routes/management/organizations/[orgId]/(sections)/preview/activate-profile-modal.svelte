<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { toast } from 'svelte-sonner';
	import { Button, Dropdown, FileUpload, Input, Modal } from '$lib/components/reusable';
	import type { DropdownOption } from '$lib/components/reusable';
	import { ZapIcon } from '$lib/assets/icons';
	import { documentChoiceGroups } from '$lib/data/mockData';
	import { validateOrganizationActivation } from '$lib/validation/organization-activation';

	let {
		open = $bindable(false),
		category,
		form
	}: {
		open?: boolean;
		category: string;
		form?: { message?: string; action?: string } | null;
	} = $props();

	let apiKey = $state('');
	let saltKey = $state('');
	let businessCertificateType = $state('');
	let businessCertificateFile = $state<File | null>(null);
	let fieldErrors = $state<Record<string, string>>({});
	let activating = $state(false);

	const businessCertificateOptions: DropdownOption[] = $derived(
		(documentChoiceGroups.find((group) => group.key === 'businessCertificate')?.options ?? []).map(
			(option) => ({ value: option, label: option })
		)
	);

	$effect(() => {
		if (open && !businessCertificateType && businessCertificateOptions.length > 0) {
			businessCertificateType = businessCertificateOptions[0]?.value ?? '';
		}
	});

	function resetForm() {
		apiKey = '';
		saltKey = '';
		businessCertificateType = businessCertificateOptions[0]?.value ?? '';
		businessCertificateFile = null;
		fieldErrors = {};
	}

	function closeModal() {
		open = false;
		resetForm();
	}

	const onActivateEnhance: SubmitFunction = ({ formData, cancel }) => {
		fieldErrors = {};

		const validation = validateOrganizationActivation({
			apiKey,
			saltKey,
			businessCertificateType,
			file: businessCertificateFile
		});

		if (!validation.valid) {
			fieldErrors = validation.errors;
			cancel();
			return;
		}

		formData.set('apiKey', apiKey.trim());
		formData.set('saltKey', saltKey.trim());
		formData.set('businessCertificateType', businessCertificateType);
		if (businessCertificateFile) {
			formData.set('businessCertificate', businessCertificateFile);
		}

		activating = true;
		return async ({ result, update }) => {
			activating = false;

			if (result.type === 'failure') {
				const message =
					form?.message ??
					(result.data &&
					typeof result.data === 'object' &&
					'message' in result.data &&
					typeof result.data.message === 'string'
						? result.data.message
						: 'Something went wrong');
				toast.error('Failed to activate profile', { description: message });
				await update({ reset: false });
				return;
			}

			if (result.type === 'redirect') {
				closeModal();
				toast.success('Profile activated', {
					description: 'Continue with commission and fee configuration'
				});
			}

			await update({ reset: false });
		};
	};
</script>

<Modal
	bind:open
	title="Activate profile"
	description="Upload the business certificate and enter gateway credentials to activate this organization."
>
	<form
		id="activate-profile-form"
		method="POST"
		action="?/activate"
		enctype="multipart/form-data"
		use:enhance={onActivateEnhance}
		class="space-y-4"
	>
		<input type="hidden" name="category" value={category} />

		<div class="space-y-2">
			<p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
				Business certificate type
			</p>
			<Dropdown
				bind:value={businessCertificateType}
				options={businessCertificateOptions}
				placeholder="Select certificate type"
				disabled={activating}
				bordered
			/>
			{#if fieldErrors.businessCertificateType}
				<p class="text-sm text-destructive">{fieldErrors.businessCertificateType}</p>
			{/if}
		</div>

		<div class="space-y-2">
			<p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
				Business certificate
			</p>
			<FileUpload bind:file={businessCertificateFile} disabled={activating} />
			{#if fieldErrors.businessCertificate}
				<p class="text-sm text-destructive">{fieldErrors.businessCertificate}</p>
			{/if}
		</div>

		<div class="space-y-2">
			<p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">API key</p>
			<Input bind:value={apiKey} placeholder="Enter API key" disabled={activating} />
			{#if fieldErrors.apiKey}
				<p class="text-sm text-destructive">{fieldErrors.apiKey}</p>
			{/if}
		</div>

		<div class="space-y-2">
			<p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Salt key</p>
			<Input bind:value={saltKey} placeholder="Enter salt key" disabled={activating} />
			{#if fieldErrors.saltKey}
				<p class="text-sm text-destructive">{fieldErrors.saltKey}</p>
			{/if}
		</div>
	</form>

	{#snippet footer()}
		<div class="flex gap-2">
			<Button variant="ghost" class="flex-1" disabled={activating} onclick={closeModal}>
				Cancel
			</Button>
			<Button type="submit" form="activate-profile-form" class="flex-1" disabled={activating}>
				<ZapIcon class="size-4" />
				{activating ? 'Activating…' : 'Activate profile'}
			</Button>
		</div>
	{/snippet}
</Modal>
