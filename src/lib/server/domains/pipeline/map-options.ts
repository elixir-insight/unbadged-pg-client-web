import type { ListPipelinesResponse } from './schema';

export type PipelineDropdownOption = {
	value: string;
	label: string;
};

/** Maps pipeline list data to dropdown options — value is bankPipelineCode, label is name. */
export function toPipelineDropdownOptions(
	response: ListPipelinesResponse | null | undefined
): PipelineDropdownOption[] {
	if (!response?.data?.length) return [];
	return response.data.map((pipeline) => ({
		value: pipeline.bankPipelineCode,
		label: pipeline.name
	}));
}
