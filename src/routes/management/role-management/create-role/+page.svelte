<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/reusable';
	import { Input } from '$lib/components/reusable';
	import { Textarea } from '$lib/components/reusable';
	import { AccessSelectTable } from '$lib/components/role-management';
	import { roleFormStore } from '$lib/stores/role-management/role-form.svelte';
	import { PERM_KEYS, PERM_LABELS } from '$lib/stores/role-management/role-modules';
	import { mapPermissionsCatalog } from '$lib/stores/role-management/permissions-mapper';
	import { untrack } from 'svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const catalog = $derived(mapPermissionsCatalog(data?.permissionModules));

	$effect(() => {
		const moduleIds = catalog.modules.map((m) => m.id);
		const optionsByModule = catalog.optionsByModule;
		// untrack so configureCatalog's permission reads/writes don't re-trigger this effect
		untrack(() => roleFormStore.configureCatalog(moduleIds, optionsByModule));
	});
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
					class="shadow"
					bind:value={roleFormStore.name}
				/>
			</div>
			<Textarea
				id="role-desc"
				label="Description"
				required
				class="min-h-26 resize-none shadow"
				placeholder="Describe what this role is responsible for..."
				bind:value={roleFormStore.description}
			/>
		</div>
	</div>

	<!-- Access & permissions -->
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

	<!-- Footer -->
	<div class="flex justify-end gap-2">
		<Button variant="outline" onclick={() => roleFormStore.clear()}>Clear</Button>
		<Button
			disabled={!roleFormStore.isValid}
			onclick={() => goto(resolve('/management/role-management/create-role/preview'))}
		>
			Preview
		</Button>
	</div>
</div>
