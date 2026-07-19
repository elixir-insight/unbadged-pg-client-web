<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
	import { Chip } from '$lib/components/reusable/index';
	import { Avatar } from '$lib/components/reusable';
	import { PermissionDot } from '$lib/components/role-management';
	import { roleFormStore } from '$lib/stores/role-management/role-form.svelte';
	import { ROLE_MODULES, MODULE_PERMISSION_IDS } from '$lib/stores/role-management/role-modules';
	import type { PermissionsState, PermStatus } from '$lib/stores/role-management/role-management';
	import { Pencil, Trash2, Users } from '$lib/assets/icons';
	import { page } from '$app/state';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const { role } = data;

	// Build a Set of granted permission IDs for O(1) lookup
	const grantedIds = $derived(new Set(role.permissions.map((p) => p.id)));

	// Format SCREAMING_SNAKE_CASE → Title Case
	const displayName = $derived(
		role.roleInfo.roleName
			.split('_')
			.map((w: string) => w.charAt(0) + w.slice(1).toLowerCase())
			.join(' ')
	);

	const permColumns = [
		{ key: 'read', apiName: 'read', label: 'Read' },
		{ key: 'writeUnrestricted', apiName: 'write', label: 'Write\n(unrestricted)' },
		{ key: 'writeRestricted', apiName: 'write-restricted', label: 'Write\n(restricted)' },
		{ key: 'delete', apiName: 'delete', label: 'Delete' },
		{ key: 'approve', apiName: 'approve', label: 'Approve' }
	] as const;

	const modules = $derived(
		ROLE_MODULES.map((mod) => {
			const permIds = MODULE_PERMISSION_IDS[mod.id] ?? {};
			const perms = Object.fromEntries(
				permColumns.map((col) => {
					const permId = permIds[col.apiName];
					const status: PermStatus =
						permId !== undefined && grantedIds.has(permId) ? 'granted' : 'denied';
					return [col.key, status];
				})
			) as Record<(typeof permColumns)[number]['key'], PermStatus>;
			return { name: mod.name, icon: mod.icon, ...perms };
		})
	);

	const isDefaultRole = $derived(role.roleInfo.defaultRole);

	// Description is passed from the list page via goto() state
	const description = $derived((page.state as { description?: string }).description ?? '');

	function handleEdit() {
		const perms: PermissionsState = {};
		for (const mod of ROLE_MODULES) {
			perms[mod.id] = {
				read: false,
				writeUnrestricted: false,
				writeRestricted: false,
				delete: false,
				approve: false,
				fullAccess: false
			};
		}
		for (const mod of ROLE_MODULES) {
			const permIds = MODULE_PERMISSION_IDS[mod.id] ?? {};
			for (const col of permColumns) {
				const permId = permIds[col.apiName];
				if (permId !== undefined) {
					perms[mod.id][col.key] = grantedIds.has(permId);
				}
			}
		}
		roleFormStore.loadForEdit(role.roleInfo.roleName, description, perms);
		goto(resolve('/management/role-management/edit-role'));
	}
</script>

<div class="space-y-6">
	<!-- Page header -->
	<div class="flex flex-wrap items-start justify-between gap-4">
		<div>
			<div class="mb-1 flex flex-wrap items-center gap-2">
				<h1 class="text-2xl font-bold text-foreground">{displayName}</h1>
				<Chip
					variant="outline"
					class={isDefaultRole
						? 'border-amber-500/30 bg-amber-500/10 text-amber-500 shadow'
						: 'border-border shadow text-muted-foreground'}
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
			<Button variant="destructive" size="sm" onclick={() => {}} disabled={isDefaultRole}>
				<Trash2 class="h-4 w-4" />
				Delete
			</Button>
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
	<div class="rounded-xl border border-border bg-card p-5 shadow">
		<div class="mb-4">
			<h2 class="text-sm font-semibold text-foreground">Access &amp; permissions</h2>
		</div>

		<div class="overflow-x-auto">
			<table class="w-full min-w-160">
				<thead>
					<tr>
						<th class="w-60 pb-3 text-left"></th>
						{#each permColumns as col (col.key)}
							<th class="min-w-20 pb-3 text-center text-xs font-medium text-muted-foreground">
								{#each col.label.split('\n') as line, i (i)}
									{#if i > 0}<br />{/if}{line}
								{/each}
							</th>
						{/each}
					</tr>
				</thead>
				<tbody class="divide-y divide-border">
					{#each modules as mod (mod.name)}
						<tr>
							<td class="py-3 pr-4">
								<div class="flex items-center gap-3">
									<div
										class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground shadow"
									>
										<mod.icon class="h-4 w-4" />
									</div>
									<span class="text-sm text-foreground">{mod.name}</span>
								</div>
							</td>
							{#each permColumns as col (col.key)}
								<td class="py-3 text-center">
									<div class="flex justify-center">
										<PermissionDot status={mod[col.key]} />
									</div>
								</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>

	<!-- Assigned users -->
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
