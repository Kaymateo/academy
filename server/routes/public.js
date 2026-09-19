import { Router } from 'express';
import { db } from '../db.js';
import { createUnlockToken, verifyUnlockToken } from '../auth.js';

export const publicRouter = Router();

/** 首页/课程页可见的分类 */
publicRouter.get('/categories', (_req, res) => {
  const rows = db.prepare('SELECT id, name FROM categories ORDER BY sort, id').all();
  res.json({ ok: true, data: rows });
});

/** 课程列表（仅上架） */
publicRouter.get('/videos', (req, res) => {
  const { category } = req.query;
  const rows = category
    ? db.prepare(`SELECT v.id, v.title, v.description, v.duration, v.category_id,
                         c.name AS category_name, v.cover_path, v.created_at
                  FROM videos v LEFT JOIN categories c ON c.id = v.category_id
                  WHERE v.published = 1 AND v.category_id = ?
                  ORDER BY v.created_at DESC`).all(Number(category))
    : db.prepare(`SELECT v.id, v.title, v.description, v.duration, v.category_id,
                         c.name AS category_name, v.cover_path, v.created_at
                  FROM videos v LEFT JOIN categories c ON c.id = v.category_id
                  WHERE v.published = 1
                  ORDER BY v.created_at DESC`).all();
  res.json({ ok: true, data: rows });
});

/** 课程详情 */
publicRouter.get('/videos/:id', (req, res) => {
  const row = db.prepare(`SELECT v.id, v.title, v.description, v.duration, v.category_id,
                                 c.name AS category_name, v.created_at
                          FROM videos v LEFT JOIN categories c ON c.id = v.category_id
                          WHERE v.id = ? AND v.published = 1`).get(Number(req.params.id));
  if (!row) return res.status(404).json({ ok: false, error: '课程不存在' });
  res.json({ ok: true, data: row });
});

/**
 * 兑换解锁
 * body: { code, courseId, device }
 */
publicRouter.post('/redeem', (req, res) => {
  const { code, courseId, device } = req.body || {};
  const c = String(code || '').trim().toUpperCase();
  if (!c) return res.status(400).json({ ok: false, error: '请输入兑换码' });

  const row = db.prepare('SELECT * FROM codes WHERE code = ?').get(c);
  if (!row) return res.status(404).json({ ok: false, error: '兑换码无效，请核对后重试' });
  if (row.status === 'disabled') return res.status(400).json({ ok: false, error: '该兑换码已被停用' });
  if (row.status === 'used') return res.status(400).json({ ok: false, error: '该兑换码已被使用' });

  const courseIdNum = Number(courseId) || 0;
  if (row.course_id !== 0 && row.course_id !== courseIdNum) {
    return res.status(400).json({ ok: false, error: '该兑换码不适用于此课程' });
  }

  const now = Date.now();
  const expiresAt = new Date(now + row.duration_days * 86400000).toISOString();
  const tx = db.transaction(() => {
    const r = db.prepare(`UPDATE codes SET status='used', device=?, ip=?, used_at=datetime('now'), expires_at=?
                WHERE id=? AND status='unused'`).run(device || null, req.ip || null, expiresAt, row.id);
    if (r.changes === 0) throw new Error('already-used');
    db.prepare(`INSERT INTO redemptions (code_id, code, course_id, device, ip, unlocked_until)
                VALUES (?, ?, ?, ?, ?, ?)`).run(row.id, row.code, row.course_id, device || null, req.ip || null, expiresAt);
  });
  try {
    tx();
  } catch {
    return res.status(409).json({ ok: false, error: '该兑换码刚刚已被使用，请刷新后重试' });
  }

  res.json({
    ok: true,
    data: {
      token: createUnlockToken(row.course_id, expiresAt),
      courseId: row.course_id,
      durationDays: row.duration_days,
      expiresAt,
      message: '兑换成功，课程已解锁',
    },
  });
});

/** 校验解锁 token 是否覆盖某课程 */
publicRouter.post('/verify-unlock', (req, res) => {
  const { token, courseId } = req.body || {};
  const valid = verifyUnlockToken(token, Number(courseId) || 0);
  res.json({ ok: true, data: { valid } });
});
