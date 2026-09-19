/**
 * 解锁状态本地管理
 * 结构: { "0": token, "12": token }  — key 为 course_id，0 表示全站通用码
 */
const KEY = 'academy_unlocks';

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
}
function save(map) { localStorage.setItem(KEY, JSON.stringify(map)); }

export function getUnlockToken(courseId) {
  const map = load();
  return map[courseId] || map[0] || null;
}

export function setUnlockToken(courseId, token) {
  const map = load();
  map[courseId] = token;
  save(map);
}

export function clearUnlocks() { localStorage.removeItem(KEY); }

/** 本地乐观判断是否已解锁（最终以服务端校验为准） */
export function hasLocalUnlock(courseId) {
  return Boolean(getUnlockToken(courseId));
}
