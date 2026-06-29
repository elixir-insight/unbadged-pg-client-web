export interface OnboardingDraft {
	id: string;
	name: string;
	category: 'Merchant' | 'Partner';
	businessType: string;
	phone: string;
	email: string;
	serviceTypes: string[];
	bankPipelines: string[];
	affiliateId: string;
	status: 'In Progress';
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
	getById(id: string): OnboardingDraft | undefined {
		return drafts.find((d) => d.id === id);
	}
};
