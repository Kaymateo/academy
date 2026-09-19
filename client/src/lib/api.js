/** 管理端 token 持久化 */
const ADMIN_KEY = 'academy_admin_token';
const ADMIN_USER = 'academy_admin_user';

export function getAdminToken() { return localStorage.getItem(ADMIN_KEY); }
export function setAdminSession(token, username) {
  localStorage.setItem(ADMIN_KEY, token);
  localStorage.setItem(ADMIN_USER, username || 'admin');
}
export function clearAdminSession() {
  localStorage.removeItem(ADMIN_KEY);
  localStorage.removeItem(ADMIN_USER);
}
export function getAdminUser() { return localStorage.getItem(ADMIN_USER) || 'admin'; }

/** 统一 fetch 封装 */
async function request(method, url, body, opts = {}) {
  const headers = {};
  const admin = opts.admin ? getAdminToken() : null;
  if (admin) headers.Authorization = `Bearer ${admin}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('网络连接失败，请稍后重试');
  }

  let data = null;
  const text = await res.text();
  try { data = text ? JSON.parse(text) : null; } catch { data = null; }

  if (!res.ok) {
    // 管理会话过期
    if (res.status === 401 && opts.admin) {
      clearAdminSession();
      if (opts.onUnauthorized) opts.onUnauthorized();
    }
    throw new Error(data?.error || `请求失败 (${res.status})`);
  }
  return data;
}

export const api = {
  get: (url, opts = {}) => request('GET', url, undefined, opts),
  post: (url, body, opts = {}) => request('POST', url, body, opts),
  patch: (url, body, opts = {}) => request('PATCH', url, body, opts),
  del: (url, opts = {}) => request('DELETE', url, undefined, opts),
};

/** 上传（multipart） */
export function uploadVideo(formData, onUnauthorized) {
  return fetch('/api/admin/videos', {
    method: 'POST',
    headers: { Authorization: `Bearer ${getAdminToken()}` },
    body: formData,
  }).then(async (res) => {
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) {
      if (res.status === 401 && onUnauthorized) onUnauthorized();
      throw new Error(data?.error || '上传失败');
    }
    return data;
  });
}

/** 时长格式化: 3721 -> 1:02:01 */
export function fmtDuration(sec) {
  const s = Number(sec) || 0;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
  return `${m}:${String(r).padStart(2, '0')}`;
}

/** 相对时间 */
export function timeAgo(iso) {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  const m = Math.floor(diff / 60000);
  if (m < 1) return '刚刚';
  if (m < 60) return `${m} 分钟前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} 小时前`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} 天前`;
  return new Date(iso).toLocaleDateString('zh-CN');
}

export function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('zh-CN', { hour12: false });
}
