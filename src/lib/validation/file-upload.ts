export const MAX_UPLOAD_FILE_SIZE_BYTES = 20 * 1024 * 1024;
export const MAX_UPLOAD_FILE_SIZE_LABEL = '20MB';

export function isFileTooLarge(file: File): boolean {
	return file.size > MAX_UPLOAD_FILE_SIZE_BYTES;
}
