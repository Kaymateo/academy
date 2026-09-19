import crypto from 'node:crypto';

const SECRET = process.env.ACADEMY_SECRET || 'academy-dev-secret-change-me';
const SESSION_TTL = 30 * 60 * 1000; // 30min 会话有效，期间切换前后台无需重复登录
const MAX_UNLOCK_DAYS = 3650;

/** 密码哈希（scrypt，零依赖） */
export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

export function verifyPassword(password, salt, expected) {
  const { hash } = hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(expected));
}

/** 签名数据 -> token */
function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verify(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  const expect = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expect);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

/** 管理员会话 token */
export function createAdminToken(username) {
  return sign({ role: 'admin', u: username, exp: Date.now() + SESSION_TTL });
}

export function verifyAdminToken(token) {
  const p = verify(token);
  if (!p || p.role !== 'admin' || p.exp < Date.now()) return null;
  return p;
}

/** 解锁 token：course_id=0 表示全站课程 */
export function createUnlockToken(courseId, until) {
  const exp = Math.min(new Date(until).getTime(), Date.now() + MAX_UNLOCK_DAYS * 86400000);
  return sign({ t: 'unlock', c: Number(courseId), exp });
}

/**
 * 校验解锁 token 是否覆盖指定课程（含未过期）
 * @returns {boolean}
 */
export function verifyUnlockToken(token, courseId) {
  const p = verify(token);
  if (!p || p.t !== 'unlock' || p.exp < Date.now()) return false;
  const c = Number(p.c);
  return c === 0 || c === Number(courseId);
}
