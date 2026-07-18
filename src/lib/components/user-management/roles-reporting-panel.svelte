<script lang="ts">
	import { Chip } from '$lib/components/reusable';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Search } from '$lib/components/reusable';
	import { cn } from '$lib/utils';
	import { Shield, ShieldCheck, User } from '$lib/assets/icons';
	import { ASSIGNABLE_ROLES } from '$lib/stores/user-management/assignable-roles';
	import { createUserFormStore } from '$lib/stores/user-management/user-form.svelte';
	import type { UserItem } from '$lib/stores/user-management/user-management';

	let {
		managers = [] as UserItem[],
		errors = {} as Record<string, string>
	}: {
		managers?: UserItem[];
		errors?: Record<string, string>;
	} = $props();

	let activeTab = $state<'roles' | 'reporting'>('roles');
	let managerSearch = $state('');

	const selectedRoleCount = $derived(createUserFormStore.selectedRoleCount);
	const statusSummary = $derived(createUserFormStore.statusSummary);

	const filteredManagers = $derived(
		managers.filter((manager) => {
			const query = managerSearch.trim().toLowerCase();
			if (!query) return true;
			return (
				manager.name.toLowerCase().includes(query) ||
				manager.employeeId.toLowerCase().includes(query) ||
				manager.email.toLowerCase().includes(query)
			);
		})
	);

	function selectManager(manager: UserItem) {
		if (createUserFormStore.reportingManagerId === manager.id) {
			createUserFormStore.clearReportingManager();
			return;
		}
		createUserFormStore.setReportingManager(
			manager.id,
			manager.name,
			manager.employeeId,
			manager.email
		);
	}
</script>

<div class="rounded-xl border border-border bg-card shadow">
	<div class="border-b border-border px-5 py-4">
		<h2 class="text-sm font-semibold text-foreground">Roles & Reporting</h2>
		<p class="mt-1 text-xs text-muted-foreground">{statusSummary}</p>
	</div>

	<div class="flex" style="height: 420px;">
		<div class="w-56 shrink-0 overflow-y-auto border-r border-border">
			<button
				type="button"
				class={cn(
					'flex w-full items-center gap-3 border-l-2 px-4 py-3 text-left text-sm transition-colors hover:bg-accent/60',
					activeTab === 'roles'
						? 'border-primary bg-accent/60 text-foreground'
						: 'border-transparent text-muted-foreground'
				)}
				onclick={() => (activeTab = 'roles')}
			>
				<div
					class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"
				>
					<Shield class="h-4 w-4" />
				</div>
				<span class="min-w-0 flex-1">Roles</span>
				{#if selectedRoleCount > 0}
					<Chip class="h-5 shrink-0 rounded-full px-1.5 text-xs">{selectedRoleCount}</Chip>
				{/if}
			</button>

			<button
				type="button"
				class={cn(
					'flex w-full items-center gap-3 border-l-2 px-4 py-3 text-left text-sm transition-colors hover:bg-accent/60',
					activeTab === 'reporting'
						? 'border-primary bg-accent/60 text-foreground'
						: 'border-transparent text-muted-foreground'
				)}
				onclick={() => (activeTab = 'reporting')}
			>
				<div
					class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"
				>
					<User class="h-4 w-4" />
				</div>
				<span>Reporting to</span>
			</button>
		</div>

		<div class="flex-1 overflow-y-auto p-5">
			{#if activeTab === 'roles'}
				<div class="mb-5">
					<p class="text-sm font-semibold text-foreground">Roles</p>
					<p class="text-xs text-muted-foreground">
						Select the roles to assign to this user
						{#if selectedRoleCount > 0}
							· {selectedRoleCount} selected
						{/if}
					</p>
				</div>

				<div class="flex flex-col gap-2">
					{#each ASSIGNABLE_ROLES as role (role)}
						<button
							type="button"
							class="flex cursor-pointer items-center justify-between rounded-lg border-2 border-border/60 px-4 py-3 text-left transition-all hover:border-primary hover:bg-accent/40 focus-visible:border-primary focus-visible:outline-none"
							onclick={() => createUserFormStore.toggleRole(role)}
						>
							<div class="flex min-w-0 items-center gap-2.5 text-sm text-foreground">
								<ShieldCheck class="h-3.5 w-3.5 shrink-0" />
								<span class="truncate">{role}</span>
							</div>
							<div class="pointer-events-none shrink-0">
								<Checkbox checked={createUserFormStore.selectedRoles.includes(role)} />
							</div>
						</button>
					{/each}
				</div>
				{#if errors.selectedRoles}
					<p class="mt-3 text-xs text-destructive">{errors.selectedRoles}</p>
				{/if}
			{:else}
				<div class="mb-5">
					<p class="text-sm font-semibold text-foreground">Reporting to</p>
					<p class="text-xs text-muted-foreground">Select the manager this user reports to</p>
				</div>

				<div class="mb-4">
					<Search
						bind:value={managerSearch}
						placeholder="Search managers"
						variant="bordered"
						class="max-w-md"
					/>
				</div>

				<div class="flex flex-col gap-2">
					{#each filteredManagers as manager (manager.id)}
						<button
							type="button"
							class={cn(
								'flex cursor-pointer items-center justify-between rounded-lg border-2 px-4 py-3 text-left transition-all hover:border-primary hover:bg-accent/40 focus-visible:border-primary focus-visible:outline-none',
								createUserFormStore.reportingManagerId === manager.id
									? 'border-primary bg-accent/40'
									: 'border-border/60'
							)}
							onclick={() => selectManager(manager)}
						>
							<div class="min-w-0">
								<p class="truncate text-sm font-medium text-foreground">{manager.name}</p>
								<p class="truncate text-xs text-muted-foreground">
									{manager.employeeId} · {manager.email}
								</p>
							</div>
							<div class="pointer-events-none shrink-0">
								<Checkbox checked={createUserFormStore.reportingManagerId === manager.id} />
							</div>
						</button>
					{/each}

					{#if filteredManagers.length === 0}
						<p class="py-8 text-center text-sm text-muted-foreground">No managers found.</p>
					{/if}
				</div>
				{#if errors.reportingManager}
					<p class="mt-3 text-xs text-destructive">{errors.reportingManager}</p>
				{/if}
			{/if}
		</div>
	</div>
</div>
