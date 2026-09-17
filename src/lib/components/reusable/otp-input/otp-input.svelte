<script lang="ts">
	import { cn } from '$lib/utils';

	let {
		value = $bindable(''),
		length = 6,
		id,
		name,
		disabled = false,
		invalid = false,
		autofocus = false,
		class: className,
		'aria-describedby': ariaDescribedby,
		onValueChange,
		onComplete
	}: {
		value?: string;
		length?: number;
		id?: string;
		name?: string;
		disabled?: boolean;
		invalid?: boolean;
		autofocus?: boolean;
		class?: string;
		'aria-describedby'?: string;
		onValueChange?: (value: string) => void;
		onComplete?: (value: string) => void;
	} = $props();

	let boxRefs: (HTMLInputElement | null)[] = $state([]);

	const digits = $derived(
		Array.from({ length }, (_, i) => value[i] ?? '').map((d) => (/\d/.test(d) ? d : ''))
	);

	function setValue(next: string) {
		const clean = next.replace(/\D/g, '').slice(0, length);
		const changed = clean !== value;
		value = clean;
		if (!changed) return;
		onValueChange?.(clean);
		if (clean.length === length) onComplete?.(clean);
	}

	function focusBox(index: number) {
		boxRefs[Math.max(0, Math.min(index, length - 1))]?.focus();
	}

	function handleInput(index: number, event: Event & { currentTarget: HTMLInputElement }) {
		const raw = event.currentTarget.value;
		const enteredDigits = raw.replace(/\D/g, '');

		if (enteredDigits.length > 1) {
			// Fast typing or an IME can deliver multiple characters in one input event — treat it like a paste.
			const merged = (value.slice(0, index) + enteredDigits).slice(0, length);
			setValue(merged);
			focusBox(Math.min(index + enteredDigits.length, length - 1));
			return;
		}

		const chars = value.split('');
		chars[index] = enteredDigits;
		setValue(chars.join(''));

		if (enteredDigits) focusBox(index + 1);
	}

	function handleKeydown(index: number, event: KeyboardEvent) {
		if (event.key === 'Backspace' && !digits[index] && index > 0) {
			event.preventDefault();
			const chars = value.split('');
			chars[index - 1] = '';
			setValue(chars.join(''));
			focusBox(index - 1);
			return;
		}
		if (event.key === 'ArrowLeft' && index > 0) {
			event.preventDefault();
			focusBox(index - 1);
			return;
		}
		if (event.key === 'ArrowRight' && index < length - 1) {
			event.preventDefault();
			focusBox(index + 1);
		}
	}

	function handlePaste(index: number, event: ClipboardEvent) {
		const pasted = event.clipboardData?.getData('text') ?? '';
		if (!pasted) return;
		event.preventDefault();
		const merged = (value.slice(0, index) + pasted.replace(/\D/g, '')).slice(0, length);
		setValue(merged);
		focusBox(merged.length);
	}
</script>

<div class={cn('flex gap-2 sm:gap-2.5', className)} role="group" aria-label="Verification code">
	<input type="hidden" {id} {name} {value} />
	{#each digits as digit, index (index)}
		<!-- svelte-ignore a11y_autofocus -->
		<input
			bind:this={boxRefs[index]}
			type="text"
			inputmode="numeric"
			autocomplete={index === 0 ? 'one-time-code' : 'off'}
			pattern="[0-9]*"
			maxlength={1}
			value={digit}
			{disabled}
			autofocus={autofocus && index === 0}
			aria-invalid={invalid ? 'true' : undefined}
			aria-describedby={ariaDescribedby}
			aria-label={`Digit ${index + 1} of ${length}`}
			class={cn(
				'h-12 w-10 rounded-md border border-input bg-background text-center text-lg font-semibold text-foreground shadow-xs transition-colors sm:h-12 sm:w-11',
				'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
				invalid && 'border-destructive focus-visible:ring-destructive/30',
				disabled && 'cursor-not-allowed opacity-50'
			)}
			oninput={(event) => handleInput(index, event)}
			onkeydown={(event) => handleKeydown(index, event)}
			onpaste={(event) => handlePaste(index, event)}
			onfocus={(event) => event.currentTarget.select()}
		/>
	{/each}
</div>
