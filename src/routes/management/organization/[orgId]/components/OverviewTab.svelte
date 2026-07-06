<script lang="ts">
	import type { DetailRow, ContactDetail } from '../types';
	import {
		LockIcon,
		Building2,
		MailIcon,
		PhoneIcon,
		MapPin,
		ArrowRight,
		User
	} from '$lib/assets/icons';

	interface Props {
		orgRows: DetailRow[];
		contact: ContactDetail;
		country: string;
	}

	const { orgRows, contact, country }: Props = $props();

	const orgInfoLabels = new Set(['Legal name', 'Organization ID', 'Category', 'Industry']);
	const adminLabels = new Set(['Country', 'Assigned admin', 'Created on', 'Last updated']);

	const orgInfoRows = $derived(orgRows.filter((r) => orgInfoLabels.has(r.label)));
	const adminRows = $derived(orgRows.filter((r) => adminLabels.has(r.label)));

	const contactRows = $derived([
		{ label: 'Contact name', value: contact.name },
		{ label: 'Role', value: contact.role },
		{ label: 'Email', value: contact.email },
		{ label: 'Phone', value: contact.phone },
		{ label: 'Timezone', value: contact.timezone }
	]);
</script>

<div class="space-y-5">
	<!-- Read-only notice -->
	<div
		class="flex items-center gap-3 rounded-lg border border-info/40 bg-info/10 px-4 py-3 shadow-sm"
	>
		<div class="mt-0.5 flex size-6 items-center justify-center rounded-full bg-info/20">
			<LockIcon class="size-3.5 text-info" />
		</div>

		<p class="text-sm font-medium text-info">
			This information is managed by the system and cannot be edited.
		</p>
	</div>

	<!-- Contact quick-links -->
	<div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
		<!-- Email -->
		<a
			href="mailto:{contact.email}"
			class="group relative flex items-center gap-3 overflow-hidden rounded-xl border border-border/60
			       bg-card px-4 py-3 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
		>
			<div
				class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary
				       transition-transform duration-200 group-hover:scale-110"
			>
				<MailIcon class="size-4" />
			</div>
			<div class="min-w-0 flex-1">
				<p class="text-xs text-muted-foreground">Email</p>
				<p class="truncate text-sm font-semibold">{contact.email}</p>
			</div>
			<ArrowRight
				class="size-3.5 shrink-0 text-muted-foreground/35 transition-transform duration-200 group-hover:translate-x-0.5"
			/>
		</a>

		<!-- Phone -->
		<a
			href="tel:{contact.phone}"
			class="group relative flex items-center gap-3 overflow-hidden rounded-xl border border-border/60
			       bg-card px-4 py-3 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
		>
			<div
				class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success
				       transition-transform duration-200 group-hover:scale-110"
			>
				<PhoneIcon class="size-4" />
			</div>
			<div class="flex-1">
				<p class="text-xs text-muted-foreground">Phone</p>
				<p class="text-sm font-semibold">{contact.phone}</p>
			</div>
			<ArrowRight
				class="size-3.5 shrink-0 text-muted-foreground/35 transition-transform duration-200 group-hover:translate-x-0.5"
			/>
		</a>

		<!-- Country -->
		<a
			href="https://www.google.com/maps/place/{encodeURIComponent(country)}"
			target="_blank"
			rel="noopener noreferrer"
			class="group relative flex items-center gap-3 overflow-hidden rounded-xl border border-border/60
			       bg-card px-4 py-3 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
		>
			<div
				class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-info/10 text-info
				       transition-transform duration-200 group-hover:scale-110"
			>
				<MapPin class="size-4" />
			</div>
			<div class="flex-1">
				<p class="text-xs text-muted-foreground">Country</p>
				<p class="text-sm font-semibold">{country}</p>
			</div>
			<ArrowRight
				class="size-3.5 shrink-0 text-muted-foreground/35 transition-transform duration-200 group-hover:translate-x-0.5"
			/>
		</a>
	</div>

	<!-- Info cards grid -->
	<div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
		<!-- Organization Information -->
		<div class="overflow-hidden rounded-xl border border-border/60 bg-card shadow-xs">
			<div class="flex items-center gap-2.5 border-b border-border/40 bg-muted/20 px-4 py-3">
				<div class="flex size-6 items-center justify-center rounded-md bg-muted/50">
					<Building2 class="size-3.5 text-muted-foreground/60" />
				</div>
				<p class="text-xs font-semibold tracking-wider text-muted-foreground/70 uppercase">
					Organization
				</p>
				<LockIcon class="ml-auto size-3 shrink-0 text-muted-foreground/35" />
			</div>
			<div class="divide-y divide-border/25 px-4">
				{#each orgInfoRows as row (row.label)}
					<div class="flex items-center justify-between gap-4 py-3">
						<span class="text-xs text-muted-foreground/65">{row.label}</span>
						<span class="text-right text-sm font-medium">{row.value}</span>
					</div>
				{/each}
			</div>
		</div>

		<!-- Contact Information -->
		<div class="overflow-hidden rounded-xl border border-border/60 bg-card shadow-xs">
			<div class="flex items-center gap-2.5 border-b border-border/40 bg-muted/20 px-4 py-3">
				<div class="flex size-6 items-center justify-center rounded-md bg-muted/50">
					<MailIcon class="size-3.5 text-muted-foreground/60" />
				</div>
				<p class="text-xs font-semibold tracking-wider text-muted-foreground/70 uppercase">
					Contact
				</p>
				<LockIcon class="ml-auto size-3 shrink-0 text-muted-foreground/35" />
			</div>
			<div class="divide-y divide-border/25 px-4">
				{#each contactRows as row (row.label)}
					<div class="flex items-center justify-between gap-4 py-3">
						<span class="shrink-0 text-xs text-muted-foreground/65">{row.label}</span>
						<span class="min-w-0 truncate text-right text-sm font-medium">{row.value}</span>
					</div>
				{/each}
			</div>
		</div>

		<!-- Administration -->
		<div class="overflow-hidden rounded-xl border border-border/60 bg-card shadow-xs">
			<div class="flex items-center gap-2.5 border-b border-border/40 bg-muted/20 px-4 py-3">
				<div class="flex size-6 items-center justify-center rounded-md bg-muted/50">
					<User class="size-3.5 text-muted-foreground/60" />
				</div>
				<p class="text-xs font-semibold tracking-wider text-muted-foreground/70 uppercase">
					Administration
				</p>
				<LockIcon class="ml-auto size-3 shrink-0 text-muted-foreground/35" />
			</div>
			<div class="divide-y divide-border/25 px-4">
				{#each adminRows as row (row.label)}
					<div class="flex items-center justify-between gap-4 py-3">
						<span class="shrink-0 text-xs text-muted-foreground/65">{row.label}</span>
						<span class="text-right text-sm font-medium">{row.value}</span>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>
