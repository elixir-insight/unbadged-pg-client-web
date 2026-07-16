<script lang="ts">
	import { Tabs } from '$lib/components/reusable';
	import type { TabItem } from '$lib/components/reusable';
	import { User, Briefcase } from '$lib/assets/icons';
	import {
		merchantProfile,
		ProfileSummaryCard,
		PersonalInfoTab,
		BusinessInfoTab
	} from '$lib/components/merchant-profile';

	let activeTab = $state('personal');

	const tabs: TabItem[] = [
		{
			value: 'personal',
			label: 'Personal Information',
			icon: User,
			content: personalTab
		},
		{
			value: 'business',
			label: 'Business Information',
			icon: Briefcase,
			content: businessTab
		}
	];

	// function handleEditProfile() {
	// 	toast.info('Edit profile', { description: 'Profile editing is coming soon.' });
	// }
</script>

{#snippet personalTab()}
	<PersonalInfoTab profile={merchantProfile} />
{/snippet}

{#snippet businessTab()}
	<BusinessInfoTab profile={merchantProfile} />
{/snippet}

<div class="flex flex-col gap-6">
	<!-- Page header -->
	<!-- <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
		<div>
			<h1 class="text-[32px] leading-tight font-bold tracking-tight text-foreground">
				Merchant Profile
			</h1>
			<p class="mt-1 text-sm text-muted-foreground">
				View and manage your personal and business information.
			</p>
		</div>
		<Button onclick={handleEditProfile}>
			<Pencil class="size-4" />
			Edit Profile
		</Button>
	</div> -->

	<!-- Profile summary card -->
	<ProfileSummaryCard profile={merchantProfile} />

	<!-- Tabs -->
	<Tabs {tabs} bind:value={activeTab} variant="line" />
</div>
