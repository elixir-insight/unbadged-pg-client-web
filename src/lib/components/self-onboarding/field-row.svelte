<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { Input } from '$lib/components/reusable';
	import { AlertCircle, CheckCircle2, Eye, EyeOff, LockIcon } from '$lib/assets/icons';
	import { onboarding } from '$lib/stores/onboarding.svelte';
	import { cn } from '$lib/utils';
	import { getFieldRemark } from '$lib/utils/remarkRouting';

	let {
		label,
		value = $bindable(''),
		locked = false,
		forceEdit = false,
		monospace = false,
		secret = false,
		blockPaste = false,
		placeholder = '',
		type = 'text',
		maxlength,
		inputmode,
		autocomplete,
		required = false,
		optional = false,
		remark = '',
		remarkKey = '',
		error = '',
		showErrors = false,
		hint = '',
		verifiedHint = '',
		normalize,
		oninput,
		oncommit
	}: {
		label: string;
		value?: string;
		locked?: boolean;
		forceEdit?: boolean;
		monospace?: boolean;
		/** Masks the value with a show/hide toggle (account numbers). */
		secret?: boolean;
		blockPaste?: boolean;
		placeholder?: string;
		type?: 'text' | 'email' | 'tel' | 'url';
		maxlength?: number;
		inputmode?: HTMLInputAttributes['inputmode'];
		autocomplete?: HTMLInputAttributes['autocomplete'];
		required?: boolean;
		/** Appends "(optional)" next to the label. */
		optional?: boolean;
		remark?: string;
		/** `verifications` key: pulls the management remark and highlights the field on "Fix this". */
		remarkKey?: string;
		/** Validation message; only rendered while `showErrors` is true. */
		error?: string;
		/** Set once the parent form has attempted a submit, so errors don't appear before that. */
		showErrors?: boolean;
		hint?: string;
		verifiedHint?: string;
		/** Applied on every keystroke, e.g. strip characters and upper-case a PAN. */
		normalize?: (next: string) => string;
		/** Called with the normalized value on every keystroke. */
		oninput?: (next: string) => void;
		/** Called with the value when the field loses focus. */
		oncommit?: (next: string) => void;
	} = $props();

	const fieldId = $props.id();
	let revealed = $state(false);

	const readOnly = $derived(locked && !forceEdit);
	const remarkText = $derived(
		remark || (remarkKey ? getFieldRemark(onboarding.verifications, remarkKey) : '')
	);
	const highlighted = $derived(Boolean(remarkKey) && onboarding.focusField === remarkKey);
	/** A backend save error routed to this field (see navigation.ts routeSaveError). */
	const savedError = $derived(
		remarkKey && onboarding.fieldSaveError?.key === remarkKey
			? onboarding.fieldSaveError.message
			: ''
	);
	const shownError = $derived((showErrors ? error : '') || savedError);

	function handleInput(event: Event & { currentTarget: HTMLInputElement }) {
		const raw = event.currentTarget.value;
		const next = normalize ? normalize(raw) : raw;
		if (next !== raw) event.currentTarget.value = next;
		value = next;
		if (savedError) onboarding.clearFieldSaveError();
		oninput?.(next);
	}

	function handleBlur() {
		oncommit?.(value);
	}
</script>

<label
	class={cn(
		'block min-w-0 space-y-1.5',
		(remarkText || highlighted) &&
			'rounded-lg ring-2 ring-warning/40 ring-offset-2 ring-offset-background'
	)}
	data-remark-field={remarkKey || undefined}
>
	<span class="text-sm font-medium text-foreground">
		{label}
		{#if required}
			<span class="text-destructive">*</span>
		{:else if optional}
			<span class="text-muted-foreground">(optional)</span>
		{/if}
	</span>
	{#if readOnly}
		<div
			id={fieldId}
			class={cn(
				'flex h-9 items-center gap-2 rounded-md bg-muted px-2.5 text-sm text-muted-foreground',
				monospace && 'font-mono tracking-wide'
			)}
			aria-readonly="true"
		>
			<LockIcon class="size-3.5 shrink-0" />
			<span class="min-w-0 truncate">{value || '—'}</span>
		</div>
	{:else}
		<div class="relative">
			<Input
				id={fieldId}
				class={cn(
					monospace && 'font-mono tracking-wide',
					secret && 'pr-10',
					secret && !revealed && '[-webkit-text-security:disc]'
				)}
				{type}
				{placeholder}
				{maxlength}
				{inputmode}
				{autocomplete}
				{value}
				aria-label={label}
				aria-invalid={Boolean(shownError)}
				oninput={handleInput}
				onblur={handleBlur}
				onpaste={blockPaste ? (event) => event.preventDefault() : undefined}
			/>
			{#if secret}
				<button
					type="button"
					class="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
					aria-label={revealed ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
					onclick={() => (revealed = !revealed)}
				>
					{#if revealed}
						<EyeOff class="size-4" />
					{:else}
						<Eye class="size-4" />
					{/if}
				</button>
			{/if}
		</div>
	{/if}
	{#if shownError}
		<p class="text-xs text-destructive">{shownError}</p>
	{:else if hint}
		<p class="text-xs text-muted-foreground">{hint}</p>
	{/if}
	{#if verifiedHint}
		<p class="flex items-center gap-1 text-xs text-success">
			<CheckCircle2 class="size-3.5 shrink-0" />
			{verifiedHint}
		</p>
	{/if}
	{#if remarkText}
		<p class="flex items-start gap-1.5 text-xs text-warning">
			<AlertCircle class="mt-0.5 size-3.5 shrink-0" />
			<span class="min-w-0">
				<span class="block font-semibold">Management Remark</span>
				<span class="block">{remarkText}</span>
			</span>
		</p>
	{/if}
</label>
