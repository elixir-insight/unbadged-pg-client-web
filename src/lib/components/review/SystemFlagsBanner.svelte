<script lang="ts">
	import type { SystemFlag } from '$lib/types/review';
	import { BotIcon, ChevronDown, ChevronUp } from '$lib/assets/icons';

	let { flags }: { flags: SystemFlag[] } = $props();

	let expanded = $state(false);

	const errors = $derived(flags.filter((f) => f.severity === 'error'));
	const warnings = $derived(flags.filter((f) => f.severity === 'warning'));
	const hasErrors = $derived(errors.length > 0);
</script>

{#if flags.length > 0}
	<div
		class={`overflow-hidden rounded-xl border ${hasErrors ? 'border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20' : 'border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20'} flex`}
	>
		<!-- Left accent strip -->
		<div class={`w-[3px] shrink-0 ${hasErrors ? 'bg-red-400' : 'bg-amber-400'}`}></div>

		<!-- Content -->
		<div class="flex-1 px-4 py-3.5">
			<!-- Header row -->
			<div class="flex items-center gap-2.5">
				<BotIcon
					class={`size-4 shrink-0 ${hasErrors ? 'text-red-500 dark:text-red-400' : 'text-amber-500 dark:text-amber-400'}`}
				/>
				<span
					class={`text-sm font-semibold ${hasErrors ? 'text-red-900 dark:text-red-200' : 'text-amber-900 dark:text-amber-200'}`}
				>
					System flags detected
				</span>

				<!-- Severity chips -->
				{#if errors.length > 0}
					<span
						class="rounded-full border border-red-200 bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-800 dark:border-red-800 dark:bg-red-950/60 dark:text-red-300"
					>
						{errors.length}
						{errors.length === 1 ? 'error' : 'errors'}
					</span>
				{/if}
				{#if warnings.length > 0}
					<span
						class="rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
					>
						{warnings.length}
						{warnings.length === 1 ? 'warning' : 'warnings'}
					</span>
				{/if}

				<!-- Expand/collapse -->
				<button
					onclick={() => (expanded = !expanded)}
					class={`ml-auto flex items-center gap-1 text-[11px] font-medium transition-colors ${hasErrors ? 'text-red-600 hover:text-red-800 dark:text-red-400' : 'text-amber-600 hover:text-amber-800 dark:text-amber-400'}`}
				>
					{expanded ? 'Collapse' : 'Expand'}
					{#if expanded}
						<ChevronUp class="size-3" />
					{:else}
						<ChevronDown class="size-3" />
					{/if}
				</button>
			</div>

			<!-- Flag rows (expanded) -->
			{#if expanded}
				<div
					class={`mt-3 space-y-0.5 border-t pt-3 ${hasErrors ? 'border-red-100 dark:border-red-900/30' : 'border-amber-100 dark:border-amber-900/30'}`}
				>
					{#each flags as flag (flag.field)}
						<div
							class={`flex items-start gap-3 rounded-md px-2 py-1.5 transition-colors ${flag.severity === 'error' ? 'hover:bg-red-100/70 dark:hover:bg-red-900/20' : 'hover:bg-amber-100/70 dark:hover:bg-amber-900/20'}`}
						>
							<span
								class={`mt-0.5 text-sm leading-none ${flag.severity === 'error' ? 'text-red-500' : 'text-amber-500'}`}
							>
								{flag.severity === 'error' ? '●' : '◆'}
							</span>
							<span class="w-28 shrink-0 text-[11px] font-semibold text-foreground">
								{flag.field}
							</span>
							<span class="flex-1 text-[11px] text-muted-foreground">{flag.message}</span>
							<a
								href="#{flag.field}"
								class={`shrink-0 text-[11px] font-medium underline-offset-2 hover:underline ${flag.severity === 'error' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}
							>
								Jump ↓
							</a>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
{/if}
