<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
	import { Chip } from '$lib/components/reusable/index';
	import { Avatar } from '$lib/components/ui/avatar';
	import { PermissionDot } from '$lib/components/role-management';
	import { roleFormStore } from '$lib/stores/role-management/role-form.svelte';
	import { ROLE_MODULES, PERM_KEYS } from '$lib/stores/role-management/role-modules';
	import type { PermissionsState } from '$lib/stores/role-management/role-management';
	import {
		Pencil,
		Trash2,
		Users,
		Wallet,
		UserPlus,
		Building2,
		Handshake,
		ShieldCheck,
		CreditCard,
		BriefcaseBusiness
	} from '$lib/assets/icons';
	import type { PermModule, AssignedUser } from '$lib/stores/role-management/role-management';

	const modules: PermModule[] = [
		{
			name: 'Gateway wallet management',
			icon: Wallet,
			read: 'granted',
			writeUnrestricted: 'granted',
			writeRestricted: 'granted',
			delete: 'denied',
			approve: 'granted'
		},
		{
			name: 'Onboarding',
			icon: UserPlus,
			read: 'granted',
			writeUnrestricted: 'granted',
			writeRestricted: 'denied',
			delete: 'denied',
			approve: 'granted'
		},
		{
			name: 'Organization management',
			icon: Building2,
			read: 'granted',
			writeUnrestricted: 'granted',
			writeRestricted: 'granted',
			delete: 'denied',
			approve: 'denied'
		},
		{
			name: 'Organization wallet management',
			icon: Wallet,
			read: 'granted',
			writeUnrestricted: 'granted',
			writeRestricted: 'granted',
			delete: 'granted',
			approve: 'granted'
		},
		{
			name: 'Partner settlements',
			icon: Handshake,
			read: 'granted',
			writeUnrestricted: 'denied',
			writeRestricted: 'granted',
			delete: 'denied',
			approve: 'granted'
		},
		{
			name: 'Role management',
			icon: ShieldCheck,
			read: 'granted',
			writeUnrestricted: 'granted',
			writeRestricted: 'granted',
			delete: 'granted',
			approve: 'granted'
		},
		{
			name: 'PayIn transactions',
			icon: CreditCard,
			read: 'granted',
			writeUnrestricted: 'denied',
			writeRestricted: 'denied',
			delete: 'denied',
			approve: 'granted'
		},
		{
			name: 'Payout service',
			icon: BriefcaseBusiness,
			read: 'granted',
			writeUnrestricted: 'granted',
			writeRestricted: 'granted',
			delete: 'denied',
			approve: 'granted'
		},
		{
			name: 'User management',
			icon: Users,
			read: 'granted',
			writeUnrestricted: 'granted',
			writeRestricted: 'granted',
			delete: 'granted',
			approve: 'denied'
		}
	];

	const assignedUsers: AssignedUser[] = [
		{
			id: '1',
			name: 'Aarav Mehta',
			email: 'Arav12@gmail.com',
			initials: 'AM',
			color: 'bg-violet-500'
		},
		{
			id: '2',
			name: 'Priya Shah',
			email: 'Priya56@gmail.com',
			initials: 'PS',
			color: 'bg-pink-500'
		},
		{
			id: '3',
			name: 'Daniel Cole',
			email: 'Danial.Cole@gmail.com',
			initials: 'DC',
			color: 'bg-amber-500'
		}
	];

	// const roleType = 'System Default' as RoleType;
	// const isDefaultRole = roleType === 'Default' || roleType === 'System Default';
	const isDefaultRole = false;

	const permColumns = [
		{ key: 'read', label: 'Read' },
		{ key: 'writeUnrestricted', label: 'Write\n(unrestricted)' },
		{ key: 'writeRestricted', label: 'Write\n(restricted)' },
		{ key: 'delete', label: 'Delete' },
		{ key: 'approve', label: 'Approve' }
	] as const;

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
		// Match by trimmed, lowercased name so trailing spaces / casing don't break it
		for (const viewMod of modules) {
			const normalized = viewMod.name.trim().toLowerCase();
			const def = ROLE_MODULES.find((m) => m.name.trim().toLowerCase() === normalized);
			if (def) {
				for (const key of PERM_KEYS) {
					perms[def.id][key] = viewMod[key] === 'granted';
				}
			}
		}
		roleFormStore.loadForEdit('Super Admin', 'System default administrator role', perms);
		goto(resolve('/management/role-management/edit-role'));
	}
</script>

<div class="space-y-6">
	<!-- Page header -->
	<div class="flex flex-wrap items-start justify-between gap-4">
		<div>
			<div class="mb-1 flex flex-wrap items-center gap-2">
				<h1 class="text-2xl font-bold text-foreground">Super Admin</h1>
				<Chip variant="outline" class="border-border shadow text-muted-foreground"
					>System Default</Chip
				>
			</div>
			<div class="flex items-center gap-1.5 text-sm text-muted-foreground">
				<Users class="h-4 w-4" />
				<span>{assignedUsers.length} assigned</span>
			</div>
		</div>

		<div class="flex items-center gap-2">
			<Button
				variant="outline"
				size="sm"
				class="shadow"
				onclick={handleEdit}
				disabled={isDefaultRole}
			>
				<Pencil class="h-4 w-4" />
				Edit role
			</Button>
			<Button
				variant="destructive"
				size="sm"
				class="shadow"
				onclick={() => {}}
				disabled={isDefaultRole}
			>
				<Trash2 class="h-4 w-4" />
				Delete
			</Button>
		</div>
	</div>

	<!-- Role detail -->
	<div class="rounded-xl border border-border bg-card p-5 shadow">
		<h2 class="mb-4 text-sm font-semibold text-foreground">Role Description</h2>
		<div class="min-h-24 rounded-lg border border-border bg-background/50 p-4">
			<p class="text-sm text-muted-foreground">About the role</p>
		</div>
	</div>

	<!-- Access & permissions -->
	<div class="rounded-xl border border-border bg-card p-5 shadow">
		<div class="mb-4">
			<h2 class="text-sm font-semibold text-foreground">Access &amp; permissions</h2>
		</div>

		<div class="overflow-x-auto">
			<table class="w-full min-w-160">
				<!-- Column headers -->
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
										<mod.icon class="h-4 w-4 " />
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
			<p class="text-xs text-muted-foreground">{assignedUsers.length} total</p>
		</div>

		<div class="divide-y divide-border">
			{#each assignedUsers as user (user.id)}
				<div class="flex items-center justify-between py-3">
					<div class="flex items-center gap-3">
						<Avatar class="h-9 w-9">
							<Avatar class="text-xs font-semibold">
								{user.initials}
							</Avatar>
						</Avatar>
						<span class="text-sm font-medium text-foreground">{user.name}</span>
					</div>
					<span class="text-sm text-muted-foreground">{user.email}</span>
				</div>
			{/each}
		</div>
	</div>
</div>
