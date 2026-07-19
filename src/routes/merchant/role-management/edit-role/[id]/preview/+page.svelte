<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import { Chip } from '$lib/components/reusable';
	import { AccessPreviewTable } from '$lib/components/role-management';
	import { roleFormStore } from '$lib/stores/role-management/role-form.svelte';
	import type { PermStatus } from '$lib/stores/role-management/role-management';
	import { mapPermissionsCatalog } from '$lib/stores/role-management/permissions-mapper';
	import { Pencil } from '$lib/assets/icons';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const roleId = $derived(page.params.id ?? String(roleFormStore.roleId ?? ''));
	const catalog = $derived(mapPermissionsCatalog(data?.permissionModules));

	$effect(() => {
		if (!roleFormStore.isEditMode || roleFormStore.roleId === null) {
			goto(resolve('/merchant/role-management'));
		}
	});

	const modules = $derived(
		catalog.modules.map((mod) => {
			const perms = roleFormStore.permissions[mod.id];
			return {
				name: mod.name,
				icon: mod.icon,
				read: (perms?.read ? 'granted' : 'denied') as PermStatus,
				writeUnrestricted: (perms?.writeUnrestricted ? 'granted' : 'denied') as PermStatus,
				writeRestricted: (perms?.writeRestricted ? 'granted' : 'denied') as PermStatus,
				delete: (perms?.delete ? 'granted' : 'denied') as PermStatus,
				approve: (perms?.approve ? 'granted' : 'denied') as PermStatus
			};
		})
	);

	function goToEdit() {
		if (!roleId) return;
		goto(resolve('/merchant/role-management/edit-role/[id]', { id: roleId }));
	}

	function handleConfirm() {
		const id = roleFormStore.roleId;
		roleFormStore.reset();
		goto(
			resolve('/merchant/role-management/view-role/[id]', {
				id: String(id)
			})
		);
	}
</script>

<div class="m-auto w-full space-y-6 md:w-[75%]">
	<div class="flex flex-wrap items-start justify-between gap-4">
		<div class="flex flex-wrap items-center gap-3">
			<h1 class="text-2xl font-bold text-foreground">
				{roleFormStore.name || 'Untitled role'}
			</h1>
			<Chip variant="outline" class="border-primary/40 bg-primary/10 text-primary">Preview</Chip>
		</div>
		<div class="flex items-center gap-2">
			<Button variant="outline" size="sm" onclick={goToEdit}>
				<Pencil class="h-4 w-4" />
				Edit
			</Button>
			<Button onclick={handleConfirm}>Confirm &amp; save</Button>
		</div>
	</div>

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

	<AccessPreviewTable {modules} />
</div>
