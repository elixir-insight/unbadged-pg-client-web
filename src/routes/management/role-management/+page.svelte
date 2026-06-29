<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Input } from '$lib/components/ui/input';
	import { RoleCard } from '$lib/components/role-management';
	import type { RoleItem } from '$lib/stores/role-management/role-management';
	import { Plus, Search } from '$lib/assets/icons';
	import { roleFormStore } from '$lib/stores/role-management/role-form.svelte';

	let searchQuery = $state('');
	let roles = $state<RoleItem[]>([]);
	let hasMore = $state(true);
	let loading = $state(false);
	let selectedId = $state<string | null>(null);
	let sentinel = $state<HTMLDivElement | null>(null);

	async function loadRoles(reset = false) {
		if (loading || (!hasMore && !reset)) return;
		loading = true;
		const params = new URLSearchParams({ q: searchQuery });

		try {
			const res = await fetch(`/api/roles?${params}`);
			const data: { items: RoleItem[] } = await res.json();

			roles = reset ? data.items : [...roles, ...data.items];
		} finally {
			loading = false;
		}
	}

	let searchTimer: ReturnType<typeof setTimeout>;
	function onSearch(e: Event) {
		searchQuery = (e.target as HTMLInputElement).value;
		clearTimeout(searchTimer);
		searchTimer = setTimeout(() => {
			hasMore = true;
			loadRoles(true);
		}, 300);
	}

	function selectRole(role: RoleItem) {
		selectedId = role.id;
		goto(resolve('/management/role-management/view-role'));
	}

	$effect(() => {
		loadRoles(true);
	});

	$effect(() => {
		if (!sentinel) return;
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && !loading && hasMore) {
					loadRoles();
				}
			},
			{ rootMargin: '200px' }
		);
		observer.observe(sentinel);
		return () => observer.disconnect();
	});
</script>

<div class="space-y-6">
	<!-- Page header -->
	<div>
		<h1 class="text-2xl font-bold text-foreground">Roles & Permissions</h1>
		<p class="mt-1 text-sm text-muted-foreground">
			Manage roles, permissions, and user assignments across your organization.
		</p>
	</div>

	<!-- Toolbar -->
	<div class="flex items-center justify-between gap-3">
		<div class="relative max-w-sm flex-1">
			<Search class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
			<Input
				type="search"
				placeholder="Search roles..."
				value={searchQuery}
				oninput={onSearch}
				class="pl-9"
			/>
		</div>
	</div>

	<!-- Grid -->
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
		<!-- Create New Role card -->
		<button
			class="group flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-card p-6 transition-all duration-200 border-primary/60 hover:bg-primary/5 shadow"
			onclick={() => {
				roleFormStore.reset();
				goto(resolve('/management/role-management/create-role'));
			}}
		>
			<div
				class="flex h-10 w-10 items-center justify-center rounded-full border border-dashed shadow transition-colors border-primary/40 bg-primary/10"
			>
				<Plus class="h-5 w-5 transition-colors text-primary" />
			</div>
			<span class="text-sm font-medium transition-colors text-foreground"> Create New Role </span>
		</button>

		<!-- Role cards -->
		{#each roles as role (role.id)}
			<RoleCard {role} selected={selectedId === role.id} onclick={() => selectRole(role)} />
		{/each}
	</div>

	<!-- Loading skeletons -->
	<!-- {#if loading}
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each [0, 1, 2] as i (i)}
				<div class="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
					<div class="flex items-start justify-between">
						<div class="h-10 w-10 animate-pulse rounded-lg bg-muted"></div>
						<div class="h-4 w-14 animate-pulse rounded-full bg-muted"></div>
					</div>
					<div class="h-4 w-32 animate-pulse rounded bg-muted"></div>
					<div class="space-y-1.5">
						<div class="h-3 w-full animate-pulse rounded bg-muted"></div>
						<div class="h-3 w-3/4 animate-pulse rounded bg-muted"></div>
					</div>
					<div class="mt-2 border-t border-border pt-3">
						<div class="h-3 w-24 animate-pulse rounded bg-muted"></div>
					</div>
				</div>
			{/each}
		</div>
	{/if} -->

	<!-- No results -->
	{#if !loading && roles.length === 0}
		<div class="py-12 text-center text-sm text-muted-foreground">
			No roles found matching "{searchQuery}".
		</div>
	{/if}

	<!-- Infinite scroll sentinel -->
	<div bind:this={sentinel} class="h-1"></div>
</div>
