import {
	REVIEW_TAB_LABEL,
	REVIEW_TABS,
	type FieldReview,
	type ReviewMessage,
	type ReviewSection,
	type ReviewTab,
	type SectionPayload,
	type VerificationStatus
} from './types';
import { buildSectionPayload, isChanged, needsNote, resolveFieldReview, takesNote } from './utils';

const SUBMIT_ERROR = "Couldn't submit this section. Your changes are kept. Try again.";

function isReviewTab(value: string): value is ReviewTab {
	return (REVIEW_TABS as readonly string[]).includes(value);
}

export class KybReviewState {
	saved = $state<Record<string, FieldReview>>({});
	drafts = $state<Record<string, FieldReview>>({});
	activeTab = $state<ReviewTab>('legal');
	submitting = $state(false);
	attempted = $state(false);
	message = $state<ReviewMessage | null>(null);
	leaveTo = $state<ReviewTab | null>(null);
	pendingHref = $state<string | null>(null);
	justSaved = $state<Record<string, true>>({});

	sections: () => ReviewSection[] = () => [];
	onSubmitSection: (payload: SectionPayload) => Promise<void> = async () => {};

	constructor(
		sections: () => ReviewSection[],
		initial: () => Record<string, FieldReview>,
		onSubmitSection: (payload: SectionPayload) => Promise<void>
	) {
		this.sections = sections;
		this.saved = { ...initial() };
		this.onSubmitSection = onSubmitSection;
	}

	/** Adopts freshly loaded verifications; drafts that now match the server are dropped. */
	sync(next: Record<string, FieldReview>) {
		this.saved = { ...next };
		const drafts: Record<string, FieldReview> = {};
		for (const [fieldName, draft] of Object.entries(this.drafts)) {
			if (isChanged(this.reviewFor(fieldName), draft)) drafts[fieldName] = draft;
		}
		this.drafts = drafts;
	}

	label(tab: string): string {
		return isReviewTab(tab) ? REVIEW_TAB_LABEL[tab] : tab;
	}

	reviewFor(fieldName: string): FieldReview {
		return resolveFieldReview(this.saved, fieldName);
	}

	draftFor(fieldName: string): FieldReview {
		return this.drafts[fieldName] ?? this.reviewFor(fieldName);
	}

	isFieldChanged(fieldName: string): boolean {
		const draft = this.drafts[fieldName];
		if (!draft) return false;
		return isChanged(this.reviewFor(fieldName), draft);
	}

	showsSaved(fieldName: string): boolean {
		return this.justSaved[fieldName] === true && !this.isFieldChanged(fieldName);
	}

	showNoteError(fieldName: string): boolean {
		return this.isFieldChanged(fieldName) && needsNote(this.draftFor(fieldName));
	}

	sectionFields(sectionId: string) {
		return this.sections().find((section) => section.id === sectionId)?.fields ?? [];
	}

	unsavedCount(sectionId: string): number {
		return this.sectionFields(sectionId).filter((field) => this.isFieldChanged(field.fieldName))
			.length;
	}

	missingNoteCount(sectionId: string): number {
		return this.sectionFields(sectionId).filter((field) => {
			if (!this.isFieldChanged(field.fieldName)) return false;
			return needsNote(this.draftFor(field.fieldName));
		}).length;
	}

	changeSummary(sectionId: string): string {
		const counts = { verified: 0, rejected: 0, pending: 0 };
		for (const field of this.sectionFields(sectionId)) {
			if (!this.isFieldChanged(field.fieldName)) continue;
			const status = this.draftFor(field.fieldName).status;
			if (status === 'VERIFIED') counts.verified += 1;
			else if (status === 'REJECTED') counts.rejected += 1;
			else counts.pending += 1;
		}

		const parts: string[] = [];
		if (counts.verified > 0) parts.push(`${counts.verified} verify`);
		if (counts.rejected > 0) parts.push(`${counts.rejected} reject`);
		if (counts.pending > 0) parts.push(`${counts.pending} pending`);
		return parts.join(', ');
	}

	unsavedMessage(sectionId: string): string {
		const count = this.unsavedCount(sectionId);
		const noun = count === 1 ? 'change' : 'changes';
		return `${count} unsaved ${noun} in ${this.label(sectionId)}`;
	}

	missingNoteMessage(sectionId: string): string {
		const count = this.missingNoteCount(sectionId);
		const noun = count === 1 ? 'field' : 'fields';
		return `Add a review note to ${count} ${noun} before submitting.`;
	}

	leaveBody(sectionId: string): string {
		const count = this.unsavedCount(sectionId);
		const noun = count === 1 ? 'field' : 'fields';
		const verb = count === 1 ? 'has' : 'have';
		return `${count} ${noun} in ${this.label(sectionId)} ${verb} unsaved changes. Each section is submitted separately.`;
	}

	nextTab(): ReviewTab | null {
		const index = REVIEW_TABS.indexOf(this.activeTab);
		if (index < 0 || index >= REVIEW_TABS.length - 1) return null;
		return REVIEW_TABS[index + 1] ?? null;
	}

	setStatus(fieldName: string, status: VerificationStatus) {
		const saved = this.reviewFor(fieldName);
		const remarks = takesNote(status) && status === saved.status ? saved.remarks : '';
		this.commit(fieldName, { status, remarks });
	}

	setRemarks(fieldName: string, remarks: string) {
		const current = this.draftFor(fieldName);
		if (!takesNote(current.status)) return;
		this.commit(fieldName, { status: current.status, remarks });
	}

	undo(fieldName: string) {
		if (!(fieldName in this.drafts)) return;
		const next = { ...this.drafts };
		delete next[fieldName];
		this.drafts = next;
	}

	promptTab(tab: string) {
		if (!isReviewTab(tab) || tab === this.activeTab) return;
		this.leaveTo = tab;
		this.pendingHref = null;
	}

	promptHref(href: string) {
		this.pendingHref = href;
		this.leaveTo = null;
	}

	stay() {
		if (this.leaveTo === null && this.pendingHref === null) return;
		this.leaveTo = null;
		this.pendingHref = null;
	}

	activate(tab: string) {
		if (!isReviewTab(tab) || tab === this.activeTab) return;
		this.activeTab = tab;
		this.attempted = false;
		this.message = null;
	}

	discardActive() {
		this.clearSectionDrafts(this.activeTab);
		this.attempted = false;
		this.message = null;
	}

	confirmDiscard(): string | null {
		this.discardActive();
		const href = this.pendingHref;
		const tab = this.leaveTo;
		this.leaveTo = null;
		this.pendingHref = null;
		if (tab) this.activeTab = tab;
		return href;
	}

	async submit(thenGoTo?: string): Promise<boolean> {
		const sectionId = this.activeTab;
		if (sectionId === 'review') return true;

		if (this.missingNoteCount(sectionId) > 0) {
			this.attempted = true;
			return false;
		}

		const changes = this.sectionFields(sectionId)
			.filter((field) => this.isFieldChanged(field.fieldName))
			.map((field) => ({
				fieldName: field.fieldName,
				saved: this.reviewFor(field.fieldName),
				draft: { ...this.draftFor(field.fieldName) }
			}));

		const payload = buildSectionPayload(changes);
		if (Object.keys(payload).length === 0) return true;

		this.submitting = true;
		this.message = null;

		try {
			await this.onSubmitSection(payload);
			const nextSaved = { ...this.saved };
			const nextDrafts = { ...this.drafts };
			const nextJustSaved = { ...this.justSaved };

			for (const change of changes) {
				nextSaved[change.fieldName] = {
					status: change.draft.status,
					remarks: takesNote(change.draft.status) ? change.draft.remarks.trim() : ''
				};
				delete nextDrafts[change.fieldName];
				nextJustSaved[change.fieldName] = true;
			}

			this.saved = nextSaved;
			this.drafts = nextDrafts;
			this.justSaved = nextJustSaved;
			this.attempted = false;

			const count = changes.length;
			const noun = count === 1 ? 'field' : 'fields';
			const movingOn = Boolean(thenGoTo && isReviewTab(thenGoTo));
			this.message = movingOn
				? null
				: {
						type: 'success',
						text: `${this.label(sectionId)} review submitted. ${count} ${noun} updated.`
					};

			if (movingOn && thenGoTo && isReviewTab(thenGoTo)) {
				this.activeTab = thenGoTo;
			}

			this.leaveTo = null;
			this.pendingHref = null;
			return true;
		} catch (error) {
			const serverMessage = error instanceof Error ? error.message.trim() : '';
			this.message = {
				type: 'error',
				text: serverMessage || SUBMIT_ERROR
			};
			return false;
		} finally {
			this.submitting = false;
		}
	}

	private commit(fieldName: string, next: FieldReview) {
		const saved = this.reviewFor(fieldName);

		if (!isChanged(saved, next)) {
			if (!(fieldName in this.drafts)) return;
			const rest = { ...this.drafts };
			delete rest[fieldName];
			this.drafts = rest;
			return;
		}

		const withoutMark = { ...this.justSaved };
		delete withoutMark[fieldName];
		this.justSaved = withoutMark;
		this.drafts = { ...this.drafts, [fieldName]: next };
	}

	private clearSectionDrafts(sectionId: string) {
		const names = this.sectionFields(sectionId).map((field) => field.fieldName);
		const next: Record<string, FieldReview> = {};
		for (const [fieldName, draft] of Object.entries(this.drafts)) {
			if (!names.includes(fieldName)) next[fieldName] = draft;
		}
		this.drafts = next;
	}
}
