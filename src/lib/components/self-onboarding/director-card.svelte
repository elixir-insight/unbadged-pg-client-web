<script lang="ts">
	import { Button, PhoneInput } from '$lib/components/reusable';
	import { Chip } from '$lib/components/ui/badge';
	import { Trash2 } from '$lib/assets/icons';
	import type { Director } from '$lib/types/onboarding';
	import { normalizeAadhar, normalizePanInput } from '$lib/validation/organization-kyb';
	import FieldGrid from './field-grid.svelte';
	import FieldRow from './field-row.svelte';
	import { isValidAadhaar, isValidEmail, isValidPan, isValidPhone } from './validation';

	let {
		director,
		index,
		onupdate,
		onremove
	}: {
		director: Director;
		index: number;
		onupdate: (index: number, patch: Partial<Director>) => void;
		onremove: (index: number) => void;
	} = $props();

	const phoneInvalid = $derived(director.phone.length > 0 && !isValidPhone(director.phone));
</script>

<div class="rounded-xl border border-border p-4">
	<div class="mb-4 flex items-center justify-between gap-3">
		<p class="text-sm font-medium">{director.name || `Director ${index + 1}`}</p>
		<Button
			variant="ghost"
			size="icon-sm"
			class="text-destructive hover:bg-destructive/10 hover:text-destructive"
			aria-label={`Remove director ${index + 1}`}
			onclick={() => onremove(index)}
		>
			<Trash2 class="size-4" />
		</Button>
	</div>

	<FieldGrid>
		<FieldRow
			label="Name"
			required
			value={director.name}
			forceEdit
			error={director.name.trim() ? '' : 'Name is required.'}
			oninput={(next) => onupdate(index, { name: next })}
		/>
		<FieldRow
			label="PAN"
			required
			monospace
			maxlength={10}
			value={director.pan}
			normalize={normalizePanInput}
			error={isValidPan(director.pan) ? '' : 'Enter a valid 10-character PAN.'}
			oninput={(next) => onupdate(index, { pan: next })}
		/>
		<FieldRow
			label="Aadhaar"
			required
			monospace
			maxlength={12}
			inputmode="numeric"
			value={director.aadhaar}
			normalize={normalizeAadhar}
			error={isValidAadhaar(director.aadhaar) ? '' : 'Enter a valid 12-digit Aadhaar number.'}
			oninput={(next) => onupdate(index, { aadhaar: next })}
		/>
		<FieldRow
			label="Email"
			required
			type="email"
			value={director.email}
			error={isValidEmail(director.email) ? '' : 'Enter a valid email address.'}
			oninput={(next) => onupdate(index, { email: next })}
		/>
		<label class="block min-w-0 space-y-1.5">
			<span class="text-sm font-medium text-foreground">
				Phone <span class="text-destructive">*</span>
			</span>
			<PhoneInput
				value={director.phone}
				invalid={phoneInvalid}
				onValueChange={(next) => onupdate(index, { phone: next })}
			/>
			{#if phoneInvalid}
				<p class="text-xs text-destructive">Enter a valid 10-digit mobile number.</p>
			{/if}
		</label>
	</FieldGrid>

	<div
		class="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-border px-3 py-2.5"
	>
		<div class="min-w-0">
			<p class="text-sm font-medium">Director documents</p>
			<p class="text-xs text-muted-foreground">
				{director.id === undefined
					? 'Save directors to enable document upload.'
					: 'Document upload is coming soon.'}
			</p>
		</div>
		<div class="flex items-center gap-2">
			{#if director.id !== undefined}
				<Chip variant="outline">Coming soon</Chip>
			{/if}
			<Button variant="outline" size="sm" disabled>Upload</Button>
		</div>
	</div>
</div>
