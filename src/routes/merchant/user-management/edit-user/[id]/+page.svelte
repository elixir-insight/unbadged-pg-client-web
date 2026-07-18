<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { toast } from 'svelte-sonner';
	import { Button, Input } from '$lib/components/reusable';
	import { RolesReportingPanel } from '$lib/components/user-management';
	import { createUserFormStore } from '$lib/stores/user-management/user-form.svelte';
	import { firstValidationError } from '$lib/stores/user-management/validation';
	import { fetchUserById, fetchUsers } from '$lib/stores/user-management/users-api';
	import type { UserItem } from '$lib/stores/user-management/user-management';
	import { cn } from '$lib/utils';

	let managers = $state<UserItem[]>([]);
	let loading = $state(true);
	let submitAttempted = $state(false);

	const userId = $derived(page.params.id);
	const errors = $derived(submitAttempted ? createUserFormStore.validationErrors : {});

	$effect(() => {
		const id = userId;
		if (!id) {
			loading = false;
			goto(resolve('/merchant/user-management'));
			return;
		}

		if (createUserFormStore.isEditMode && createUserFormStore.userId === id) {
			loading = false;
			loadManagers(id);
			return;
		}

		let cancelled = false;
		loading = true;

		fetchUserById(id)
			.then((detail) => {
				if (cancelled) return;
				if (!detail) {
					goto(resolve('/merchant/user-management'));
					return;
				}
				createUserFormStore.loadForEdit(detail);
				loadManagers(id);
			})
			.finally(() => {
				if (!cancelled) loading = false;
			});

		return () => {
			cancelled = true;
		};
	});

	async function loadManagers(currentUserId: string) {
		const data = await fetchUsers({ status: 'Active', limit: 100 });
		managers = data.items.filter((manager) => manager.id !== currentUserId);
	}

	function goToPreview() {
		submitAttempted = true;
		const validationError = firstValidationError(createUserFormStore.validationErrors);
		if (validationError) {
			toast.error('Could not preview user', { description: validationError });
			return;
		}

		if (!userId) return;
		goto(resolve('/merchant/user-management/edit-user/[id]/preview', { id: userId }));
	}
</script>

{#if loading}
	<p class="py-12 text-center text-sm text-muted-foreground">Loading user details…</p>
{:else}
	<div class="m-auto w-full space-y-6 md:w-[75%]">
		<div class="flex flex-wrap items-start justify-between gap-4">
			<div>
				<h1 class="text-2xl font-bold text-foreground">Edit User</h1>
				<p class="mt-1 text-sm text-muted-foreground">Update the user's details below</p>
			</div>
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
						class={cn(
							'shadow',
							errors.email && 'border-destructive focus-visible:ring-destructive/30'
						)}
						bind:value={createUserFormStore.email}
					/>
					{#if errors.email}
						<p class="text-xs text-destructive">{errors.email}</p>
					{/if}
				</div>

				<div class="grid gap-4 sm:grid-cols-2">
					<div class="space-y-1.5">
						<label for="first-name" class="text-sm font-medium text-foreground">
							First Name <span class="text-destructive">*</span>
						</label>
						<Input
							id="first-name"
							placeholder="Enter First Name"
							class={cn(
								'shadow',
								errors.firstName && 'border-destructive focus-visible:ring-destructive/30'
							)}
							bind:value={createUserFormStore.firstName}
						/>
						{#if errors.firstName}
							<p class="text-xs text-destructive">{errors.firstName}</p>
						{/if}
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
						<label for="employee-id" class="text-sm font-medium text-foreground">
							Employee ID <span class="text-destructive">*</span>
						</label>
						<Input
							id="employee-id"
							placeholder="Enter Employee ID"
							class={cn(
								'shadow',
								errors.employeeId && 'border-destructive focus-visible:ring-destructive/30'
							)}
							bind:value={createUserFormStore.employeeId}
						/>
						{#if errors.employeeId}
							<p class="text-xs text-destructive">{errors.employeeId}</p>
						{/if}
					</div>

					<div class="space-y-1.5">
						<label for="mobile-number" class="text-sm font-medium text-foreground">
							Mobile Number <span class="text-destructive">*</span>
						</label>
						<div
							class={cn(
								'flex h-9 overflow-hidden rounded-md border border-input bg-background shadow-xs transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50',
								errors.mobileNumber && 'border-destructive focus-within:ring-destructive/30'
							)}
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
						{#if errors.mobileNumber}
							<p class="text-xs text-destructive">{errors.mobileNumber}</p>
						{/if}
					</div>
				</div>
			</div>
		</div>

		<RolesReportingPanel {managers} {errors} />

		<div class="flex justify-end gap-2">
			<Button variant="outline" onclick={() => createUserFormStore.restore()}>Reset</Button>
			<Button disabled={!createUserFormStore.hasChanges} onclick={goToPreview}>Preview</Button>
		</div>
	</div>
{/if}
