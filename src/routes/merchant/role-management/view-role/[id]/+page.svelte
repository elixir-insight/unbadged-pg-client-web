<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
	import { Chip } from '$lib/components/reusable/index';
	import { Avatar } from '$lib/components/reusable';
	import { AccessPreviewTable } from '$lib/components/role-management';
	import { roleFormStore } from '$lib/stores/role-management/role-form.svelte';
	import {
		MERCHANT_MODULE_PERMISSION_IDS,
		MERCHANT_ROLE_MODULES
	} from '$lib/stores/role-management/merchant-role-modules';
	import type { PermissionsState, PermStatus } from '$lib/stores/role-management/role-management';
	import { Pencil, Trash2, Users } from '$lib/assets/icons';
	import { page } from '$app/state';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const { role } = $derived(data);

	const grantedIds = $derived(new Set(role.permissions.map((p) => p.id)));

	const displayName = $derived(
		role.roleInfo.roleName
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
		MERCHANT_ROLE_MODULES.map((mod) => {
			const permIds = MERCHANT_MODULE_PERMISSION_IDS[mod.id] ?? {};
			const perms = Object.fromEntries(
				apiPermCols.map((col) => {
					const permId = permIds[col.apiName];
					const status: PermStatus =
						permId !== undefined && grantedIds.has(permId) ? 'granted' : 'denied';
					return [col.key, status];
				})
			) as Record<(typeof apiPermCols)[number]['key'], PermStatus>;
			return { name: mod.name, icon: mod.icon, ...perms };
		})
	);

	const isDefaultRole = $derived(role.roleInfo.defaultRole);

	const description = $derived((page.state as { description?: string }).description ?? '');

	function handleEdit() {
		const perms: PermissionsState = {};
		for (const mod of MERCHANT_ROLE_MODULES) {
			perms[mod.id] = {
				read: false,
				writeUnrestricted: false,
				writeRestricted: false,
				delete: false,
				approve: false,
				fullAccess: false
			};
		}
		for (const mod of MERCHANT_ROLE_MODULES) {
			const permIds = MERCHANT_MODULE_PERMISSION_IDS[mod.id] ?? {};
			for (const col of apiPermCols) {
				const permId = permIds[col.apiName];
				if (permId !== undefined) {
					perms[mod.id][col.key] = grantedIds.has(permId);
				}
			}
		}
		roleFormStore.loadForEdit(role.roleInfo.roleId, role.roleInfo.roleName, description, perms);
		goto(
			resolve('/merchant/role-management/edit-role/[id]', {
				id: String(role.roleInfo.roleId)
			})
		);
	}
</script>

<div class="m-auto w-full space-y-6 md:w-[75%]">
	<div class="flex flex-wrap items-start justify-between gap-4">
		<div>
			<div class="mb-1 flex flex-wrap items-center gap-2">
				<h1 class="text-2xl font-bold text-foreground">{displayName}</h1>
				<Chip
					variant="outline"
					class={isDefaultRole
						? 'border-amber-500/30 bg-amber-500/10 text-amber-500 shadow'
						: 'border-border text-muted-foreground shadow'}
				>
					{isDefaultRole ? 'Default' : 'Custom'}
				</Chip>
			</div>
			<div class="flex items-center gap-1.5 text-sm text-muted-foreground">
				<Users class="h-4 w-4" />
				<span>{role.users.length} assigned</span>
			</div>
		</div>

		<div class="flex items-center gap-2">
			<Button variant="outline" size="sm" onclick={handleEdit} disabled={isDefaultRole}>
				<Pencil class="h-4 w-4" />
				Edit role
			</Button>
			<Button
				variant="destructive"
				size="sm"
				onclick={() => {}}
				disabled={isDefaultRole || role.users.length > 0}
			>
				<Trash2 class="h-4 w-4" />
				Delete
			</Button>
		</div>
	</div>

	<div class="rounded-xl border border-border bg-card p-5 shadow">
		<h2 class="mb-4 text-sm font-semibold text-foreground">Role Description</h2>
		<div class="min-h-24 rounded-lg border border-border bg-background/50 p-4">
			<p class="text-sm text-muted-foreground">
				{description || 'No description provided.'}
			</p>
		</div>
	</div>

	<AccessPreviewTable {modules} />

	<div class="rounded-xl border border-border bg-card p-5 shadow">
		<div class="mb-4">
			<h2 class="text-sm font-semibold text-foreground">Assigned users</h2>
			<p class="text-xs text-muted-foreground">{role.users.length} total</p>
		</div>

		<div class="divide-y divide-border">
			{#each role.users as user (user.email)}
				<div class="flex items-center justify-between py-3">
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
