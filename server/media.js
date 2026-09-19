import fs from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { VIDEOS_DIR, PREVIEWS_DIR, COVERS_DIR } from './db.js';

const run = promisify(execFile);
const PREVIEW_SECONDS = 60;

/** 探测视频时长（秒） */
export async function probeDuration(filePath) {
  try {
    const { stdout } = await run('ffprobe', [
      '-v', 'error', '-show_entries', 'format=duration',
      '-of', 'json', filePath,
    ]);
    const data = JSON.parse(stdout);
    return Math.round(Number(data?.format?.duration || 0));
  } catch {
    return 0;
  }
}

/** 用 ffmpeg 截取前 60 秒生成预览片段（失败不阻塞上传） */
export async function makePreview(videoId, videoPath) {
  const out = `${PREVIEWS_DIR}/${videoId}_preview.mp4`;
  try {
    await run('ffmpeg', [
      '-y', '-i', videoPath,
      '-t', String(PREVIEW_SECONDS),
      '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '28',
      '-c:a', 'aac', '-b:a', '96k',
      '-movflags', '+faststart',
      out,
    ]);
    return out;
  } catch {
    return null;
  }
}

/** 上传文件落盘：kind = 'video' | 'cover' */
export function storeFile(originalName, buffer, kind) {
  const ext = (pathExt(originalName) || 'bin').toLowerCase();
  const filename = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const dir = kind === 'cover' ? COVERS_DIR : VIDEOS_DIR;
  const full = `${dir}/${filename}`;
  fs.writeFileSync(full, buffer);
  return { path: full, url: `/api/files/${kind}/${filename}` };
}

function pathExt(name) {
  const i = String(name).lastIndexOf('.');
  return i >= 0 ? String(name).slice(i + 1) : '';
}
