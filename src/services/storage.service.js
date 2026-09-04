const crypto = require('crypto');
const path = require('path');
const { getSupabase } = require('../config/supabase');
const { env } = require('../config/env');
const AppError = require('../utils/AppError');
const fs = require('fs/promises');

const EXTENSIONS_BY_MIME = Object.freeze({
  'application/pdf': '.pdf',
  'application/vnd.ms-powerpoint': '.ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
});

const cleanDisplayName = (name) => path.basename(name || 'resource').replace(/[^a-zA-Z0-9._ -]/g, '_').slice(0, 180);

function validateResourceFile(file) {
  const expectedExtension = EXTENSIONS_BY_MIME[file?.mimetype];
  const suppliedExtension = path.extname(file?.originalname || '').toLowerCase();
  if (!expectedExtension || suppliedExtension !== expectedExtension) {
    throw new AppError(400, 'INVALID_FILE_TYPE', 'File type and extension must be PDF, PPT, PPTX, DOC, or DOCX');
  }
  const buffer = file.buffer || Buffer.alloc(0);
  const isPdf = buffer.subarray(0, 5).toString('ascii') === '%PDF-';
  const isZipOffice = buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04;
  const isLegacyOffice = buffer.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]));
  const signatureValid = file.mimetype === 'application/pdf'
    ? isPdf
    : expectedExtension.endsWith('x') ? isZipOffice : isLegacyOffice;
  if (!signatureValid) throw new AppError(400, 'INVALID_FILE_CONTENT', 'The uploaded file content does not match its declared type');
  return expectedExtension;
}

async function uploadResource(file, userId) {
  const extension = validateResourceFile(file);
  const storagePath = `${userId}/${crypto.randomUUID()}${extension}`;
  const supabase = getSupabase();
  const { error } = await supabase.storage.from(env.resourceBucket).upload(storagePath, file.buffer, {
    contentType: file.mimetype,
    upsert: false,
  });
  if (error) throw new AppError(502, 'STORAGE_UPLOAD_FAILED', 'The file could not be stored');
  return {
    storagePath,
    originalFileName: cleanDisplayName(file.originalname),
    mimeType: file.mimetype,
    fileSize: file.size,
  };
}

async function createResourceDownloadUrl(storagePath) {
  const supabase = getSupabase();
  const { data, error } = await supabase.storage
    .from(env.resourceBucket)
    .createSignedUrl(storagePath, env.signedUrlTtlSeconds);
  if (error || !data?.signedUrl) throw new AppError(502, 'SIGNED_URL_FAILED', 'A download link could not be created');
  return data.signedUrl;
}

async function deleteResourceFile(storagePath) {
  if (!storagePath) return;
  const { error } = await getSupabase().storage.from(env.resourceBucket).remove([storagePath]);
  if (error) throw new AppError(502, 'STORAGE_DELETE_FAILED', 'The stored file could not be removed');
}

const IMAGE_EXTENSIONS = Object.freeze({ 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' });

async function uploadLostFoundImage(file, userId) {
  const extension = IMAGE_EXTENSIONS[file?.mimetype];
  if (!extension || path.extname(file.originalname || '').toLowerCase() !== extension && !(file.mimetype === 'image/jpeg' && path.extname(file.originalname || '').toLowerCase() === '.jpeg')) {
    throw new AppError(400, 'INVALID_IMAGE_TYPE', 'Image type and extension must match JPEG, PNG, or WebP');
  }
  const buffer = file.buffer || Buffer.alloc(0);
  const jpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const png = buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const webp = buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  if (!(file.mimetype === 'image/jpeg' && jpeg) && !(file.mimetype === 'image/png' && png) && !(file.mimetype === 'image/webp' && webp)) {
    throw new AppError(400, 'INVALID_IMAGE_CONTENT', 'The uploaded image content does not match its declared type');
  }
  const storagePath = `${userId}/${crypto.randomUUID()}${extension}`;
  if (env.supabaseUrl && env.supabaseServiceKey) {
    const supabase = getSupabase();
    const { error } = await supabase.storage.from(env.lostFoundBucket).upload(storagePath, file.buffer, { contentType: file.mimetype, upsert: false });
    if (error) throw new AppError(502, 'STORAGE_UPLOAD_FAILED', 'The image could not be stored');
    const { data } = supabase.storage.from(env.lostFoundBucket).getPublicUrl(storagePath);
    return { imageUrl: data.publicUrl, imageStoragePath: storagePath };
  }
  const relativePath = path.posix.join('uploads', 'lost-found', `${crypto.randomUUID()}${extension}`);
  const absolutePath = path.resolve(process.cwd(), ...relativePath.split('/'));
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, file.buffer, { flag: 'wx' });
  return { imageUrl: `/${relativePath}`, imageStoragePath: `local:${absolutePath}` };
}

async function deleteLostFoundImage(storagePath) {
  if (!storagePath) return;
  if (storagePath.startsWith('local:')) {
    await fs.unlink(storagePath.slice(6)).catch((error) => {
      if (error.code !== 'ENOENT') throw error;
    });
    return;
  }
  const { error } = await getSupabase().storage.from(env.lostFoundBucket).remove([storagePath]);
  if (error) throw new AppError(502, 'STORAGE_DELETE_FAILED', 'The stored image could not be removed');
}

module.exports = { validateResourceFile, uploadResource, createResourceDownloadUrl, deleteResourceFile, uploadLostFoundImage, deleteLostFoundImage };
