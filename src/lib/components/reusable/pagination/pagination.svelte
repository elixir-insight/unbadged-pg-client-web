<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { ChevronLeft, ChevronRight } from '$lib/assets/icons';

	interface Props {
		handlePreviousClick: () => void;
		handleNextClick: () => void;
		pageCount: number;
		handleEnterPress: (page: number) => void;
		currentPage: number | undefined;
	}

	let { handlePreviousClick, handleNextClick, pageCount, handleEnterPress, currentPage }: Props =
		$props();

	// Track which page the user was on when they last typed into the input.
	// When currentPage changes (navigation), lastTypedForPage no longer matches,
	// so displayValue falls back to the synced currentPage — no $effect needed.
	let lastTypedForPage = $state<number | undefined>(undefined);
	let userTypedValue = $state('');

	let displayValue = $derived.by(() => {
		if (lastTypedForPage === currentPage && userTypedValue !== '') {
			return userTypedValue;
		}
		return currentPage?.toString() ?? '';
	});

	function onPageInput(e: Event) {
		userTypedValue = (e.target as HTMLInputElement).value;
		lastTypedForPage = currentPage;
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			handleEnterPress(displayValue ? parseInt(displayValue) : 0);
		}
	}
</script>

<!--
  Responsive strategy:
  - Default (< 640px / mobile):  icon-only Prev/Next, compact gap, "Jump to" label hidden,
    "page" suffix hidden, narrow input. flex-wrap for graceful overflow handling.
  - sm (≥ 640px / large mobile + tablet): labels visible, normal gaps, full-width input.
  - md+ (≥ 768px / tablet landscape + desktop): full label text, generous gaps.

  No fixed widths/heights on the container — fluid flex sizing with min-w-0 to
  prevent overflow inside constrained parents (tables, cards, modals).
  inputmode="numeric" triggers the numeric keyboard on iOS and Android.
  aria-label on every control preserves keyboard/screen-reader accessibility.
-->
<div class="flex min-w-0 flex-wrap items-center justify-center gap-2 sm:gap-4 md:gap-6 lg:gap-10">
	<!-- Previous page -->
	<Button
		variant="ghost"
		size="sm"
		onclick={handlePreviousClick}
		disabled={currentPage === 1}
		aria-label="Go to previous page"
	>
		<span data-testid="prev-click" class="flex items-center gap-1 text-xs font-normal sm:gap-1.5">
			<ChevronLeft class="size-4 shrink-0" />
			<!-- Label hidden on mobile to keep layout compact -->
			<span class="hidden sm:inline">Prev</span>
		</span>
	</Button>

	<!-- Jump-to-page control -->
	<div class="flex items-center gap-1.5 sm:gap-2.5 md:gap-3">
		<!-- "Jump to" label — hidden on mobile, accessible via aria-label on input -->
		<span class="hidden text-xs font-normal whitespace-nowrap text-muted-foreground sm:block">
			Jump to
		</span>

		<div data-testid="pagination-check">
			<input
				class="h-7 w-10 rounded-md border border-border bg-background text-center text-xs shadow-sm transition-shadow focus:ring-1 focus:ring-ring/50 focus:outline-none disabled:opacity-50 sm:h-7.5 sm:w-14 md:w-15"
				value={displayValue}
				oninput={onPageInput}
				onkeydown={handleKeyDown}
				aria-label={`Page number, currently on page ${currentPage ?? 1} of ${pageCount}`}
				inputmode="numeric"
				pattern="[0-9]*"
				min="1"
				max={pageCount}
			/>
		</div>

		<!-- Page count: always show "/ N", "page" suffix only on sm+ -->
		<span class="text-xs font-normal whitespace-nowrap text-muted-foreground">
			/ {pageCount} <span class="hidden sm:inline"> page</span>
		</span>
	</div>

	<!-- Next page -->
	<Button
		variant="ghost"
		size="sm"
		onclick={handleNextClick}
		disabled={currentPage === pageCount}
		aria-label="Go to next page"
	>
		<span data-testid="next-click" class="flex items-center gap-1 text-xs font-normal sm:gap-1.5">
			<!-- Label hidden on mobile -->
			<span class="hidden sm:inline">Next</span>
			<ChevronRight class="size-4 shrink-0" />
		</span>
	</Button>
</div>
