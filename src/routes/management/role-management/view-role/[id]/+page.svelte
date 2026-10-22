<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button';
	import { Chip, Modal, Tooltip } from '$lib/components/reusable/index';
	import { Avatar } from '$lib/components/reusable';
	import { AccessPreviewTable } from '$lib/components/role-management';
	import { roleFormStore } from '$lib/stores/role-management/role-form.svelte';
	import type { PermissionsState } from '$lib/stores/role-management/role-management';
	import {
		mapPermissionsCatalog,
		collectSelectedPermissionIds,
		buildGrantedPreviewStatuses
	} from '$lib/stores/role-management/permissions-mapper';
	import { deleteRole } from '$lib/stores/role-management/roles-api';
	import { Pencil, Trash2, Users } from '$lib/assets/icons';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const { role } = $derived(data);
	const catalog = $derived(mapPermissionsCatalog(data?.permissionModules));

	let deleteOpen = $state(false);
	let deleting = $state(false);

	const grantedIds = $derived(new Set((role?.permissions ?? []).map((p) => p.id)));

	const displayName = $derived(
		(role?.roleInfo?.roleName ?? '')
			.split('_')
			.map((w: string) => w.charAt(0) + w.slice(1).toLowerCase())
			.join(' ')
	);

	const apiPermCols = [
		{ key: 'read', apiName: 'read' },
		{ key: 'writeUnrestricted', apiName: 'write' },
		{ key: 'writeRestricted', apiName: 'write-restricted' },
		{ key: 'delete', apiName: 'delete' },
		{ key: 'approve', apiName: 'approve' }
	] as const;

	const modules = $derived(
		catalog.modules.map((mod) => {
			const statuses = buildGrantedPreviewStatuses(catalog.permissionIds[mod.id], grantedIds);
			return { name: mod.name, icon: mod.icon, ...statuses };
		})
	);

	const isDefaultRole = $derived(role?.roleInfo?.defaultRole ?? false);
	const hasAssignedUsers = $derived((role?.users?.length ?? 0) > 0);

	const editDisabledReason = $derived(isDefaultRole ? 'Default roles cannot be edited.' : null);

	const deleteDisabledReason = $derived(
		isDefaultRole
			? 'Default roles cannot be deleted.'
			: hasAssignedUsers
				? 'Remove all assigned users before deleting this role.'
				: null
	);

	const description = $derived(role?.roleInfo?.description ?? '');

	function handleEdit() {
		roleFormStore.configureCatalog(
			catalog.modules.map((m) => m.id),
			catalog.optionsByModule
		);

		const perms: PermissionsState = {};
		for (const mod of catalog.modules) {
			perms[mod.id] = {
				read: false,
				writeUnrestricted: false,
				writeRestricted: false,
				delete: false,
				approve: false,
				fullAccess: false
			};
		}
		for (const mod of catalog.modules) {
			const permIds = catalog.permissionIds[mod.id] ?? {};
			for (const col of apiPermCols) {
				const permId = permIds[col.apiName];
				if (permId !== undefined) {
					perms[mod.id][col.key] = grantedIds.has(permId);
				}
			}
		}
		roleFormStore.loadForEdit(
			role?.roleInfo?.roleId ?? 0,
			role?.roleInfo?.roleName ?? '',
			description,
			perms,
			collectSelectedPermissionIds(perms, catalog.optionsByModule)
		);
		goto(
			resolve('/management/role-management/edit-role/[id]', {
				id: String(role?.roleInfo?.roleId ?? '')
			})
		);
	}

	async function confirmDelete() {
		if (deleting || deleteDisabledReason) return;

		const roleId = role?.roleInfo?.roleId;
		if (roleId == null) return;

		deleting = true;
		try {
			const result = await deleteRole(roleId, 'management');
			toast.success(result.message);
			deleteOpen = false;
			goto(resolve('/management/role-management'));
		} catch (e) {
			toast.error('Could not delete role', {
				description: e instanceof Error ? e.message : 'Something went wrong'
			});
		} finally {
			deleting = false;
		}
	}
</script>

<div class="m-auto w-full space-y-6 md:w-[75%]">
	<!-- Page header -->
	<div class="flex flex-wrap items-start justify-between gap-4">
		<div>
			<div class="mb-1 flex flex-wrap items-center gap-2">
				<h1 class="text-2xl font-bold text-foreground">{displayName}</h1>
				<Chip
					variant="outline"
					class={isDefaultRole
						? 'border-warning/30 bg-warning/10 text-warning shadow'
						: 'border-border text-muted-foreground shadow'}
				>
					{isDefaultRole ? 'Default' : 'Custom'}
				</Chip>
			</div>
			<p class="flex items-center gap-1.5 text-sm text-muted-foreground">
				<Users class="h-3.5 w-3.5" />
				{role?.roleInfo?.roleAssignedCount ?? 0} users assigned
			</p>
		</div>

		<div class="flex items-center gap-2">
			{#if editDisabledReason}
				<Tooltip content={editDisabledReason}>
					<Button variant="outline" size="sm" disabled>
						<Pencil class="h-4 w-4" />
						Edit role
					</Button>
				</Tooltip>
			{:else}
				<Button variant="outline" size="sm" onclick={handleEdit}>
					<Pencil class="h-4 w-4" />
					Edit role
				</Button>
			{/if}

			{#if deleteDisabledReason}
				<Tooltip content={deleteDisabledReason}>
					<Button variant="destructive" size="sm" disabled>
						<Trash2 class="h-4 w-4" />
						Delete
					</Button>
				</Tooltip>
			{:else}
				<Button variant="destructive" size="sm" onclick={() => (deleteOpen = true)}>
					<Trash2 class="h-4 w-4" />
					Delete
				</Button>
			{/if}
		</div>
	</div>

	<!-- Role detail -->
	<div class="rounded-xl border border-border bg-card p-5 shadow">
		<h2 class="mb-4 text-sm font-semibold text-foreground">Role Description</h2>
		<div class="min-h-24 rounded-lg border border-border bg-background/50 p-4">
			<p class="text-sm text-muted-foreground">
				{description || 'No description provided.'}
			</p>
		</div>
	</div>

	<!-- Access & permissions -->
	<AccessPreviewTable {modules} />

	<!-- Assigned users -->
	<div class="rounded-xl border border-border bg-card p-5 shadow">
		<div class="mb-4">
			<h2 class="text-sm font-semibold text-foreground">Assigned users</h2>
			<p class="text-xs text-muted-foreground">{role?.users?.length ?? 0} total</p>
		</div>

		<div class="divide-y divide-border">
			{#each role?.users ?? [] as user (user.email)}
				<div class="flex items-center justify-between gap-3 py-3">
					<div class="flex items-center gap-3">
						<Avatar name={user?.userName} size="default" shape="circle" />
						<span class="text-sm text-foreground">{user?.userName}</span>
					</div>
					<span class="text-sm text-muted-foreground">{user.email}</span>
				</div>
			{/each}
		</div>
	</div>
</div>

<Modal
	bind:open={deleteOpen}
	title="Delete role"
	description="Are you sure you want to delete {displayName}? This action cannot be undone."
>
	{#snippet footer()}
		<div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
			<Button
				variant="outline"
				class="w-full sm:w-auto"
				disabled={deleting}
				onclick={() => (deleteOpen = false)}
			>
				Cancel
			</Button>
			<Button
				variant="destructive"
				class="w-full sm:w-auto"
				disabled={deleting}
				onclick={confirmDelete}
			>
				{deleting ? 'Deleting…' : 'Delete role'}
			</Button>
		</div>
	{/snippet}
</Modal>
