<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/reusable';
	import { Input } from '$lib/components/reusable';
	import { Textarea } from '$lib/components/reusable';
	import { AccessSelectTable } from '$lib/components/role-management';
	import { roleFormStore } from '$lib/stores/role-management/role-form.svelte';
	import { PERM_KEYS, PERM_LABELS } from '$lib/stores/role-management/role-modules';
	import { mapPermissionsCatalog } from '$lib/stores/role-management/permissions-mapper';
	import { fetchExistingRoleNames } from '$lib/stores/role-management/roles-api';
	import { firstValidationError } from '$lib/stores/role-management/validation';
	import { cn } from '$lib/utils';
	import { untrack } from 'svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	/** Errors only surface after the user clicks Preview. */
	let previewAttempted = $state(false);

	const catalog = $derived(mapPermissionsCatalog(data?.permissionModules));
	const errors = $derived(roleFormStore.validationErrors);
	const nameError = $derived(previewAttempted ? errors.name : undefined);
	const descriptionError = $derived(previewAttempted ? errors.description : undefined);
	const permissionsError = $derived(previewAttempted ? errors.permissions : undefined);

	$effect(() => {
		const moduleIds = catalog.modules.map((m) => m.id);
		const optionsByModule = catalog.optionsByModule;
		// untrack so configureCatalog's permission reads/writes don't re-trigger this effect
		untrack(() => roleFormStore.configureCatalog(moduleIds, optionsByModule));
	});

	onMount(() => {
		void loadExistingRoleNames();
	});

	async function loadExistingRoleNames() {
		try {
			const names = await fetchExistingRoleNames('merchant');
			roleFormStore.setExistingRoleNames(names);
		} catch {
			toast.error('Could not load existing roles for name check');
		}
	}

	function handleClear() {
		previewAttempted = false;
		roleFormStore.clear();
	}

	function goToPreview() {
		previewAttempted = true;

		if (!roleFormStore.isValid) {
			const message = firstValidationError(roleFormStore.validationErrors);
			if (message) toast.error(message);
			return;
		}

		goto(resolve('/merchant/role-management/create-role/preview'));
	}
</script>

<div class="m-auto w-full space-y-6 md:w-[75%]">
	<!-- Header -->
	<div class="flex flex-wrap items-start justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold text-foreground">Create role</h1>
			<p class="mt-1 text-sm text-muted-foreground">
				Define a new role with its access and permissions.
			</p>
		</div>
	</div>

	<!-- Role detail -->
	<div class="rounded-xl border border-border bg-card p-5 shadow">
		<h2 class="mb-5 text-sm font-semibold text-foreground">Role detail</h2>
		<div class="space-y-4">
			<div class="space-y-1.5">
				<label for="role-name" class="text-sm font-medium text-foreground">
					Role name <span class="text-destructive">*</span>
				</label>
				<Input
					id="role-name"
					placeholder="e.g. Finance Manager"
					class={cn('shadow', nameError && 'border-destructive focus-visible:ring-destructive/30')}
					aria-invalid={nameError ? 'true' : undefined}
					aria-describedby={nameError ? 'role-name-error' : undefined}
					bind:value={roleFormStore.name}
				/>
				{#if nameError}
					<p id="role-name-error" class="text-xs text-destructive">{nameError}</p>
				{/if}
			</div>
			<div class="space-y-1.5">
				<Textarea
					id="role-desc"
					label="Description"
					required
					class={cn(
						'min-h-26 resize-none shadow',
						descriptionError && 'border-destructive focus-visible:ring-destructive/30'
					)}
					placeholder="Describe what this role is responsible for..."
					aria-invalid={descriptionError ? 'true' : undefined}
					aria-describedby={descriptionError ? 'role-desc-error' : undefined}
					bind:value={roleFormStore.description}
				/>
				{#if descriptionError}
					<p id="role-desc-error" class="text-xs text-destructive">{descriptionError}</p>
				{/if}
			</div>
		</div>
	</div>

	<!-- Access & permissions -->
	<div class="space-y-2">
		<AccessSelectTable
			modules={catalog.modules}
			title="Access & permissions"
			description="Select the permissions to grant for this module"
			permissions={roleFormStore.permissions}
			permKeys={PERM_KEYS}
			permLabels={PERM_LABELS}
			optionsByModule={catalog.optionsByModule}
			allSelected={roleFormStore.allSelected}
			onToggle={(moduleId, key) => roleFormStore.toggle(moduleId, key)}
			onToggleAll={() => roleFormStore.toggleAll()}
		/>
		{#if permissionsError}
			<p class="text-xs text-destructive">{permissionsError}</p>
		{/if}
	</div>

	<!-- Footer -->
	<div class="flex justify-end gap-2">
		<Button variant="outline" onclick={handleClear}>Clear</Button>
		<Button onclick={goToPreview}>Preview</Button>
	</div>
</div>
