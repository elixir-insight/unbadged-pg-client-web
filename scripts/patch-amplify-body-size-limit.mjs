import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/** Keep in sync with MAX_UPLOAD_FILE_SIZE_BYTES in src/lib/validation/file-upload.ts */
const MAX_UPLOAD_FILE_SIZE_BYTES = 20 * 1024 * 1024;

const handlerPath = join('build', 'compute', 'default', 'handler.js');

if (!existsSync(handlerPath)) {
	console.log('amplify handler not found — skipping BODY_SIZE_LIMIT patch');
	process.exit(0);
}

let handler = readFileSync(handlerPath, 'utf8');
const handlerPattern = /parseInt\(env\(["']BODY_SIZE_LIMIT["'],\s*["']524288["']\)\)/;

if (!handlerPattern.test(handler)) {
	console.warn('amplify handler BODY_SIZE_LIMIT default not found — skipping handler patch');
	process.exit(0);
}

handler = handler.replace(
	handlerPattern,
	`parseInt(env("BODY_SIZE_LIMIT", "${MAX_UPLOAD_FILE_SIZE_BYTES}"))`
);
writeFileSync(handlerPath, handler);
console.log(
	`Patched amplify handler default BODY_SIZE_LIMIT to ${MAX_UPLOAD_FILE_SIZE_BYTES} bytes (20MB)`
);
