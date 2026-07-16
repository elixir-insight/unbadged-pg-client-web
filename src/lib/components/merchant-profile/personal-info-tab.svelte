<script lang="ts">
	import { Avatar, Input, Chip } from '$lib/components/reusable';
	import { Pencil } from '$lib/assets/icons';
	import { statusVariant, statusLabel, type MerchantProfileData } from './mock-data';
	import InfoCard from './info-card.svelte';

	let { profile }: { profile: MerchantProfileData } = $props();

	const fullName = $derived(`${profile.personal.firstName} ${profile.personal.lastName}`);
</script>

<InfoCard title="Personal Information" description="Your personal account details">
	<div class="flex flex-col gap-8">
		<!-- Avatar with edit overlay -->
		<div class="flex items-center gap-4">
			<div class="relative inline-block">
				<Avatar name={fullName} size="lg" shape="circle" />
				<button
					type="button"
					aria-label="Change profile photo"
					class="absolute -right-1 -bottom-1 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-background transition-colors hover:bg-primary/90"
				>
					<Pencil class="size-3" />
				</button>
			</div>
			<div>
				<p class="text-sm font-semibold text-foreground">{fullName}</p>
				<p class="text-sm text-muted-foreground">Update your photo</p>
			</div>
		</div>

		<!-- Two-column field grid -->
		<div class="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
			<div class="flex flex-col gap-1.5">
				<label
					class="text-xs font-medium tracking-wide text-muted-foreground/70 uppercase"
					for="first-name"
				>
					First Name
				</label>
				<Input id="first-name" value={profile.personal.firstName} disabled />
			</div>

			<div class="flex flex-col gap-1.5">
				<label
					class="text-xs font-medium tracking-wide text-muted-foreground/70 uppercase"
					for="last-name"
				>
					Last Name
				</label>
				<Input id="last-name" value={profile.personal.lastName} disabled />
			</div>

			<div class="flex flex-col gap-1.5">
				<label
					class="text-xs font-medium tracking-wide text-muted-foreground/70 uppercase"
					for="email"
				>
					Email Address
				</label>
				<Input id="email" value={profile.personal.email} disabled />
			</div>

			<div class="flex flex-col gap-1.5">
				<label
					class="text-xs font-medium tracking-wide text-muted-foreground/70 uppercase"
					for="mobile"
				>
					Mobile Number
				</label>
				<Input id="mobile" value={profile.personal.mobile} disabled />
			</div>

			<div class="flex flex-col gap-1.5">
				<label
					class="text-xs font-medium tracking-wide text-muted-foreground/70 uppercase"
					for="merchant-id"
				>
					Merchant ID
				</label>
				<Input id="merchant-id" value={profile.personal.merchantId} disabled class="font-mono" />
			</div>

			<div class="flex flex-col gap-1.5">
				<span class="text-xs font-medium tracking-wide text-muted-foreground/70 uppercase">
					Account Status
				</span>
				<div class="flex h-9 items-center">
					<Chip variant={statusVariant(profile.personal.accountStatus)}>
						{statusLabel(profile.personal.accountStatus)}
					</Chip>
				</div>
			</div>
		</div>
	</div>
</InfoCard>
