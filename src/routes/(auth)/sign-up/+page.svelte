<script lang="ts">
	import { enhance } from '$app/forms';
	import { untrack } from 'svelte';
	import type { SubmitFunction } from '@sveltejs/kit';
	import type { PageProps } from './$types';
	import { Button } from '$lib/components/ui/button';
	import {
		Input,
		PhoneInput,
		PasswordChecklist,
		CardSelect,
		toast,
		type CardSelectOption
	} from '$lib/components/reusable';
	import { CompanyLogoLight } from '$lib/assets/icons';
	import { ArrowLeft, Eye, EyeOff } from '$lib/assets/icons';
	import {
		SIGN_UP_BUSINESS_TYPES,
		isSignUpFormValid,
		validateSignUp,
		validateSignUpField,
		type SignUpBusinessType,
		type SignUpField,
		type SignUpInput
	} from '$lib/validation/sign-up';

	const BUSINESS_TYPE_DESCRIPTIONS: Record<SignUpBusinessType, string> = {
		SOLE_PROPRIETORSHIP: 'Owned by one person. KYC needs the owner’s PAN and Aadhaar.',
		PRIVATE_LIMITED: 'Registered under the Companies Act. KYC needs the CIN and director PAN.',
		LIMITED_LIABILITY_PARTNERSHIP: 'Registered with the MCA. KYC needs the LLPIN and partner PAN.',
		PARTNERSHIP: 'Shared ownership between partners. KYC needs the deed and partner PAN.'
	};

	let { form }: PageProps = $props();

	const STEP_1_FIELDS: SignUpField[] = ['userEmail', 'phoneNumber', 'password'];
	const STEP_2_FIELDS: SignUpField[] = ['legalCompanyName', 'businessType'];

	const BUSINESS_TYPE_DISPLAY_ORDER: SignUpBusinessType[] = [
		'SOLE_PROPRIETORSHIP',
		'PRIVATE_LIMITED',
		'LIMITED_LIABILITY_PARTNERSHIP',
		'PARTNERSHIP'
	];
	const businessTypeOptions: CardSelectOption[] = BUSINESS_TYPE_DISPLAY_ORDER.map((value) => {
		const option = SIGN_UP_BUSINESS_TYPES.find((o) => o.value === value)!;
		return {
			value: option.value,
			label: option.label,
			description: BUSINESS_TYPE_DESCRIPTIONS[value]
		};
	});

	let currentStep = $state<1 | 2>(1);
	let legalCompanyName = $state('');
	let businessType = $state('');
	let userEmail = $state('');
	let phoneNumber = $state('');
	let password = $state('');
	let showPassword = $state(false);
	let submitting = $state(false);
	let formError = $state<string | null>(null);
	let fieldErrors = $state<Partial<Record<SignUpField, string>>>({});
	let touched = $state<Partial<Record<SignUpField, boolean>>>({});
	let focusedField = $state<SignUpField | null>(null);

	const values: SignUpInput = $derived({
		legalCompanyName,
		businessType,
		userEmail,
		phoneNumber,
		password,
		affiliateId: ''
	});
	const isFormValid = $derived(isSignUpFormValid(values));
	const isStep1Valid = $derived(
		STEP_1_FIELDS.every((field) => !validateSignUpField(field, values))
	);

	$effect(() => {
		if (!form) return;
		if (form.legalCompanyName !== undefined) legalCompanyName = form.legalCompanyName;
		if (form.businessType !== undefined) businessType = form.businessType;
		if (form.userEmail !== undefined) userEmail = form.userEmail.trim().toLowerCase();
		if (form.phoneNumber !== undefined) phoneNumber = form.phoneNumber;

		const errors = form.errors ?? {};
		fieldErrors = errors;
		touched = {
			...untrack(() => touched),
			...Object.fromEntries(Object.keys(errors).map((f) => [f, true]))
		};
		formError = form.message ?? null;
		if (STEP_1_FIELDS.some((field) => errors[field])) currentStep = 1;
		else if (STEP_2_FIELDS.some((field) => errors[field])) currentStep = 2;
	});

	function clearFieldError(field: SignUpField) {
		if (fieldErrors[field]) {
			const next = { ...fieldErrors };
			delete next[field];
			fieldErrors = next;
		}
	}

	function clearError(field: SignUpField) {
		clearFieldError(field);
		if (formError) formError = null;
	}

	function handleFocus(field: SignUpField) {
		focusedField = field;
	}

	function handleBlur(field: SignUpField) {
		focusedField = null;
		if (field === 'legalCompanyName') legalCompanyName = legalCompanyName.trim();
		if (field === 'userEmail') userEmail = userEmail.trim().toLowerCase();

		touched = { ...touched, [field]: true };
		const error = validateSignUpField(field, values);
		if (error) {
			fieldErrors = { ...fieldErrors, [field]: error };
		} else {
			clearFieldError(field);
		}
	}

	function isFieldEmpty(field: SignUpField): boolean {
		return values[field].trim().length === 0;
	}

	function showError(field: SignUpField): boolean {
		return Boolean(touched[field] && fieldErrors[field] && !isFieldEmpty(field));
	}

	function isInvalid(field: SignUpField): boolean {
		return showError(field) && focusedField !== field;
	}

	function focusField(field: SignUpField) {
		if (field === 'businessType') {
			document.querySelector<HTMLElement>('[aria-labelledby="businessType-label"] button')?.focus();
			return;
		}
		document.getElementById(field)?.focus();
	}

	function goToStep2() {
		userEmail = userEmail.trim().toLowerCase();
		currentStep = 2;
	}

	function backToStep1() {
		currentStep = 1;
	}

	const onEnhance: SubmitFunction = ({ cancel }) => {
		legalCompanyName = legalCompanyName.trim();
		userEmail = userEmail.trim().toLowerCase();

		const errors = validateSignUp(values);
		if (Object.keys(errors).length > 0) {
			fieldErrors = errors;
			touched = {
				...touched,
				...Object.fromEntries(Object.keys(errors).map((field) => [field, true]))
			};
			formError = null;
			const firstInvalid =
				STEP_1_FIELDS.find((field) => errors[field]) ??
				STEP_2_FIELDS.find((field) => errors[field]);
			if (firstInvalid) {
				currentStep = STEP_1_FIELDS.includes(firstInvalid) ? 1 : 2;
				queueMicrotask(() => focusField(firstInvalid));
			}
			cancel();
			return;
		}

		submitting = true;
		formError = null;
		return async ({ result, update }) => {
			submitting = false;
			if (result.type === 'redirect') {
				toast.success('Account created. Check your email for a code.', { position: 'top-right' });
			}
			await update({ reset: false });
		};
	};
</script>

<main class="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 sm:px-8 lg:px-10">
	<div class="min-h-0 flex-1" aria-hidden="true"></div>
	<div class="mx-auto w-full max-w-xl shrink-0 py-2 sm:py-4">
		<div class="flex w-full flex-col gap-6 sm:gap-8 [@media(max-height:700px)]:gap-4">
			<div>
				<CompanyLogoLight width="160" class="h-auto w-36 sm:w-40" />
			</div>

			<div class="flex flex-col gap-5 sm:gap-6 [@media(max-height:700px)]:gap-4">
				<div class="flex flex-col gap-1.5 sm:gap-2">
					<h1 class="text-2xl font-semibold tracking-tight text-gray-700 sm:text-3xl">
						Create your account
					</h1>
					<p class="text-sm text-muted-foreground sm:text-base">
						{currentStep === 1
							? 'Set up your business account to get started.'
							: 'Just a few business details to finish setting up.'}
					</p>
				</div>

				{#if formError}
					<p class="text-sm text-destructive" role="alert">{formError}</p>
				{/if}

				<form
					method="POST"
					action="?/signup"
					class="flex flex-col gap-5 sm:gap-6"
					novalidate
					use:enhance={onEnhance}
				>
					<div class="flex flex-col gap-4 sm:gap-5" hidden={currentStep !== 1}>
						<div class="flex flex-col gap-2">
							<label class="text-base font-normal text-gray-700 sm:text-lg" for="userEmail">
								Work Email
							</label>
							<Input
								id="userEmail"
								name="userEmail"
								type="email"
								placeholder="name@company.com"
								bind:value={userEmail}
								autocomplete="email"
								disabled={submitting}
								aria-invalid={isInvalid('userEmail') ? 'true' : undefined}
								aria-describedby={showError('userEmail') ? 'userEmail-error' : undefined}
								class="h-11 text-base!"
								oninput={() => clearError('userEmail')}
								onfocus={() => handleFocus('userEmail')}
								onblur={() => handleBlur('userEmail')}
							/>
							{#if showError('userEmail')}
								<p id="userEmail-error" class="text-sm text-destructive" role="alert">
									{fieldErrors.userEmail}
								</p>
							{/if}
						</div>

						<div class="flex flex-col gap-2">
							<label class="text-base font-normal text-gray-700 sm:text-lg" for="phoneNumber">
								Phone Number
							</label>
							<PhoneInput
								id="phoneNumber"
								name="phoneNumber"
								placeholder="9876543210"
								bind:value={phoneNumber}
								autocomplete="tel-national"
								disabled={submitting}
								invalid={isInvalid('phoneNumber')}
								aria-invalid={isInvalid('phoneNumber') ? 'true' : undefined}
								aria-describedby={showError('phoneNumber') ? 'phoneNumber-error' : undefined}
								class="h-11!"
								onValueChange={() => clearError('phoneNumber')}
								onfocus={() => handleFocus('phoneNumber')}
								onblur={() => handleBlur('phoneNumber')}
							/>
							{#if showError('phoneNumber')}
								<p id="phoneNumber-error" class="text-sm text-destructive" role="alert">
									{fieldErrors.phoneNumber}
								</p>
							{/if}
						</div>

						<div class="flex flex-col gap-2">
							<label class="text-base font-normal text-gray-700 sm:text-lg" for="password">
								Password
							</label>
							<div class="relative">
								<Input
									id="password"
									name="password"
									type={showPassword ? 'text' : 'password'}
									placeholder="Enter Password"
									bind:value={password}
									autocomplete="new-password"
									disabled={submitting}
									aria-invalid={isInvalid('password') ? 'true' : undefined}
									aria-describedby="password-hint"
									class="h-11 pr-11 text-base!"
									oninput={() => clearError('password')}
									onfocus={() => handleFocus('password')}
									onblur={() => handleBlur('password')}
								/>
								<button
									type="button"
									onclick={() => (showPassword = !showPassword)}
									class="absolute top-1/2 right-3.5 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
									aria-label={showPassword ? 'Hide password' : 'Show password'}
								>
									{#if showPassword}
										<EyeOff class="h-4 w-4" />
									{:else}
										<Eye class="h-4 w-4" />
									{/if}
								</button>
							</div>
							<div id="password-hint">
								{#if isInvalid('password')}
									<p class="text-sm text-destructive" role="alert">{fieldErrors.password}</p>
								{:else if password.length === 0}
									<p class="text-sm text-muted-foreground">
										Use 12–50 characters with an uppercase and lowercase letter, a number, and a
										symbol.
									</p>
								{:else}
									<PasswordChecklist {password} />
								{/if}
							</div>
						</div>

						<Button
							type="button"
							class="h-11 min-h-11 w-full shrink-0 text-base"
							disabled={!isStep1Valid}
							onclick={goToStep2}
						>
							Continue
						</Button>

						<p class="text-center text-xs text-muted-foreground sm:text-sm">
							Already have an account?
							<Button variant="link" href="/login" class="h-auto p-0 text-xs sm:text-sm">
								Sign in
							</Button>
						</p>
					</div>

					<div class="flex flex-col gap-4 sm:gap-5" hidden={currentStep !== 2}>
						<div class="flex flex-col gap-2">
							<label class="text-base font-normal text-gray-700 sm:text-lg" for="legalCompanyName">
								Legal Company Name
							</label>
							<Input
								id="legalCompanyName"
								name="legalCompanyName"
								type="text"
								placeholder="Enter legal company name"
								bind:value={legalCompanyName}
								autocomplete="organization"
								disabled={submitting}
								aria-invalid={isInvalid('legalCompanyName') ? 'true' : undefined}
								aria-describedby={showError('legalCompanyName')
									? 'legalCompanyName-error'
									: undefined}
								class="h-11 text-base!"
								oninput={() => clearError('legalCompanyName')}
								onfocus={() => handleFocus('legalCompanyName')}
								onblur={() => handleBlur('legalCompanyName')}
							/>
							{#if showError('legalCompanyName')}
								<p id="legalCompanyName-error" class="text-sm text-destructive" role="alert">
									{fieldErrors.legalCompanyName}
								</p>
							{:else}
								<p class="text-sm text-muted-foreground">
									Must exactly match the name on your registration documents — this is checked
									during KYC review.
								</p>
							{/if}
						</div>

						<div class="flex flex-col gap-2">
							<span class="text-base font-normal text-gray-700 sm:text-lg" id="businessType-label">
								Business Type
							</span>
							<input type="hidden" name="businessType" value={businessType} />
							<CardSelect
								bind:value={businessType}
								options={businessTypeOptions}
								disabled={submitting}
								aria-labelledby="businessType-label"
								onfocusin={() => handleFocus('businessType')}
								onfocusout={() => handleBlur('businessType')}
							/>
							{#if showError('businessType')}
								<p id="businessType-error" class="text-sm text-destructive" role="alert">
									{fieldErrors.businessType}
								</p>
							{/if}
						</div>

						<div class="flex items-center gap-3">
							<Button
								type="button"
								variant="outline"
								class="h-11 min-h-11 flex-1 gap-1.5"
								onclick={backToStep1}
							>
								<ArrowLeft class="h-4 w-4" />
								Back
							</Button>
							<Button
								type="submit"
								class="h-11 min-h-11 flex-1 text-base"
								disabled={submitting || !isFormValid}
							>
								{submitting ? 'Creating account…' : 'Create account'}
							</Button>
						</div>
					</div>
				</form>
			</div>
		</div>
	</div>
	<div class="min-h-0 flex-1" aria-hidden="true"></div>
</main>

<footer
	class="flex shrink-0 flex-col gap-4 bg-background px-5 py-4 text-center sm:gap-6 sm:px-8 lg:px-10"
>
	<p class="text-xs text-muted-foreground sm:text-sm">
		<a
			href="https://elixirpay.in/terms"
			target="_blank"
			class="underline underline-offset-4 hover:text-foreground"
		>
			Terms and Conditions
		</a>
		<span class="mx-3 text-border" aria-hidden="true">|</span>
		<a
			href="https://elixirpay.in/privacy"
			target="_blank"
			class="underline underline-offset-4 hover:text-foreground"
		>
			Privacy Policy
		</a>
	</p>
	<p class="text-xs text-muted-foreground sm:text-sm">
		© 2026 ElixirPay • Secure Payment Gateway Platform
	</p>
</footer>
