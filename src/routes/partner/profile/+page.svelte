<script lang="ts">
	import { invalidate } from '$app/navigation';
	import { navigating, page as pageState } from '$app/state';
	import { Input } from '$lib/components/ui/input';
	import { Button, toast } from '$lib/components/reusable';
	import type { PartnerProfile, PartnerProfileFieldErrors } from './types';
	import { savePartnerProfile } from './data';
	import { hasProfileFieldErrors, validateProfileFields } from './validation';

	let { data } = $props();

	let form = $state<PartnerProfile>({
		name: '',
		company: '',
		email: '',
		phone: '',
		website: '',
		city: ''
	});
	let fieldErrors = $state<PartnerProfileFieldErrors>({});
	let submitting = $state(false);

	const isLoading = $derived(
		navigating.to !== null && navigating.to.url.pathname === pageState.url.pathname
	);

	const initials = $derived(
		form.name
			.split(' ')
			.map((word) => word[0])
			.slice(0, 2)
			.join('')
			.toUpperCase()
	);

	$effect(() => {
		form = { ...data.profile };
		fieldErrors = {};
	});

	function setField<K extends keyof PartnerProfile>(key: K, value: PartnerProfile[K]) {
		form[key] = value;

		if (key === 'email' || key === 'phone' || key === 'website') {
			fieldErrors = { ...fieldErrors, [key]: undefined };
		}
	}

	function resetForm() {
		form = { ...data.profile };
		fieldErrors = {};
	}

	async function handleSave() {
		const errors = validateProfileFields(form);
		fieldErrors = errors;

		if (hasProfileFieldErrors(errors)) return;

		submitting = true;

		try {
			await savePartnerProfile(form);
			await invalidate('partner:profile');
			toast.success('Profile updated');
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Unable to save profile.');
		} finally {
			submitting = false;
		}
	}
</script>

<div class="space-y-6 p-6 sm:p-8 lg:p-4">
	<div>
		<h1 class="mt-1 text-2xl font-semibold text-foreground">Profile</h1>
		<p class="mt-1 text-sm text-muted-foreground">
			Manage your contact details and public partner information.
		</p>
	</div>

	<div class="rounded-lg border border-border bg-card">
		<div class="flex items-center gap-4 border-b border-border px-6 py-5">
			<div
				class="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground"
			>
				{initials}
			</div>
			<div class="min-w-0">
				<p class="truncate text-base font-semibold text-foreground">{form.name || 'Partner'}</p>
				<p class="truncate text-sm text-muted-foreground">{form.company || 'Channel partner'}</p>
			</div>
		</div>

		<form
			class="space-y-6 px-6 py-6"
			onsubmit={(event) => {
				event.preventDefault();
				handleSave();
			}}
		>
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div class="space-y-2">
					<label for="profile-name" class="text-sm font-medium text-foreground">Full name</label>
					<Input
						id="profile-name"
						value={form.name}
						oninput={(event) => setField('name', event.currentTarget.value)}
						placeholder="Your name"
						autocomplete="name"
						disabled={isLoading || submitting}
					/>
				</div>

				<div class="space-y-2">
					<label for="profile-company" class="text-sm font-medium text-foreground">Company</label>
					<Input
						id="profile-company"
						value={form.company}
						oninput={(event) => setField('company', event.currentTarget.value)}
						placeholder="Company name"
						autocomplete="organization"
						disabled={isLoading || submitting}
					/>
				</div>

				<div class="space-y-2">
					<label for="profile-email" class="text-sm font-medium text-foreground">Email</label>
					<Input
						id="profile-email"
						type="email"
						value={form.email}
						oninput={(event) => setField('email', event.currentTarget.value)}
						placeholder="name@example.com"
						autocomplete="email"
						disabled={isLoading || submitting}
						aria-invalid={fieldErrors.email ? true : undefined}
						aria-describedby={fieldErrors.email ? 'profile-email-error' : undefined}
					/>
					{#if fieldErrors.email}
						<p id="profile-email-error" class="text-sm text-destructive">{fieldErrors.email}</p>
					{/if}
				</div>

				<div class="space-y-2">
					<label for="profile-phone" class="text-sm font-medium text-foreground">Phone</label>
					<Input
						id="profile-phone"
						type="tel"
						value={form.phone}
						oninput={(event) => setField('phone', event.currentTarget.value)}
						placeholder="+91 98765 43210"
						autocomplete="tel"
						inputmode="tel"
						disabled={isLoading || submitting}
						aria-invalid={fieldErrors.phone ? true : undefined}
						aria-describedby={fieldErrors.phone ? 'profile-phone-error' : undefined}
					/>
					{#if fieldErrors.phone}
						<p id="profile-phone-error" class="text-sm text-destructive">{fieldErrors.phone}</p>
					{/if}
				</div>

				<div class="space-y-2">
					<label for="profile-website" class="text-sm font-medium text-foreground">Website</label>
					<Input
						id="profile-website"
						type="url"
						value={form.website}
						oninput={(event) => setField('website', event.currentTarget.value)}
						placeholder="https://example.com"
						autocomplete="url"
						disabled={isLoading || submitting}
						aria-invalid={fieldErrors.website ? true : undefined}
						aria-describedby={fieldErrors.website ? 'profile-website-error' : undefined}
					/>
					{#if fieldErrors.website}
						<p id="profile-website-error" class="text-sm text-destructive">{fieldErrors.website}</p>
					{/if}
				</div>

				<div class="space-y-2">
					<label for="profile-city" class="text-sm font-medium text-foreground">City</label>
					<Input
						id="profile-city"
						value={form.city}
						oninput={(event) => setField('city', event.currentTarget.value)}
						placeholder="City"
						autocomplete="address-level2"
						disabled={isLoading || submitting}
					/>
				</div>
			</div>

			<div class="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
				<Button
					type="button"
					variant="outline"
					onclick={resetForm}
					disabled={isLoading || submitting}
				>
					Reset
				</Button>
				<Button type="submit" disabled={isLoading || submitting}>
					{submitting ? 'Saving…' : 'Save changes'}
				</Button>
			</div>
		</form>
	</div>
</div>
