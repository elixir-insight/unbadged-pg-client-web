<script module lang="ts">
	export interface VanAccount {
		id: string;
		bankName: string;
		accountNumber: string;
		ifsc: string;
		cardName: string;
		purpose: string;
		type: string;
		status: 'active' | 'inactive';
		txToday: number;
		txLimit: number;
	}
</script>

<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { cn } from '$lib/utils';
	import Plus from '@lucide/svelte/icons/plus';
	let { accounts, class: className }: { accounts: VanAccount[]; class?: string } = $props();
	// Colors keyed by rank — rank 0 (front) is darkest, rank 2 (back) is lightest.
	// Applied imperatively so the front card is always dark regardless of which account it is.
	const RANK_BACKGROUNDS = [
		'linear-gradient(145deg, var(--chart-2) 0%, var(--chart-3) 100%)',
		'linear-gradient(145deg, var(--chart-3) 0%, var(--chart-4) 100%)',
		'var(--chart-4)'
	] as const;

	// ── Stack position spec per rank ──────────────────────────────────────────
	// rank 0 = front (bottom-most, fully visible)
	// rank 2 = back  (top-most, smallest peek)
	const RANK_POS = [
		{ y: 40, scale: 1, opacity: 1, z: 3 },
		{ y: 20, scale: 0.95, opacity: 0.9, z: 2 },
		{ y: 4, scale: 0.9, opacity: 0.75, z: 1 }
	] as const;

	const CARD_H = 152;
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
			performSwipeSwitch(finalX > 0 ? 1 : -1, finalX);
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

	// ── SWIPE SWITCH (FLIP-based) ──────────────────────────────────────────────
	// 1. Fly outgoing card off-screen.
	// 2. FLIP remaining cards from old positions to new positions simultaneously.
	// 3. Deal recycled card back to rank 2 from below.
	async function performSwipeSwitch(dir: 1 | -1, finalDragX: number) {
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
		const flyRot = dir * 26;
		const flyFrom = {
			transform: `translateY(40px) translateX(${finalDragX}px) rotate(${finalDragX * 0.07}deg) scale(1)`,
			opacity: String(Math.max(0.3, 1 - Math.abs(finalDragX) / 180))
		};

		const flyAnim = outEl?.animate(
			[
				flyFrom,
				{
					transform: `translateY(40px) translateX(${flyDist}px) rotate(${flyRot}deg) scale(1)`,
					opacity: '0'
				}
			],
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

	function fmtINR(n: number) {
		if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)}Cr`;
		if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)}L`;
		if (n >= 1_000) return `₹${(n / 1_000).toFixed(0)}K`;
		return `₹${n.toLocaleString('en-IN')}`;
	}
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
			<p class="text-sm font-semibold text-foreground">My VAN Accounts</p>
			<p class="text-[11px] text-muted-foreground">{accounts.length} virtual accounts active</p>
		</div>
		<button
			class="flex size-7 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
			aria-label="Add VAN account"
		>
			<Plus class="size-3.5" />
		</button>
	</div>

	<!-- ── Card Stack ─────────────────────────────────────────────────────── -->
	<div class="relative mx-auto mb-2 w-full max-w-sm px-5">
		<!-- Dot indicators — sit outside the clip so they're always visible -->
		<div
			class="absolute right-3 z-20 flex flex-col items-center justify-center gap-1.5"
			style="top: {RANK_POS[0].y + 12}px; height: {CARD_H}px;"
		>
			{#each accounts as account, idx (account.id)}
				<button
					onclick={() => selectCardByIdx(idx)}
					aria-label="Select VAN {idx + 1}"
					class={cn(
						'rounded-full transition-all duration-300',
						order[0] === idx
							? 'h-4 w-1.5 bg-primary'
							: 'h-1.5 w-1.5 bg-border hover:bg-muted-foreground'
					)}
				></button>
			{/each}
		</div>

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
					class="van-card absolute inset-x-0 top-0 h-38 cursor-grab overflow-hidden rounded-2xl px-5 py-4 select-none active:cursor-grabbing"
					style="opacity: 0;"
					onpointerenter={() => onCardHoverIn(idx)}
					onpointerleave={() => onCardHoverOut(idx)}
					role="button"
					tabindex="0"
					aria-label="Select {account.bankName} - {account.purpose}"
				>
					<div
						class="pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full border border-white/20"
					></div>
					<div
						class="pointer-events-none absolute -right-4 -top-8 h-24 w-24 rounded-full border border-white/15"
					></div>
					<div class="card-gloss pointer-events-none absolute inset-0"></div>

					<!-- Top row: bank name + VAN badge -->
					<div class="relative flex items-start justify-between">
						<p class="text-sm font-bold tracking-tight text-white">{account.bankName}</p>
						<span
							class="rounded-2xl border border-white/20 bg-white/10 px-2 py-1 text-[9px] font-bold tracking-widest text-white/80 uppercase"
						>
							VAN
						</span>
					</div>

					<!-- Account number -->
					<p class="relative mt-4 font-mono text-[15px] font-bold tracking-[0.15em] text-white">
						{fmtAcct(account.accountNumber)}
					</p>

					<!-- Today's spend -->
					<p class="relative mt-0.5 text-[9px] font-medium text-white/50">
						{fmtINR(account.txToday)} / {fmtINR(account.txLimit)} today
					</p>

					<!-- Bottom row: card holder + status -->
					<div class="relative mt-3 flex items-end justify-between gap-3">
						<div class="min-w-0">
							<p class="text-[7.5px] font-semibold tracking-widest text-white/40 uppercase">
								Card holder
							</p>
							<p class="mt-0.5 truncate text-[11px] font-semibold text-white">{account.cardName}</p>
						</div>
						<div class="flex shrink-0 items-center gap-1.5">
							<span class="relative flex size-1.5">
								{#if account.status === 'active'}
									<span
										class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"
									></span>
								{/if}
								<span
									class={cn(
										'relative inline-flex size-1.5 rounded-full',
										account.status === 'active' ? 'bg-emerald-400' : 'bg-white/40'
									)}
								></span>
							</span>
							<span class="text-[9px] font-bold text-white/80 uppercase"
								>{account.status === 'active' ? 'Active' : 'Inactive'}</span
							>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.van-card {
		will-change: transform, opacity;
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
