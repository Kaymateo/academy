import { useEffect } from 'react';
import { IconCheck, IconX, IconInfo } from './Icons.jsx';

const ICONS = {
  success: <IconCheck />,
  error: <IconX />,
  info: <IconInfo />,
};

/**
 * 通用弹窗：柔和圆角 + 缩放淡入
 * props: open, onClose, type('success'|'error'|'info'), title, children, actions
 */
export default function Modal({ open, onClose, type = 'info', title, children, actions }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-mask" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="modal" role="dialog" aria-modal="true">
        {type && (
          <div className={`modal-icon ${type}`}>{ICONS[type] || ICONS.info}</div>
        )}
        <h3>{title}</h3>
        <div>{children}</div>
        {actions}
      </div>
    </div>
  );
}
