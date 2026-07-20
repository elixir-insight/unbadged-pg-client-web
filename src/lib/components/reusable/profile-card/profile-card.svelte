<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Settings, LogOut, ChevronUp, Hash } from '$lib/assets/icons';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { cn } from '$lib/utils';

	let {
		userName,
		userRole,
		userInitials,
		vanNumber,
		isCollapsed = false,
		settingsHref
	}: {
		userName: string;
		userRole: string;
		userInitials: string;
		vanNumber?: string;
		isCollapsed?: boolean;
		settingsHref?: string;
	} = $props();

	function handleSettingsClick() {
		if (settingsHref) {
			goto(resolve(...([settingsHref] as Parameters<typeof resolve>)));
		}
	}
</script>

<div class="shrink-0 border-border p-2">
	<DropdownMenu.Root>
		<DropdownMenu.Trigger
			class={cn(
				'flex w-full cursor-pointer items-center rounded-lg p-2 text-left transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none',
				isCollapsed ? 'justify-center' : 'gap-3'
			)}
		>
			<div
				class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
			>
				{userInitials}
			</div>
			{#if !isCollapsed}
				<div class="min-w-0 flex-1 leading-tight">
					<p class="truncate text-sm font-semibold text-foreground">{userName}</p>
					<p class="truncate text-xs text-muted-foreground">{userRole}</p>
				</div>
				<ChevronUp class="h-4 w-4 shrink-0 text-muted-foreground" />
			{/if}
		</DropdownMenu.Trigger>

		<DropdownMenu.Content
			side="top"
			align={isCollapsed ? 'start' : 'end'}
			sideOffset={8}
			class="z-60 min-w-55 rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-xl"
		>
			<!-- User info card -->
			<div class="mb-1 rounded-lg bg-muted/50 px-3 py-2.5">
				<div class="flex items-center gap-3">
					<div
						class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground"
					>
						{userInitials}
					</div>
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-semibold text-foreground">{userName}</p>
						<p class="truncate text-xs text-muted-foreground">{userRole}</p>
						{#if vanNumber}
							<div class="mt-0.5 flex items-center gap-1">
								<Hash class="h-3 w-3 shrink-0 text-primary" />
								<span class="font-mono text-xs font-medium text-primary">{vanNumber}</span>
							</div>
						{/if}
					</div>
				</div>
			</div>

			<DropdownMenu.Separator class="my-1 h-px bg-border" />

			<DropdownMenu.Item
				onclick={handleSettingsClick}
				class="flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
			>
				<Settings class="h-4 w-4 shrink-0" />
				Settings
			</DropdownMenu.Item>
			<DropdownMenu.Separator class="my-1 h-px bg-border" />

			<form method="POST" action={resolve('/logout')}>
				<button
					type="submit"
					class="flex w-full cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-sm text-destructive transition-colors outline-none hover:bg-destructive/10 focus:bg-destructive/10"
				>
					<LogOut class="h-4 w-4 shrink-0" />
					Sign out
				</button>
			</form>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
</div>
