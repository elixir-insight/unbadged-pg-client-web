<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button';
	import { Chip } from '$lib/components/reusable';
	import { AccessPreviewTable } from '$lib/components/role-management';
	import { roleFormStore } from '$lib/stores/role-management/role-form.svelte';
	import {
		collectSelectedPermissionIds,
		mapPermissionsCatalog,
		buildFormPreviewStatuses
	} from '$lib/stores/role-management/permissions-mapper';
	import { createRole, RoleNameConflictError } from '$lib/stores/role-management/roles-api';
	import { Pencil } from '$lib/assets/icons';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let creating = $state(false);

	const catalog = $derived(mapPermissionsCatalog(data?.permissionModules));

	const modules = $derived(
		catalog.modules.map((mod) => ({
			name: mod.name,
			icon: mod.icon,
			...buildFormPreviewStatuses(
				roleFormStore.permissions[mod.id],
				catalog.optionsByModule[mod.id]
			)
		}))
	);

	onMount(() => {
		if (!roleFormStore.isValid) {
			goto(resolve('/merchant/role-management/create-role'));
		}
	});

	async function handleConfirm() {
		if (creating) return;

		if (!roleFormStore.isValid) {
			const nameError = roleFormStore.validationErrors.name;
			toast.error(nameError ?? 'Could not create role', {
				description: nameError
					? 'Please go back and choose a different role name.'
					: 'Fill in the role details and select at least one permission.'
			});
			goto(resolve('/merchant/role-management/create-role'));
			return;
		}

		const permissions = collectSelectedPermissionIds(
			roleFormStore.permissions,
			catalog.optionsByModule
		);

		if (permissions.length === 0) {
			toast.error('Select at least one permission');
			return;
		}

		creating = true;
		try {
			const result = await createRole(
				{
					roleName: roleFormStore.name.trim(),
					description: roleFormStore.description.trim(),
					permissions
				},
				'merchant'
			);

			toast.success(result.message);
			roleFormStore.reset();
			goto(resolve('/merchant/role-management'));
		} catch (e) {
			if (e instanceof RoleNameConflictError) {
				toast.error(e.message, {
					description: 'Please go back and choose a different role name.'
				});
				goto(resolve('/merchant/role-management/create-role'));
				return;
			}
			toast.error('Could not create role', {
				description: e instanceof Error ? e.message : 'Something went wrong'
			});
		} finally {
			creating = false;
		}
	}
</script>

<div class="m-auto w-full space-y-6 md:w-[75%]">
	<!-- Header -->
	<div class="flex flex-wrap items-start justify-between gap-4">
		<div class="flex flex-wrap items-center gap-3">
			<h1 class="text-2xl font-bold text-foreground">
				{roleFormStore.name || 'Untitled role'}
			</h1>
			<Chip variant="outline" class="border-primary/40 bg-primary/10 text-primary">Preview</Chip>
		</div>
		<div class="flex items-center gap-2">
			<Button
				variant="outline"
				size="sm"
				disabled={creating}
				onclick={() => goto(resolve('/merchant/role-management/create-role'))}
			>
				<Pencil class="h-4 w-4" />
				Edit
			</Button>
			<Button disabled={creating} onclick={handleConfirm}>
				{creating ? 'Creating…' : 'Confirm & create'}
			</Button>
		</div>
	</div>

	<!-- Role detail -->
	<div class="rounded-xl border border-border bg-card shadow">
		<div class="border-b border-border px-5 py-4">
			<h2 class="text-sm font-semibold text-foreground">Role detail</h2>
		</div>
		<div class="divide-y divide-border">
			<div class="flex items-start gap-4 px-5 py-3">
				<span class="w-36 shrink-0 text-sm text-muted-foreground">Role name</span>
				<span class="text-sm font-medium text-foreground">{roleFormStore.name || '—'}</span>
			</div>
			<div class="flex items-start gap-4 px-5 py-3">
				<span class="w-36 shrink-0 text-sm text-muted-foreground">Description</span>
				<span class="text-sm text-foreground">{roleFormStore.description || '—'}</span>
			</div>
		</div>
	</div>

	<!-- Access & permissions -->
	<AccessPreviewTable {modules} />
</div>
