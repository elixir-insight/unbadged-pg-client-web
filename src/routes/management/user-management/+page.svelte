<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { createUrlPagination, Dropdown, Search } from '$lib/components/reusable';
	import { UserCard } from '$lib/components/user-management';
	import { Plus } from '$lib/assets/icons';
	import { userFormStore } from '$lib/stores/user-form.svelte';
	import { createUserFormStore } from '$lib/stores/user-management/user-form.svelte';
	import { fetchUsers } from '$lib/stores/user-management/users-api';
	import type { UserItem } from '$lib/stores/user-management/user-management';
	import { debounce } from '$lib/utils/debounce';

	const pagination = createUrlPagination();

	const ALL_STATUS = 'all';
	const ALL_ROLES = 'all';

	const statusOptions = [
		{ value: ALL_STATUS, label: 'All Status' },
		{ value: 'Active', label: 'Active' },
		{ value: 'Invited', label: 'Invited' }
	];

	let users = $state<UserItem[]>([]);
	let availableRoles = $state<string[]>([]);
	let loading = $state(false);
	let selectedId = $state<string | null>(null);

	const searchInput = $derived(pagination.search);
	const statusFilter = $derived(pagination.status || ALL_STATUS);
	const roleFilter = $derived(pagination.role || ALL_ROLES);

	const roleOptions = $derived([
		{ value: ALL_ROLES, label: 'All Roles' },
		...availableRoles.map((role) => ({
			value: role,
			label: role
		}))
	]);

	async function loadUsers(search: string, status: string, role: string) {
		loading = true;

		try {
			const data = await fetchUsers({
				search,
				status,
				role,
				page: Math.floor(pagination.skip / pagination.limit),
				limit: pagination.limit
			});
			users = data.items;
			availableRoles = data.meta.roles;
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		loadUsers(pagination.search, pagination.status, pagination.role);
	});

	const debouncedSearch = debounce((value: string) => {
		pagination.setSearch(value);
	}, 300);

	function handleSearchInput(value: string) {
		debouncedSearch(value);
	}

	function selectUser(user: UserItem) {
		selectedId = user.id;
		userFormStore.setViewUser(user);
		goto(resolve('/management/user-management/view-user/[id]', { id: user.id }));
	}
</script>

<div class="space-y-6">
	<div>
		<h1 class="text-2xl font-bold text-foreground">User management</h1>
		<p class="mt-1 text-sm text-muted-foreground">
			Manage user accounts, roles, and access across your organization.
		</p>
	</div>

	<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
		<Search
			value={searchInput}
			oninput={(e) => handleSearchInput((e.currentTarget as HTMLInputElement).value)}
			placeholder="Search by User Name / Employee ID"
			variant="bordered"
			class="max-w-sm flex-1"
		/>

		<Dropdown
			value={statusFilter}
			onValueChange={(value) => pagination.setStatus(value === ALL_STATUS ? '' : value)}
			options={statusOptions}
			placeholder="All Status"
			bordered
			class="w-full sm:w-44"
		/>

		<Dropdown
			value={roleFilter}
			onValueChange={(value) => pagination.setRole(value === ALL_ROLES ? '' : value)}
			options={roleOptions}
			placeholder="All Roles"
			bordered
			search
			class="w-full sm:w-64"
		/>
	</div>

	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
		<button
			class="group flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-primary/60 bg-card p-6 shadow transition-all duration-200 hover:bg-primary/5"
			onclick={() => {
				userFormStore.reset();
				createUserFormStore.reset();
				goto(resolve('/management/user-management/create-user'));
			}}
		>
			<div
				class="flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-primary/40 bg-primary/10 shadow transition-colors"
			>
				<Plus class="h-5 w-5 text-primary transition-colors" />
			</div>
			<span class="text-sm font-medium text-foreground transition-colors">Add user</span>
		</button>

		{#each users as user (user.id)}
			<UserCard {user} selected={selectedId === user.id} onclick={() => selectUser(user)} />
		{/each}
	</div>

	{#if loading && users.length === 0}
		<p class="py-8 text-center text-sm text-muted-foreground">Loading users…</p>
	{:else if !loading && users.length === 0}
		<div class="py-12 text-center text-sm text-muted-foreground">
			No users found
			{#if searchInput || statusFilter !== ALL_STATUS || roleFilter !== ALL_ROLES}
				matching your filters.
			{:else}
				.
			{/if}
		</div>
	{/if}
</div>
