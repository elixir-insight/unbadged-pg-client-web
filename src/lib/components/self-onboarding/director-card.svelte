<script lang="ts">
	import { Button, Input } from '$lib/components/reusable';
	import { Trash2 } from '$lib/assets/icons';
	import type { Director } from '$lib/types/onboarding';
	import { isValidPan } from './validation';

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

	const panInvalid = $derived(director.pan.length > 0 && !isValidPan(director.pan));
</script>

<div class="rounded-xl border border-border/60 p-4">
	<div class="mb-3 flex items-center justify-between gap-3">
		<div>
			<p class="text-sm font-medium">{director.name || `Director ${index + 1}`}</p>
			<p class="text-sm text-muted-foreground">Name and PAN are required to continue.</p>
		</div>
		<div class="flex flex-wrap items-center gap-2">
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
	</div>

	<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
		<label class="space-y-1">
			<span class="text-sm font-medium text-primary">Name</span>
			<Input
				id={`director-name-${index}`}
				value={director.name}
				oninput={(event) => onupdate(index, { name: event.currentTarget.value })}
			/>
		</label>
		<label class="space-y-1">
			<span class="text-sm font-medium text-primary">PAN</span>
			<Input
				id={`director-pan-${index}`}
				class="font-mono tracking-widest uppercase"
				value={director.pan}
				maxlength={10}
				aria-invalid={panInvalid}
				oninput={(event) =>
					onupdate(index, {
						pan: event.currentTarget.value
							.replace(/[^a-zA-Z0-9]/g, '')
							.toUpperCase()
							.slice(0, 10)
					})}
			/>
			{#if panInvalid}
				<p class="text-xs text-destructive">Enter a valid 10-character PAN.</p>
			{/if}
		</label>
		<label class="space-y-1">
			<span class="text-sm font-medium text-primary">DIN (optional)</span>
			<Input
				id={`director-din-${index}`}
				class="font-mono tracking-wide"
				value={director.din ?? ''}
				oninput={(event) => onupdate(index, { din: event.currentTarget.value })}
			/>
		</label>
		<label class="space-y-1">
			<span class="text-sm font-medium text-primary">Email (optional)</span>
			<Input
				id={`director-email-${index}`}
				type="email"
				value={director.email ?? ''}
				oninput={(event) => onupdate(index, { email: event.currentTarget.value })}
			/>
		</label>
		<label class="space-y-1">
			<span class="text-sm font-medium text-primary">Phone (optional)</span>
			<Input
				id={`director-phone-${index}`}
				type="tel"
				value={director.phone ?? ''}
				oninput={(event) => onupdate(index, { phone: event.currentTarget.value })}
			/>
		</label>
	</div>
</div>
