<script lang="ts">
	import * as Drawer from '$lib/components/ui/drawer';
	import { ShieldCheck, CheckCircle2, AlertCircle, XIcon, Loader2 } from '$lib/assets/icons';

	interface Props {
		open: boolean;
		onclose: () => void;
		onconfirm: () => Promise<void>;
	}

	const { open, onclose, onconfirm }: Props = $props();

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
			await onconfirm(); // 👉 this updates parent state
			onclose(); // 👉 close drawer AFTER success
		} catch {
			// handled in parent
		} finally {
			loading = false;
		}
	}
</script>

<Drawer.Root
	{open}
	onOpenChange={(isOpen: boolean) => !isOpen && !loading && onclose()}
	direction="right"
>
	<Drawer.Content>
		<Drawer.Header>
			<div class="flex items-start justify-between gap-3">
				<div class="flex items-start gap-3">
					<div
						class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
					>
						<ShieldCheck class="size-4.5" />
					</div>
					<div class="min-w-0">
						<p class="text-base font-semibold">Activate Organization</p>
						<p class="mt-0.5 text-xs text-muted-foreground/60">
							You're about to activate this organization. This will unlock production access.
						</p>
					</div>
				</div>
				<button
					type="button"
					onclick={() => !loading && onclose()}
					disabled={loading}
					class="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
				>
					<XIcon class="size-4" />
				</button>
			</div>
		</Drawer.Header>

		<div class="overflow-auto px-4 pb-2">
			<div class="space-y-5">
				<!-- Checklist -->
				<div class="rounded-xl border border-border/50 bg-card p-4">
					<p class="mb-3 text-xs font-semibold tracking-wide text-muted-foreground/70 uppercase">
						Activation Checklist
					</p>
					<ul class="space-y-2.5">
						{#each checklist as item (item)}
							<li class="flex items-center gap-2.5">
								<CheckCircle2 class="size-3.5 shrink-0 text-success" />
								<span class="text-sm text-muted-foreground">{item}</span>
							</li>
						{/each}
					</ul>
				</div>

				<!-- Warning -->
				<div
					class="flex items-start gap-3 rounded-xl border border-warning/25 bg-warning/8 px-4 py-3"
				>
					<AlertCircle class="mt-0.5 size-4 shrink-0 text-warning" />
					<p class="text-sm text-warning">
						Activation cannot be undone here. You can suspend access later using Suspend
						Organization.
					</p>
				</div>
			</div>
		</div>

		<Drawer.Footer>
			<button
				type="button"
				onclick={() => !loading && onclose()}
				disabled={loading}
				class="rounded-xl border border-border/60 bg-card px-5 py-2.5 text-sm font-semibold text-muted-foreground shadow-xs transition-all hover:bg-muted/40 hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
			>
				Cancel
			</button>
			<button
				// type="button"
				onclick={(e) => {
					e.stopPropagation(); // 🔥 prevents accidental click triggering
					handleConfirm();
				}}
				disabled={loading}
				class="gradient-primary flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
			>
				{#if loading}
					<Loader2 class="size-4 animate-spin" />
					Activating…
				{:else}
					<ShieldCheck class="size-4" />
					Confirm Activation
				{/if}
			</button>
		</Drawer.Footer>
	</Drawer.Content>
</Drawer.Root>
