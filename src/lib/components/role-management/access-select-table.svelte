<script lang="ts">
	import { Chip } from '$lib/components/reusable';
	import { Button } from '$lib/components/reusable';
	import { Checkbox } from '$lib/components/reusable';
	import { cn } from '$lib/utils';
	import type {
		ModuleDef,
		PermKey,
		PermissionsState
	} from '$lib/stores/role-management/role-management';
	import { Shield } from '$lib/assets/icons';

	let {
		modules,
		title,
		permissions,
		permKeys,
		permLabels,
		description,
		allSelected = false,
		onToggle,
		onToggleAll
	}: {
		modules: ModuleDef[];
		title: string;
		description: string;
		permissions: PermissionsState;
		permKeys: PermKey[];
		permLabels: Record<string, string>;
		allSelected?: boolean;
		onToggle: (moduleId: string, key: PermKey) => void;
		onToggleAll?: () => void;
	} = $props();

	let activeModuleId = $state('');
	let activeModule = $derived(
		(activeModuleId ? modules.find((m) => m.id === activeModuleId) : undefined) ?? modules[0]
	);

	function moduleCount(moduleId: string): number {
		const perms = permissions[moduleId];
		if (!perms) return 0;
		return permKeys.filter((k) => perms[k]).length;
	}
</script>

<!-- <div class="glow-border rounded-xl bg-[#f0f6ff] p-1.5 dark:bg-[#1a2540]"> -->
<div class="rounded-xl border border-border bg-card shadow">
	<!-- Card header -->
	<div class="flex items-center justify-between border-b border-border px-5 py-4">
		<div>
			<h2 class="text-sm font-semibold text-foreground">{title}</h2>
		</div>
		{#if onToggleAll}
			<Button variant="outline" size="sm" onclick={onToggleAll} class="shadow">
				{allSelected ? 'Deselect all' : 'Select all'}
			</Button>
		{/if}
	</div>

	<!-- Two-panel body -->
	<div class="flex" style="height: 420px;">
		<!-- Left: module list -->
		<div class="w-70 shrink-0 overflow-y-auto border-r border-border">
			{#each modules as mod (mod.id)}
				{@const count = moduleCount(mod.id)}
				<button
					class={cn(
						'flex w-full items-center gap-3 border-l-2 px-4 py-3 text-left transition-colors hover:bg-accent/60',
						activeModule.id === mod.id
							? 'border-primary bg-accent/60 dark:bg-accent/40'
							: 'border-transparent'
					)}
					onclick={() => (activeModuleId = mod.id)}
				>
					<div
						class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"
					>
						<mod.icon class="h-4 w-4" />
					</div>
					<span class="min-w-0 flex-1 truncate text-sm text-foreground">{mod.name}</span>
					{#if count > 0}
						<Chip class="h-5 shrink-0 rounded-full px-1.5 text-xs">{count}</Chip>
					{/if}
				</button>
			{/each}
		</div>

		<!-- Right: permissions for active module -->
		<div class="flex-1 overflow-y-auto p-5">
			{#if activeModule}
				<!-- Module header -->
				<div class="mb-5 flex items-center gap-3">
					<div
						class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
					>
						<activeModule.icon class="h-5 w-5" />
					</div>
					<div>
						<p class="text-sm font-semibold text-foreground">{activeModule.name}</p>
						<p class="text-xs text-muted-foreground">{description}</p>
					</div>
				</div>

				<!-- Permission rows -->
				<div class="flex flex-col gap-2">
					{#each permKeys as key (key)}
						<div
							class="flex cursor-pointer items-center justify-between rounded-lg border-2 border-border/60 px-4 py-3 transition-all hover:border-primary hover:bg-accent/40 focus-visible:border-primary focus-visible:outline-none"
							role="button"
							tabindex="0"
							onclick={() => onToggle(activeModule.id, key)}
							onkeydown={(e) => e.key === 'Enter' && onToggle(activeModule.id, key)}
						>
							<div class="flex items-center gap-2.5 text-sm text-foreground">
								<Shield class="w-3.5" />
								{permLabels[key] ?? key}
							</div>
							<div class="pointer-events-none">
								<Checkbox checked={permissions[activeModule.id]?.[key] ?? false} />
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>
<!-- </div> -->
