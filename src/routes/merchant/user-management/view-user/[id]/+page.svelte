<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Pencil, Trash2 } from '$lib/assets/icons';
	import { UserDetailProfile } from '$lib/components/user-management';
	import { buildUserOverviewFields } from '$lib/components/user-management/user-overview-fields';
	import { Button, Modal, Tooltip } from '$lib/components/reusable';
	import { userFormStore } from '$lib/stores/user-form.svelte';
	import { createUserFormStore } from '$lib/stores/user-management/user-form.svelte';
	import { formatPhoneDisplay } from '$lib/stores/user-management/user-mapper';
	import { deleteUser } from '$lib/stores/user-management/users-api';
	import { toast } from 'svelte-sonner';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const user = $derived(data.user);

	let deleteOpen = $state(false);
	let deleting = $state(false);

	$effect(() => {
		userFormStore.setViewUser(user);
	});

	const hasAssignedReports = $derived((user.assignedUsersCount ?? 0) > 0);
	const deleteDisabledReason = $derived(
		hasAssignedReports
			? 'This user has people reporting to them. Reassign those users before deleting.'
			: null
	);

	const overviewFields = $derived(
		buildUserOverviewFields({
			email: user.email,
			mobileNumber: user.mobileNumber,
			employeeId: user.employeeId,
			reportingManager: user.reportingManager
		})
	);

	const phoneDisplay = $derived(formatPhoneDisplay(user.mobileNumber));

	function handleEdit() {
		createUserFormStore.loadForEdit(user);
		goto(resolve('/merchant/user-management/edit-user/[id]', { id: user.id }));
	}

	async function confirmDelete() {
		if (deleting || hasAssignedReports) return;

		deleting = true;
		try {
			const result = await deleteUser(user.id);
			toast.success(result.message);
			deleteOpen = false;
			goto(resolve('/merchant/user-management'));
		} catch (e) {
			toast.error('Could not delete user', {
				description: e instanceof Error ? e.message : 'Something went wrong'
			});
		} finally {
			deleting = false;
		}
	}

	function getInitials(name: string): string {
		const parts = name.trim().split(/\s+/).filter(Boolean);
		if (parts.length >= 2) {
			return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
		}
		return (parts[0]?.charAt(0) ?? '?').toUpperCase();
	}
</script>

<UserDetailProfile
	name={user.name}
	email={user.email}
	employeeId={user.employeeId}
	{phoneDisplay}
	status={user.status}
	roles={user.roles ?? []}
	{overviewFields}
	initials={getInitials(user.name)}
>
	{#snippet actions()}
		{#if deleteDisabledReason}
			<Tooltip content={deleteDisabledReason}>
				<Button variant="destructive" class="gap-2" disabled>
					<Trash2 class="h-4 w-4" />
					Delete
				</Button>
			</Tooltip>
		{:else}
			<Button variant="destructive" class="gap-2" onclick={() => (deleteOpen = true)}>
				<Trash2 class="h-4 w-4" />
				Delete
			</Button>
		{/if}
		<Button variant="outline" class="gap-2" onclick={handleEdit}>
			<Pencil class="h-4 w-4" />
			Edit
		</Button>
	{/snippet}
</UserDetailProfile>

<Modal
	bind:open={deleteOpen}
	title="Delete user"
	description="Are you sure you want to delete {user.name}? This action cannot be undone."
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
				{deleting ? 'Deleting…' : 'Delete user'}
			</Button>
		</div>
	{/snippet}
</Modal>
