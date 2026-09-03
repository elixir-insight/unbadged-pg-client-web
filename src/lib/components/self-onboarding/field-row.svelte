<script lang="ts">
	import { Input } from '$lib/components/reusable';
	import { AlertCircle, CheckCircle2, LockIcon } from '$lib/assets/icons';
	import { cn } from '$lib/utils';

	let {
		label,
		value = $bindable(''),
		locked = false,
		forceEdit = false,
		monospace = false,
		placeholder = '',
		type = 'text',
		maxlength,
		required = false,
		remark = '',
		verifiedHint = '',
		oncommit
	}: {
		label: string;
		value?: string;
		locked?: boolean;
		forceEdit?: boolean;
		monospace?: boolean;
		placeholder?: string;
		type?: 'text' | 'email' | 'tel' | 'url';
		maxlength?: number;
		required?: boolean;
		remark?: string;
		verifiedHint?: string;
		oncommit?: (next: string) => void;
	} = $props();

	const fieldId = $props.id();
	const readOnly = $derived(locked && !forceEdit);

	function commit() {
		oncommit?.(value);
	}
</script>

<label class="block min-w-0 space-y-1">
	<span class="text-sm font-medium text-primary">
		{label}
		{#if required}
			<span class="text-destructive">*</span>
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
		<Input
			id={fieldId}
			class={cn(monospace && 'font-mono tracking-wide')}
			{type}
			{placeholder}
			{maxlength}
			bind:value
			onblur={commit}
			aria-label={label}
		/>
	{/if}
	{#if verifiedHint}
		<p class="flex items-center gap-1 text-xs text-success">
			<CheckCircle2 class="size-3.5 shrink-0" />
			{verifiedHint}
		</p>
	{/if}
	{#if remark}
		<p class="flex items-start gap-1.5 text-xs text-warning">
			<AlertCircle class="mt-0.5 size-3.5 shrink-0" />
			<span class="min-w-0">
				<span class="block font-semibold">Management Remark</span>
				<span class="block">{remark}</span>
			</span>
		</p>
	{/if}
</label>
