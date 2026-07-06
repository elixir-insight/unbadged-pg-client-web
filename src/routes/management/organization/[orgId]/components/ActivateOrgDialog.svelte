<script lang="ts">
	import { Button } from '$lib/components/reusable';
	import { XIcon, ShieldCheck, CheckCircle2, AlertCircle, Loader2 } from '$lib/assets/icons';
	import { fade, scale } from 'svelte/transition';
	import { backOut } from 'svelte/easing';

	interface Props {
		orgName: string;
		open: boolean;
		onclose: () => void;
		onconfirm: () => void | Promise<void>;
	}

	const { orgName, open, onclose, onconfirm }: Props = $props();

	let loading = $state(false);

	const checklist = [
		'KYB verification completed',
		'Documents verified',
		'Banking details confirmed',
		'Compliance checklist signed-off'
	];

	async function handleConfirm() {
		loading = true;
		try {
			await onconfirm();
			onclose();
		} catch {
			// handled in parent
		} finally {
			loading = false;
		}
	}

	function handleClose() {
		if (!loading) onclose();
	}
</script>

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4"
		role="dialog"
		aria-modal="true"
		aria-labelledby="activate-dialog-title"
		in:fade={{ duration: 150 }}
		out:fade={{ duration: 120 }}
	>
		<button
			type="button"
			class="absolute inset-0 cursor-default bg-black/60 backdrop-blur-sm"
			onclick={handleClose}
			aria-label="Close dialog"
			tabindex="-1"
			disabled={loading}
		></button>

		<div
			class="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-background shadow-2xl ring-1 ring-border"
			in:scale={{ start: 0.95, duration: 200, easing: backOut }}
			out:scale={{ start: 0.95, duration: 150 }}
		>
			<div class="relative overflow-hidden px-6 pt-6 pb-5">
				<div class="gradient-soft absolute inset-0 opacity-50"></div>
				<div class="gradient-primary absolute inset-y-0 left-0 w-0.5"></div>
				<div class="relative flex items-start justify-between gap-3">
					<div class="flex items-center gap-3">
						<div
							class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/20"
						>
							<ShieldCheck class="size-4.5" />
						</div>
						<div>
							<h2 id="activate-dialog-title" class="text-base font-semibold">
								Activate Organization
							</h2>
							<p class="mt-0.5 text-xs text-muted-foreground">Review checklist before confirming</p>
						</div>
					</div>
					<button
						type="button"
						onclick={handleClose}
						disabled={loading}
						aria-label="Close"
						class="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
					>
						<XIcon class="size-4" />
					</button>
				</div>
			</div>

			<div class="px-6 pb-2">
				<p class="text-sm text-muted-foreground">
					You're about to activate
					<span class="font-semibold text-foreground">{orgName}</span>. This will unlock production
					access.
				</p>

				<ul
					class="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border bg-muted/20"
				>
					{#each checklist as item (item)}
						<li class="flex items-center gap-3 px-4 py-3">
							<CheckCircle2 class="size-4 shrink-0 text-success" />
							<span class="text-sm">{item}</span>
						</li>
					{/each}
				</ul>

				<div
					class="mt-4 flex items-start gap-2.5 rounded-xl border border-warning/25 bg-warning/8 px-4 py-3"
				>
					<AlertCircle class="mt-0.5 size-4 shrink-0 text-warning" />
					<p class="text-xs leading-relaxed text-warning">
						Activation cannot be undone via this dialog. Use the suspend action to pause access
						later.
					</p>
				</div>
			</div>

			<div class="flex items-center justify-end gap-2.5 px-6 py-4">
				<Button variant="ghost" onclick={handleClose} disabled={loading}>Cancel</Button>
				<Button onclick={handleConfirm} disabled={loading}>
					{#if loading}
						<Loader2 class="size-4 animate-spin" />
						Activating…
					{:else}
						<ShieldCheck class="size-4" />
						Confirm Activation
					{/if}
				</Button>
			</div>
		</div>
	</div>
{/if}
