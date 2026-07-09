<script module lang="ts">
	export interface VanAccount {
		id: string;
		bankName: string;
		accountNumber: string;
		ifsc: string;
		cardName: string;
		purpose: string;
		type: string;
		status: 'active' | 'on-hold' | 'inactive' | 'reserved';
		txToday: number;
		txLimit: number;
	}
</script>

<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { cn } from '$lib/utils';
	import Plus from '@lucide/svelte/icons/plus';
	let { accounts, class: className }: { accounts: VanAccount[]; class?: string } = $props();
	const totalToday = $derived(accounts.reduce((sum, account) => sum + account.txToday, 0));
	const activeCount = $derived(accounts.filter((account) => account.status === 'active').length);
	// Colors keyed by rank — solid design-system chart tokens, no gradients.
	// Applied imperatively so the front card is always the rank-0 color regardless of which account it is.
	const RANK_BACKGROUNDS = ['var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)'] as const;

	// ── Stack position spec per rank ──────────────────────────────────────────
	// rank 0 = front (bottom-most, fully visible)
	// rank 2 = back  (top-most, smallest peek)
	const RANK_POS = [
		{ y: 40, scale: 1, opacity: 1, z: 3 },
		{ y: 20, scale: 0.95, opacity: 0.9, z: 2 },
		{ y: 4, scale: 0.9, opacity: 0.75, z: 1 }
	] as const;

	const CARD_H = 180;
	const STACK_H = CARD_H + 44;

	// ── Reactive state (drives details section + dot indicators only) ─────────
	// order[rank] = accountIndex
	let order = $state([0, 1, 2]);

	// ── Imperative state — never reactive, drives all visual animations ────────
	let cardEls: (HTMLElement | undefined)[] = new Array(accounts.length);
	let isAnimating = false; // blocks concurrent transitions
	let isEntryComplete = false; // blocks interactions during sequential entry
	let dragActive = false;
	let dragStartX = 0;
	let dragX = 0;
	let dragPointerId: number | null = null;

	// ── Helpers ───────────────────────────────────────────────────────────────
	function waitFrame(): Promise<void> {
		return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
	}

	const FRONT_SHADOW = '0 8px 32px color-mix(in oklch, var(--primary), transparent 60%)';
	const FRONT_SHADOW_HOVER = '0 16px 40px color-mix(in oklch, var(--primary), transparent 50%)';

	function setCardBg(el: HTMLElement, rank: number) {
		el.style.background = RANK_BACKGROUNDS[rank];
	}

	function persistPos(el: HTMLElement, rank: number, shadow = false) {
		const { y, scale, opacity, z } = RANK_POS[rank];
		el.style.transform = `translateY(${y}px) scale(${scale})`;
		el.style.opacity = String(opacity);
		el.style.zIndex = String(z);
		el.style.boxShadow = shadow && rank === 0 ? FRONT_SHADOW : '';
	}

	// ── SEQUENTIAL ENTRY ANIMATION ─────────────────────────────────────────────
	// Each card enters one at a time from below, with overshoot.
	// Order: rank 2 (back) → rank 1 (middle) → rank 0 (front)
	onMount(async () => {
		await tick();

		// Teleport every card off-screen below, no transition
		for (let i = 0; i < accounts.length; i++) {
			const el = cardEls[i];
			if (!el) continue;
			el.style.transition = 'none';
			el.style.transform = 'translateY(300px) scale(0.88)';
			el.style.opacity = '0';
		}
		// Set initial z-indices so depth is correct from the first frame
		order.forEach((idx, rank) => {
			const el = cardEls[idx];
			if (el) el.style.zIndex = String(RANK_POS[rank].z);
		});

		// Double-rAF: ensure the off-screen paint is committed before animating
		await waitFrame();

		// Start Y = bottom of the overflow container so each card peeks ~18px before entering.
		// Container height = STACK_H + 24, padding-top = 12 → peek = (STACK_H+24) - 12 - (STACK_H-6) = 18px
		const ENTRY_START_Y = STACK_H - 6;

		// Animate each rank in sequence: back → middle → front
		for (let rank = 2; rank >= 0; rank--) {
			const accountIdx = order[rank];
			const el = cardEls[accountIdx];
			if (!el) continue;

			const { y, scale, opacity } = RANK_POS[rank];

			// Before this card enters, peek the next-in-queue card at the very bottom
			// so it looks like it's waiting. The overflow-hidden clips it to a thin sliver.
			const nextRank = rank - 1;
			if (nextRank >= 0) {
				const nextEl = cardEls[order[nextRank]];
				if (nextEl) {
					setCardBg(nextEl, nextRank);
					nextEl.style.transition = 'none';
					nextEl.style.transform = `translateY(${ENTRY_START_Y}px) scale(0.9)`;
					nextEl.style.opacity = '0.35';
					await waitFrame();
				}
			}

			// Assign rank-based color before the card becomes visible
			setCardBg(el, rank);

			// Three-keyframe arc:
			//  0%  → peeks at bottom of container
			// 65%  → rises to slightly above final position (overshoot up)
			// 100% → eases back down to final resting position
			const anim = el.animate(
				[
					{ transform: `translateY(${ENTRY_START_Y}px) scale(0.9)`, opacity: '0.22', offset: 0 },
					{
						transform: `translateY(${Math.max(0, y - 14)}px) scale(${scale + 0.016})`,
						opacity: String(opacity),
						offset: 0.65
					},
					{ transform: `translateY(${y}px) scale(${scale})`, opacity: String(opacity), offset: 1 }
				],
				{
					duration: 700,
					easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
					// fill: 'both' → first keyframe applies instantly so card jumps from 300px to
					// the peek position the moment animate() is called — no flash of hidden state
					fill: 'both'
				}
			);

			await anim.finished;

			// Persist so we never rely solely on fill mode
			persistPos(el, rank);
		}

		isEntryComplete = true;
	});

	// ── HOVER LIFT (front card only) ──────────────────────────────────────────
	function onCardHoverIn(accountIdx: number) {
		if (!isEntryComplete || isAnimating || dragActive || order[0] !== accountIdx) return;
		const el = cardEls[accountIdx];
		if (!el) return;
		el.style.transition = 'transform 0.5s cubic-bezier(0.16,1,0.3,1), box-shadow 0.5s ease';
		el.style.transform = 'translateY(36px) scale(1.01)';
		el.style.boxShadow = FRONT_SHADOW_HOVER;
	}

	function onCardHoverOut(accountIdx: number) {
		if (!isEntryComplete || dragActive || order[0] !== accountIdx) return;
		const el = cardEls[accountIdx];
		if (!el) return;
		el.style.transition = 'transform 0.5s cubic-bezier(0.16,1,0.3,1), box-shadow 0.5s ease';
		el.style.transform = `translateY(${RANK_POS[0].y}px) scale(1)`;
		el.style.boxShadow = FRONT_SHADOW;
	}

	// ── SWIPE GESTURE ─────────────────────────────────────────────────────────
	function onStackPointerDown(e: PointerEvent) {
		if (!isEntryComplete || isAnimating) return;
		const cardEl = (e.target as HTMLElement).closest<HTMLElement>('[data-card-idx]');
		if (!cardEl) return;
		if (parseInt(cardEl.dataset.cardIdx ?? '-1') !== order[0]) return;

		dragActive = true;
		dragStartX = e.clientX;
		dragX = 0;
		dragPointerId = e.pointerId;
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

		const el = cardEls[order[0]];
		if (el) el.style.transition = 'none';
	}

	function onStackPointerMove(e: PointerEvent) {
		if (!dragActive || e.pointerId !== dragPointerId) return;
		dragX = e.clientX - dragStartX;

		const el = cardEls[order[0]];
		if (!el) return;
		el.style.transform = `translateY(40px) translateX(${dragX}px) rotate(${dragX * 0.07}deg) scale(1)`;
		el.style.opacity = String(Math.max(0.3, 1 - Math.abs(dragX) / 180));
	}

	function endDrag(e: PointerEvent) {
		if (!dragActive || e.pointerId !== dragPointerId) return;
		dragActive = false;
		dragPointerId = null;
		const finalX = dragX;
		dragX = 0;

		if (Math.abs(finalX) > 60) {
			const dir = finalX > 0 ? 1 : -1;
			const el = cardEls[order[0]];
			performSwipeSwitch(
				'x',
				dir,
				el ? { transform: el.style.transform, opacity: el.style.opacity } : undefined
			);
		} else {
			// Snap back
			const el = cardEls[order[0]];
			if (!el) return;
			const snap = el.animate(
				[
					{ transform: el.style.transform, opacity: el.style.opacity },
					{ transform: `translateY(${RANK_POS[0].y}px) scale(1)`, opacity: '1' }
				],
				{ duration: 380, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' }
			);
			snap.finished.then(() => persistPos(el, 0));
		}
	}

	function exitTransform(axis: 'x' | 'y', offset: number, rot: number, scale = 1) {
		return axis === 'x'
			? `translateY(40px) translateX(${offset}px) rotate(${rot}deg) scale(${scale})`
			: `translateX(0px) translateY(${offset}px) rotate(${rot}deg) scale(${scale})`;
	}
	// ── SWIPE SWITCH (FLIP-based) ──────────────────────────────────────────────
	// 1. Fly outgoing card off-screen.
	// 2. FLIP remaining cards from old positions to new positions simultaneously.
	// 3. Deal recycled card back to rank 2 from below.
	async function performSwipeSwitch(
		axis: 'x' | 'y',
		dir: 1 | -1,
		dragFrom?: { transform: string; opacity: string }
	) {
		isAnimating = true;

		const outIdx = order[0];
		const nextIdx = order[1]; // → becomes rank 0
		const backIdx = order[2]; // → becomes rank 1
		const outEl = cardEls[outIdx];
		const nextEl = cardEls[nextIdx];
		const backEl = cardEls[backIdx];

		// FLIP — capture old visual positions before any DOM change
		const oldNext = { y: RANK_POS[1].y, scale: RANK_POS[1].scale, opacity: RANK_POS[1].opacity };
		const oldBack = { y: RANK_POS[2].y, scale: RANK_POS[2].scale, opacity: RANK_POS[2].opacity };

		// Update reactive order now — details + dots update immediately
		order = [...order.slice(1), order[0]];

		// Pre-assign z-indices so depth is correct during transition
		if (nextEl) nextEl.style.zIndex = '3';
		if (backEl) backEl.style.zIndex = '2';
		if (outEl) outEl.style.zIndex = '1';

		// Step 1: fly outgoing card off-screen
		const flyDist = dir * 500;
		const flyRot = axis === 'x' ? dir * 26 : 0;
		const flyFrom = dragFrom ?? { transform: exitTransform(axis, 0, 0, 1), opacity: '1' };

		const flyAnim = outEl?.animate(
			[flyFrom, { transform: exitTransform(axis, flyDist, flyRot, 1), opacity: '0' }],
			{ duration: 380, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'forwards' }
		);

		// Step 2: simultaneously FLIP remaining cards to new positions
		const flipDur = 780;
		const flipEase = 'cubic-bezier(0.22, 1, 0.36, 1)';

		const nextAnim = nextEl?.animate(
			[
				{
					transform: `translateY(${oldNext.y}px) scale(${oldNext.scale})`,
					opacity: String(oldNext.opacity)
				},
				{
					transform: `translateY(${RANK_POS[0].y}px) scale(${RANK_POS[0].scale})`,
					opacity: String(RANK_POS[0].opacity)
				}
			],
			{ duration: flipDur, easing: flipEase, fill: 'forwards' }
		);

		const backAnim = backEl?.animate(
			[
				{
					transform: `translateY(${oldBack.y}px) scale(${oldBack.scale})`,
					opacity: String(oldBack.opacity)
				},
				{
					transform: `translateY(${RANK_POS[1].y}px) scale(${RANK_POS[1].scale})`,
					opacity: String(RANK_POS[1].opacity)
				}
			],
			{ duration: flipDur, easing: flipEase, fill: 'forwards' }
		);

		// Wait for fly + FLIP (fly is shorter — the stack is already moving while card flies off)
		await Promise.all([flyAnim?.finished, nextAnim?.finished, backAnim?.finished]);

		// Persist final positions for all animated cards
		if (outEl) {
			outEl.style.transform = `translateY(40px) translateX(${flyDist}px) rotate(${flyRot}deg)`;
			outEl.style.opacity = '0';
		}
		if (nextEl) {
			persistPos(nextEl, 0);
			setCardBg(nextEl, 0);
		}
		if (backEl) {
			persistPos(backEl, 1);
			setCardBg(backEl, 1);
		}

		// Step 3: snap recycled card below the stack, swap to rank-2 color while invisible
		if (outEl) {
			outEl.style.transition = 'none';
			outEl.style.transform = 'translateY(300px) scale(0.88)';
			outEl.style.zIndex = '1';
			setCardBg(outEl, 2);
		}
		await waitFrame();

		// Step 4: deal recycled card smoothly up from below into rank 2
		if (outEl) {
			const { y, scale, opacity } = RANK_POS[2];
			const dealAnim = outEl.animate(
				[
					{ transform: 'translateY(300px) scale(0.88)', opacity: '0', offset: 0 },
					{
						transform: `translateY(${y - 6}px) scale(${scale + 0.01})`,
						opacity: String(opacity),
						offset: 0.82
					},
					{ transform: `translateY(${y}px) scale(${scale})`, opacity: String(opacity), offset: 1 }
				],
				{ duration: 620, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' }
			);
			await dealAnim.finished;
			persistPos(outEl, 2, false);
		}

		isAnimating = false;
	}
	let wheelLocked = false;

	function onStackWheel(e: WheelEvent) {
		if (!isEntryComplete || isAnimating || wheelLocked) return;
		if (Math.abs(e.deltaY) < Math.abs(e.deltaX)) return; // let horizontal trackpad scroll fall through to drag logic instead

		const THRESHOLD = 12;
		if (Math.abs(e.deltaY) < THRESHOLD) return;

		e.preventDefault();
		wheelLocked = true;

		if (e.deltaY < 0) {
			// scrolled upward — front card exits up, next card becomes front
			performSwipeSwitch('y', -1);
		} else {
			// scrolled downward — back card becomes front
			selectCardByIdx(order[2]);
		}

		setTimeout(() => (wheelLocked = false), 750); // swallow the rest of this wheel gesture
	}

	// ── DOT SWITCH (FLIP-based) ────────────────────────────────────────────────
	// Fade out the current front card, FLIP remaining cards into new positions,
	// then deal the displaced card back into its new rank from below.
	async function selectCardByIdx(targetAccountIdx: number) {
		if (!isEntryComplete || isAnimating || order[0] === targetAccountIdx) return;
		isAnimating = true;

		const prevFrontIdx = order[0];
		const prevFrontEl = cardEls[prevFrontIdx];

		// Build new order
		const newOrder = [...order];
		while (newOrder[0] !== targetAccountIdx) newOrder.push(newOrder.shift()!);

		// FLIP — capture current visual positions before anything changes
		const snapshots: Record<number, { y: number; scale: number; opacity: number }> = {};
		order.forEach((accountIdx, rank) => {
			snapshots[accountIdx] = {
				y: RANK_POS[rank].y,
				scale: RANK_POS[rank].scale,
				opacity: RANK_POS[rank].opacity
			};
		});

		// Update reactive order (details + dots update immediately)
		order = newOrder;

		// Pre-assign z-indices
		newOrder.forEach((accountIdx, rank) => {
			const el = cardEls[accountIdx];
			if (el) el.style.zIndex = String(RANK_POS[rank].z);
		});

		// Step 1: Fade current front card up and out
		if (prevFrontEl) {
			const fadeOut = prevFrontEl.animate(
				[
					{ transform: `translateY(${RANK_POS[0].y}px) scale(1)`, opacity: '1' },
					{ transform: `translateY(${RANK_POS[0].y - 14}px) scale(0.92)`, opacity: '0' }
				],
				{ duration: 320, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'forwards' }
			);
			await fadeOut.finished;
			prevFrontEl.style.opacity = '0';
			prevFrontEl.style.transform = `translateY(${RANK_POS[0].y}px) scale(0.92)`;
		}

		// Step 2: FLIP remaining cards (everything except the old front) to new positions
		const flipDur = 780;
		const flipEase = 'cubic-bezier(0.22, 1, 0.36, 1)';

		const flipAnims = newOrder
			.filter((idx) => idx !== prevFrontIdx)
			.map((accountIdx) => {
				const el = cardEls[accountIdx];
				if (!el) return null;
				const from = snapshots[accountIdx];
				const toRank = newOrder.indexOf(accountIdx);
				const to = RANK_POS[toRank];
				return el.animate(
					[
						{
							transform: `translateY(${from.y}px) scale(${from.scale})`,
							opacity: String(from.opacity)
						},
						{ transform: `translateY(${to.y}px) scale(${to.scale})`, opacity: String(to.opacity) }
					],
					{ duration: flipDur, easing: flipEase, fill: 'forwards' }
				);
			})
			.filter((a): a is Animation => a !== null);

		await Promise.all(flipAnims.map((a) => a.finished));

		// Persist FLIP results + update rank-based colors
		newOrder
			.filter((idx) => idx !== prevFrontIdx)
			.forEach((accountIdx) => {
				const el = cardEls[accountIdx];
				if (!el) return;
				const rank = newOrder.indexOf(accountIdx);
				persistPos(el, rank);
				setCardBg(el, rank);
			});

		// Step 3: snap displaced front card below stack, swap to its new rank color while invisible
		const newRankOfOldFront = newOrder.indexOf(prevFrontIdx);
		if (prevFrontEl) {
			prevFrontEl.style.transition = 'none';
			prevFrontEl.style.transform = 'translateY(300px) scale(0.88)';
			prevFrontEl.style.opacity = '0';
			setCardBg(prevFrontEl, newRankOfOldFront);
		}
		await waitFrame();

		if (prevFrontEl) {
			const { y, scale, opacity } = RANK_POS[newRankOfOldFront];
			const dealAnim = prevFrontEl.animate(
				[
					{ transform: 'translateY(300px) scale(0.88)', opacity: '0', offset: 0 },
					{
						transform: `translateY(${y - 5}px) scale(${scale + 0.008})`,
						opacity: String(opacity),
						offset: 0.8
					},
					{ transform: `translateY(${y}px) scale(${scale})`, opacity: String(opacity), offset: 1 }
				],
				{ duration: 560, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' }
			);
			await dealAnim.finished;
			persistPos(prevFrontEl, newRankOfOldFront, false);
		}

		isAnimating = false;
	}

	// ── Formatters ────────────────────────────────────────────────────────────
	function fmtAcct(num: string) {
		return num.match(/.{1,4}/g)?.join('  ') ?? num;
	}

	function maskAcct(num: string) {
		return `****  ${num.slice(-4)}`;
	}

	function fmtINR(n: number) {
		if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)}Cr`;
		if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)}L`;
		if (n >= 1_000) return `₹${(n / 1_000).toFixed(0)}K`;
		return `₹${n.toLocaleString('en-IN')}`;
	}

	const STATUS_META: Record<VanAccount['status'], { label: string; dot: string }> = {
		active: { label: 'Active', dot: 'bg-emerald-400' },
		'on-hold': { label: 'On Hold', dot: 'bg-amber-400' },
		inactive: { label: 'Inactive', dot: 'bg-rose-400' },
		reserved: { label: 'Reserved', dot: 'bg-sky-400' }
	};
</script>

<div
	class={cn(
		'van-widget flex h-full flex-col rounded-2xl border border-border bg-card shadow-sm',
		className
	)}
>
	<!-- ── Header ─────────────────────────────────────────────────────────── -->
	<div class="flex items-center justify-between px-5 pt-4 pb-0">
		<div>
			<p class="text-sm font-semibold text-foreground">My VAN</p>
			<p class="text-[11px] text-muted-foreground">{accounts.length} virtual accounts active</p>
		</div>
		<button
			class="relative flex size-7 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground transition-colors before:absolute before:-inset-2 before:content-[''] hover:bg-accent hover:text-accent-foreground"
			aria-label="Add VAN account"
		>
			<Plus class="size-3.5" />
		</button>
	</div>

	<!-- ── Card Stack ─────────────────────────────────────────────────────── -->
	<div class="flex flex-1 flex-col justify-center">
		<!-- Shared clip-path definition for every card face: 18px rounded rect with a
		     concave 16px-radius notch (≈8px deep) cut into the upper-middle right edge. -->
		<svg width="0" height="0" class="absolute" aria-hidden="true">
			<defs>
				<clipPath id="van-card-shape" clipPathUnits="objectBoundingBox">
					<path
						d="M0.052941,0 H0.947059 A0.052941,0.1 0 0 1 1,0.1 V0.2 A0.047059,0.105556 0 0 0 1,0.388889 V0.9 A0.047059,0.1 0 0 1 0.947059,1 H0.052941 A0.052941,0.1 0 0 1 0,0.9 V0.1 A0.052941,0.1 0 0 1 0.052941,0 Z"
					/>
				</clipPath>
			</defs>
		</svg>

		<div class="relative mx-auto w-full max-w-95 px-5">
			<!-- Stack wrapper — all pointer events live here -->
			<div
				role="region"
				aria-label="VAN card stack"
				class="relative touch-none overflow-hidden"
				style="height: {STACK_H}px;"
				onpointerdown={onStackPointerDown}
				onpointermove={onStackPointerMove}
				onpointerup={endDrag}
				onpointercancel={endDrag}
				onwheel={onStackWheel}
			>
				{#each accounts as account, idx (account.id)}
					<div
						data-card-idx={idx}
						{@attach (el) => {
							cardEls[idx] = el;
							return () => {
								cardEls[idx] = undefined;
							};
						}}
						class="van-card absolute inset-x-0 top-0 flex aspect-17/9 w-full max-w-85 cursor-grab flex-col overflow-hidden px-5 py-4 select-none active:cursor-grabbing"
						style="opacity: 0;"
						onpointerenter={() => onCardHoverIn(idx)}
						onpointerleave={() => onCardHoverOut(idx)}
						role="button"
						tabindex="0"
						aria-label="Select {account.bankName} - {account.purpose}"
					>
						<!-- Watermark — stretched to an exact 300px span (20px clearance each side)
						     via textLength, sitting well above the number row. Clipped to the card
						     shape by the parent's clip-path; painted before the foreground text so
						     it never sits above or interferes with readable content. -->
						<svg
							class="pointer-events-none absolute inset-0 select-none"
							viewBox="0 0 340 180"
							aria-hidden="true"
						>
							<text
								x="20"
								y="126"
								textLength="300"
								lengthAdjust="spacingAndGlyphs"
								style="font-family: inherit; font-size: 112px; font-weight: 700; fill: var(--primary-foreground); fill-opacity: 0.06;"
							>
								VAN
							</text>
						</svg>
						<div class="card-gloss pointer-events-none absolute inset-0"></div>

						<!-- Top row: bank name -->
						<p class="relative text-[13px] font-semibold text-primary-foreground">
							{account.bankName}
						</p>

						<!-- Bottom row: masked/full account number + status -->
						<div class="relative mt-auto flex items-end justify-between gap-2">
							<p
								class="min-w-0 truncate text-[clamp(0.7rem,4.6cqw,1.0625rem)] font-semibold tracking-[1px] text-primary-foreground"
							>
								{order[0] === idx
									? fmtAcct(account.accountNumber)
									: maskAcct(account.accountNumber)}
							</p>
							<span
								class="flex shrink-0 items-center gap-1.5 text-[clamp(0.625rem,3.2cqw,0.8125rem)] font-medium text-primary-foreground"
							>
								<span
									class={cn('size-2 rounded-full', STATUS_META[account.status].dot)}
									aria-hidden="true"
								></span>
								{STATUS_META[account.status].label}
							</span>
						</div>
					</div>
				{/each}
			</div>

			<!-- Pagination dots — below the stack, clear of the card so it doesn't crowd it -->
			<div class="mt-2 mb-2 flex items-center justify-center gap-1.5">
				{#each accounts as account, idx (account.id)}
					<button
						onclick={() => selectCardByIdx(idx)}
						aria-label="Select VAN {idx + 1}"
						class={cn(
							"relative rounded-full transition-all duration-300 before:absolute before:-inset-2.5 before:content-['']",
							order[0] === idx
								? 'h-1.5 w-4 bg-primary'
								: 'h-1.5 w-1.5 bg-border hover:bg-muted-foreground'
						)}
					></button>
				{/each}
			</div>
		</div>
	</div>

	<!-- ── Footer summary ─────────────────────────────────────────────────── -->
	<div class="grid shrink-0 grid-cols-2 divide-x divide-border border-t border-border">
		<div class="flex flex-col gap-0.5 px-5 py-3">
			<span class="text-[10.5px] font-medium text-muted-foreground">Moved today</span>
			<span class="text-sm font-bold tabular-nums text-foreground">{fmtINR(totalToday)}</span>
		</div>
		<div class="flex flex-col gap-0.5 px-5 py-3">
			<span class="text-[10.5px] font-medium text-muted-foreground">Active accounts</span>
			<span class="text-sm font-bold tabular-nums text-foreground"
				>{activeCount} of {accounts.length}</span
			>
		</div>
	</div>
</div>

<style>
	.van-card {
		container-type: inline-size;
		will-change: transform, opacity;
		clip-path: url(#van-card-shape);
	}

	.card-gloss {
		background: linear-gradient(
			130deg,
			rgba(255, 255, 255, 0.1) 0%,
			rgba(255, 255, 255, 0.03) 40%,
			transparent 65%
		);
	}
</style>
