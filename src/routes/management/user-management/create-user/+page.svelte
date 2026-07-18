<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { Button, Input } from '$lib/components/reusable';
	import { RolesReportingPanel } from '$lib/components/user-management';
	import { createUserFormStore } from '$lib/stores/user-management/user-form.svelte';
	import { fetchUsers } from '$lib/stores/user-management/users-api';
	import type { UserItem } from '$lib/stores/user-management/user-management';

	let managers = $state<UserItem[]>([]);

	onMount(() => {
		loadManagers();
	});

	async function loadManagers() {
		const data = await fetchUsers({ status: 'Active' });
		managers = data.items;
	}
</script>

<div class="space-y-6 w-full md:w-[75%] m-auto">
	<div>
		<h1 class="text-2xl font-bold text-foreground">Create User</h1>
		<p class="mt-1 text-sm text-muted-foreground">Please enter the user's details below</p>
	</div>

	<div class="rounded-xl border border-border bg-card p-5 shadow">
		<h2 class="mb-5 text-sm font-semibold text-foreground">User detail</h2>

		<div class="space-y-4">
			<div class="space-y-1.5">
				<label for="email-id" class="text-sm font-medium text-foreground">
					Email ID <span class="text-destructive">*</span>
				</label>
				<Input
					id="email-id"
					type="email"
					placeholder="Enter Email ID"
					class="shadow"
					bind:value={createUserFormStore.email}
				/>
			</div>

			<div class="grid gap-4 sm:grid-cols-2">
				<div class="space-y-1.5">
					<label for="first-name" class="text-sm font-medium text-foreground">
						First Name <span class="text-destructive">*</span>
					</label>
					<Input
						id="first-name"
						placeholder="Enter First Name"
						class="shadow"
						bind:value={createUserFormStore.firstName}
					/>
				</div>

				<div class="space-y-1.5">
					<label for="last-name" class="text-sm font-medium text-foreground">Last Name</label>
					<Input
						id="last-name"
						placeholder="Enter Last Name"
						class="shadow"
						bind:value={createUserFormStore.lastName}
					/>
				</div>
			</div>

			<div class="grid gap-4 sm:grid-cols-2">
				<div class="space-y-1.5">
					<label for="employee-id" class="text-sm font-medium text-foreground">Employee ID</label>
					<Input
						id="employee-id"
						placeholder="Enter Employee ID"
						class="shadow"
						bind:value={createUserFormStore.employeeId}
					/>
				</div>

				<div class="space-y-1.5">
					<label for="mobile-number" class="text-sm font-medium text-foreground">
						Mobile Number
					</label>
					<div
						class="flex h-9 overflow-hidden rounded-md border border-input bg-background shadow-xs transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50"
					>
						<span
							class="flex items-center border-r border-border bg-muted/40 px-3 text-sm text-muted-foreground"
						>
							+91
						</span>
						<Input
							id="mobile-number"
							type="tel"
							inputmode="numeric"
							placeholder=""
							class="border-0 shadow-none focus-visible:ring-0"
							bind:value={createUserFormStore.mobileNumber}
						/>
					</div>
				</div>
			</div>
		</div>
	</div>

	<RolesReportingPanel {managers} />

	<div class="flex justify-end gap-2">
		<Button variant="outline" onclick={() => createUserFormStore.clear()}>Clear</Button>
		<Button
			disabled={!createUserFormStore.isValid}
			onclick={() => goto(resolve('/management/user-management/create-user/preview'))}
		>
			Preview
		</Button>
	</div>
</div>
