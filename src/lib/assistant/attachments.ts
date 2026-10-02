import type { FileUIPart } from 'ai';

export const attachmentTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'text/plain',
];
export const attachmentAccept = '.jpg,.jpeg,.png,.webp,.gif,.pdf,.txt';
export const maxFileBytes = 3 * 1024 * 1024;
export const maxAttachmentBytes = 8 * 1024 * 1024;
export const maxRequestBytes = 24 * 1024 * 1024;

export function validateFiles(files: File[]) {
  if (files.length > 3) throw new Error('Attach up to 3 files per message.');
  if (files.reduce((size, file) => size + file.size, 0) > maxAttachmentBytes)
    throw new Error('Attachments must total 8 MB or less.');
  for (const file of files) {
    if (!attachmentTypes.includes(file.type))
      throw new Error(`${file.name}: choose a JPG, PNG, WebP, GIF, PDF, or TXT file.`);
    if (!file.size) throw new Error(`${file.name} is empty.`);
    if (file.size > maxFileBytes)
      throw new Error(`${file.name} is too large. Each file can be up to 3 MB.`);
  }
}
export async function prepareFiles(files: File[]): Promise<FileUIPart[]> {
  validateFiles(files);
  return Promise.all(
    files.map(
      (file) =>
        new Promise<FileUIPart>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () =>
            resolve({
              type: 'file',
              mediaType: file.type,
              filename: file.name,
              url: String(reader.result),
            });
          reader.onerror = () =>
            reject(new Error(`Could not read ${file.name}. Please attach it again.`));
          reader.readAsDataURL(file);
        }),
    ),
  );
}
