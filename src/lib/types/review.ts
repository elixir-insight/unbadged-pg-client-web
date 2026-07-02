export type SystemFlag = {
	field: string;
	checkName: string;
	message: string;
	severity: 'error' | 'warning';
};

export type NoteCategory = 'observation' | 'concern' | 'change_required';

export type ReviewerNote = {
	field: string;
	reviewerName: string;
	reviewerInitials: string;
	timestamp: string;
	note: string;
	category?: NoteCategory;
};

export type FieldData = {
	key: string;
	label: string;
	value: string;
	systemFlag?: SystemFlag;
	reviewerNote?: ReviewerNote;
};

export type SectionStatus = 'IN_REVIEW' | 'CHANGES_REQUESTED' | 'APPROVED';

export type ReviewSection = {
	id: string;
	label: string;
	subLabel: string;
	icon: string;
	fields: FieldData[];
	systemFlags: SystemFlag[];
	unresolvedCount: number;
	status: SectionStatus;
	resubmitted?: boolean;
	changeRequestNote?: string;
};
