export interface OnboardingDraft {
	id: string;
	name: string;
	profileType: 'MERCHANT' | 'PARTNER';
	businessType: string;
	phone: string;
	email: string;
	serviceTypes: string[];
	bankPipelines: string[];
	affiliateId: string;
	status: 'IN_PROGRESS' | 'APPROVED';
	createdAt: string;
}

let drafts = $state<OnboardingDraft[]>([]);

export const onboardingDrafts = {
	get all() {
		return drafts;
	},
	add(draft: OnboardingDraft) {
		drafts = [...drafts, draft];
	},
	getById(id: string | undefined): OnboardingDraft | undefined {
		return drafts.find((d) => d.id === id);
	},
	updateStatus(id: string | undefined, status: OnboardingDraft['status']) {
		drafts = drafts.map((d) => (d.id === id ? { ...d, status } : d));
	}
};
