export const ORG_LAYOUT_CONTEXT_KEY = 'org-layout';

export interface OrgLayoutContext {
	bumpRevision: () => void;
	openChangeStatus: () => void;
}
