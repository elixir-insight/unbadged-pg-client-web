import type { StatusTransition } from './operational-status';

export const ORG_LAYOUT_CONTEXT_KEY = 'org-layout';

export interface OrgLayoutContext {
	bumpRevision: () => void;
	openPutOnHold: () => void;
	openFreeze: () => void;
	openReactivate: () => void;
}

export type { StatusTransition };
