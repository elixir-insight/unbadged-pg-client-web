import { getContext, setContext } from 'svelte';
import { SvelteDate } from 'svelte/reactivity';
import { virtualAccounts } from '../data/virtual-accounts';
import { transferMethods } from '../data/transfer-methods';
import type {
	BalanceStatus,
	Beneficiary,
	StepConfig,
	TransferMethod,
	TransferSummary,
	TxnStatus,
	VirtualAccount
} from '../types';
import { formatInr } from '../types';

const TRANSFER_CONTEXT_KEY = Symbol('fund-transfer');

export const DEMO_OTP = '123456';
export const DEMO_FAIL_OTP = '654321';
export const OTP_LENGTH = 6;
export const MAX_OTP_ATTEMPTS = 3;
export const OTP_COUNTDOWN_SECONDS = 600;

const VALID_OTPS = [DEMO_OTP, DEMO_FAIL_OTP] as const;

export type ConfirmStepStatus = 'pending' | 'success' | 'failed';

export class TransferStore {
	selectedAccount = $state<VirtualAccount | null>(null);
	selectedMethod = $state<TransferMethod | null>(null);
	beneficiary = $state<Beneficiary>({
		name: '',
		accountNumber: '',
		confirmAccountNumber: '',
		ifsc: '',
		bankName: '',
		upiId: ''
	});
	amount = $state<number>(0);
	remarks = $state('');
	otpDigits = $state('');
	otpAttempts = $state(0);
	otpError = $state('');
	otpCountdownRemaining = $state(OTP_COUNTDOWN_SECONDS);
	otpCountdownActive = $state(false);
	confirmStepStatus = $state<ConfirmStepStatus>('pending');
	otpVerified = $state(false);
	otpShakeKey = $state(0);
	txnStatus = $state<TxnStatus>('idle');
	txnRef = $state('');
	txnUtr = $state('');
	txnErrorCode = $state('');
	txnFailureReason = $state('');
	txnProcessedAt = $state('');
	currentStepIndex = $state(0);

	private processingTimeout: ReturnType<typeof setTimeout> | null = null;
	private countdownInterval: ReturnType<typeof setInterval> | null = null;

	readonly accounts = virtualAccounts;
	readonly methods = transferMethods;

	readonly stepsConfig = $derived<StepConfig[]>([
		{
			id: 'details',
			label: 'Transfer details',
			sublabel: 'Source, method & beneficiary'
		},
		{
			id: 'review',
			label: 'Review',
			sublabel: 'Verify before confirming'
		},
		{
			id: 'confirm',
			label: 'Confirm',
			sublabel: 'OTP verification'
		}
	]);

	readonly isUpi = $derived(this.selectedMethod?.id === 'UPI');

	readonly balanceStatus = $derived.by((): BalanceStatus => {
		if (!this.selectedAccount || this.amount <= 0) return 'ok';
		const ratio = this.amount / this.selectedAccount.limit;
		if (ratio > 1) return 'error';
		if (ratio >= 0.8) return 'warning';
		return 'ok';
	});

	readonly balanceMessage = $derived.by(() => {
		if (!this.selectedAccount) {
			return 'Select a source account to view available balance.';
		}
		if (this.amount <= 0) {
			return `Available balance: ${formatInr(this.selectedAccount.balance)}`;
		}
		if (this.balanceStatus === 'error') {
			return `Amount exceeds the ${formatInr(this.selectedAccount.limit)} limit for this account.`;
		}
		if (this.balanceStatus === 'warning') {
			return `You are using ${Math.round((this.amount / this.selectedAccount.limit) * 100)}% of the account limit.`;
		}
		return `Transfer within limit. Remaining headroom: ${formatInr(this.selectedAccount.limit - this.amount)}.`;
	});

	readonly isStep1Valid = $derived.by(() => {
		if (!this.selectedAccount || !this.selectedMethod) return false;
		if (this.amount <= 0 || this.amount > this.selectedAccount.limit) return false;

		const { name, accountNumber, confirmAccountNumber, ifsc, bankName, upiId } = this.beneficiary;
		if (!name.trim()) return false;

		if (this.isUpi) {
			return upiId.trim().length > 0;
		}

		return (
			accountNumber.trim().length > 0 &&
			confirmAccountNumber.trim().length > 0 &&
			accountNumber === confirmAccountNumber &&
			ifsc.trim().length > 0 &&
			bankName.trim().length > 0
		);
	});

	readonly step1Hint = $derived.by(() => {
		if (!this.selectedAccount) return 'Select a source virtual account to continue.';
		if (!this.selectedMethod) return 'Choose a transfer method.';
		if (this.amount <= 0) return 'Enter a transfer amount.';
		if (this.amount > this.selectedAccount.limit) return 'Amount exceeds account limit.';
		if (!this.beneficiary.name.trim()) return 'Beneficiary name is required.';
		if (this.isUpi && !this.beneficiary.upiId.trim())
			return 'UPI ID is required for UPI transfers.';
		if (!this.isUpi && !this.beneficiary.accountNumber.trim()) return 'Account number is required.';
		if (!this.isUpi && !this.beneficiary.confirmAccountNumber.trim()) {
			return 'Re-enter the account number to confirm.';
		}
		if (
			!this.isUpi &&
			this.beneficiary.accountNumber.trim() &&
			this.beneficiary.confirmAccountNumber.trim() &&
			this.beneficiary.accountNumber !== this.beneficiary.confirmAccountNumber
		) {
			return 'Account numbers do not match.';
		}
		if (!this.isUpi && (!this.beneficiary.ifsc.trim() || !this.beneficiary.bankName.trim())) {
			return 'Complete all bank account details.';
		}
		return 'All details look good — proceed to review.';
	});

	readonly summary = $derived<TransferSummary>({
		amount: this.amount,
		fromAccount: this.selectedAccount,
		method: this.selectedMethod,
		beneficiary: this.beneficiary,
		remarks: this.remarks,
		reference: this.txnRef,
		status: this.txnStatus,
		userName: 'Priya Sharma',
		userRole: 'Finance Manager',
		utr: this.txnUtr || undefined,
		errorCode: this.txnErrorCode || undefined,
		failureReason: this.txnFailureReason || undefined,
		processedAt: this.txnProcessedAt || undefined
	});

	selectAccount(account: VirtualAccount) {
		this.selectedAccount = account;
	}

	selectMethod(method: TransferMethod) {
		this.selectedMethod = method;
	}

	clearStep1() {
		this.selectedAccount = null;
		this.selectedMethod = null;
		this.beneficiary = {
			name: '',
			accountNumber: '',
			confirmAccountNumber: '',
			ifsc: '',
			bankName: '',
			upiId: ''
		};
		this.amount = 0;
		this.remarks = '';
	}

	goToStep(index: number) {
		const clamped = Math.max(0, Math.min(index, this.stepsConfig.length - 1));
		const update = () => {
			this.currentStepIndex = clamped;
		};

		if (typeof document !== 'undefined' && document.startViewTransition) {
			document.startViewTransition(update);
		} else {
			update();
		}
	}

	nextStep() {
		this.goToStep(this.currentStepIndex + 1);
	}

	prevStep() {
		this.goToStep(this.currentStepIndex - 1);
	}

	private resetTxnDetails() {
		this.txnRef = '';
		this.txnUtr = '';
		this.txnErrorCode = '';
		this.txnFailureReason = '';
		this.txnProcessedAt = '';
	}

	readonly confirmAttemptsRemaining = $derived(MAX_OTP_ATTEMPTS - this.otpAttempts);

	readonly otpInputVisualState = $derived.by((): 'default' | 'success' | 'error' => {
		if (this.otpVerified) return 'success';
		if (this.otpError && this.confirmStepStatus === 'pending') return 'error';
		if (this.confirmStepStatus === 'failed' && !this.otpVerified) return 'error';
		return 'default';
	});

	startOtpCountdown(resetAttempts = false) {
		this.stopOtpCountdown();
		this.stopProcessing();
		this.otpCountdownRemaining = OTP_COUNTDOWN_SECONDS;
		this.otpCountdownActive = true;
		this.otpDigits = '';
		this.otpError = '';
		this.confirmStepStatus = 'pending';
		this.otpVerified = false;
		this.otpShakeKey = 0;
		if (resetAttempts) {
			this.otpAttempts = 0;
		}
		this.txnStatus = 'pending';
		this.resetTxnDetails();

		this.countdownInterval = setInterval(() => {
			if (this.otpCountdownRemaining <= 1) {
				this.otpCountdownRemaining = 0;
				this.otpCountdownActive = false;
				this.stopOtpCountdown();
				return;
			}
			this.otpCountdownRemaining -= 1;
		}, 1000);
	}

	stopOtpCountdown() {
		if (this.countdownInterval) {
			clearInterval(this.countdownInterval);
			this.countdownInterval = null;
		}
	}

	resendOtp() {
		if (this.otpAttempts >= MAX_OTP_ATTEMPTS) return;
		this.startOtpCountdown();
	}

	verifyOtp(code: string): boolean {
		if (this.otpVerified) return false;

		if (this.otpAttempts >= MAX_OTP_ATTEMPTS) {
			this.confirmStepStatus = 'failed';
			this.otpError = 'Maximum OTP attempts exceeded. Please start a new transfer.';
			return false;
		}

		if (!VALID_OTPS.includes(code as (typeof VALID_OTPS)[number])) {
			this.otpAttempts += 1;
			this.otpShakeKey += 1;
			const remaining = MAX_OTP_ATTEMPTS - this.otpAttempts;
			this.otpError =
				remaining > 0
					? `Invalid OTP. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
					: 'Maximum OTP attempts exceeded.';
			this.otpDigits = '';
			if (this.otpAttempts >= MAX_OTP_ATTEMPTS) {
				this.confirmStepStatus = 'failed';
			}
			return false;
		}

		this.otpError = '';
		this.otpVerified = true;
		this.stopOtpCountdown();
		this.completeTransfer(code === DEMO_FAIL_OTP ? 'failure' : 'success');
		return true;
	}

	retryOtpEntry() {
		if (this.confirmStepStatus === 'failed' && !this.otpVerified) {
			this.startOtpCountdown(true);
			return;
		}

		this.otpDigits = '';
		this.otpError = '';
		this.otpShakeKey = 0;
	}

	completeTransfer(outcome: 'success' | 'failure' = 'success') {
		if (this.processingTimeout) {
			clearTimeout(this.processingTimeout);
		}

		const now = new SvelteDate();
		this.txnStatus = 'processing';
		this.txnRef = `ELX-${now.getTime().toString(36).toUpperCase()}`;
		this.txnProcessedAt = now.toISOString();
		this.txnUtr = '';
		this.txnErrorCode = '';
		this.txnFailureReason = '';

		this.processingTimeout = setTimeout(() => {
			if (outcome === 'success') {
				this.txnStatus = 'success';
				this.confirmStepStatus = 'success';
				this.txnUtr = `UTR${now.getTime().toString().slice(-12)}`;
			} else {
				this.txnStatus = 'failed';
				this.confirmStepStatus = 'failed';
				this.txnErrorCode = 'BENEFICIARY_REJECTED';
				this.txnFailureReason =
					'Beneficiary bank rejected the credit. Verify IFSC, account number, or UPI ID and retry.';
			}
			this.processingTimeout = null;
		}, 1500);
	}

	readonly canResendOtp = $derived(
		!this.otpCountdownActive &&
			this.otpCountdownRemaining === 0 &&
			this.otpAttempts < MAX_OTP_ATTEMPTS
	);

	readonly otpProgressValue = $derived((this.otpCountdownRemaining / OTP_COUNTDOWN_SECONDS) * 100);

	readonly isOtpPhase = $derived(this.txnStatus === 'idle' || this.txnStatus === 'pending');

	readonly showBackToReview = $derived(this.confirmStepStatus === 'pending' && !this.otpVerified);

	formatCountdown(): string {
		const minutes = Math.floor(this.otpCountdownRemaining / 60);
		const seconds = this.otpCountdownRemaining % 60;
		return `${minutes}:${seconds.toString().padStart(2, '0')}`;
	}

	stopProcessing() {
		if (this.processingTimeout) {
			clearTimeout(this.processingTimeout);
			this.processingTimeout = null;
		}
	}

	startNewTransfer() {
		this.stopProcessing();
		this.stopOtpCountdown();
		this.txnStatus = 'idle';
		this.confirmStepStatus = 'pending';
		this.otpVerified = false;
		this.otpShakeKey = 0;
		this.resetTxnDetails();
		this.otpDigits = '';
		this.otpAttempts = 0;
		this.otpError = '';
		this.otpCountdownRemaining = OTP_COUNTDOWN_SECONDS;
		this.otpCountdownActive = false;
		this.clearStep1();
		this.goToStep(0);
	}
}

export function createTransferStore(): TransferStore {
	return new TransferStore();
}

export function setTransferStore(store: TransferStore) {
	setContext(TRANSFER_CONTEXT_KEY, store);
}

export function getTransferStore(): TransferStore {
	return getContext<TransferStore>(TRANSFER_CONTEXT_KEY);
}
