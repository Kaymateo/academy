/** 轻量 SVG 图标集（线性风格，与 Apple 设计语言一致） */

const base = {
  fill: 'none', stroke: 'currentColor',
  strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round',
};

export const IconPlay = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}><path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke="none" /></svg>
);

export const IconLock = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <rect x="5" y="11" width="14" height="9" rx="2.5" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

export const IconUnlock = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <rect x="5" y="11" width="14" height="9" rx="2.5" />
    <path d="M8 11V8a4 4 0 0 1 7.5-1.9" />
    <path d="M8 15.5h.01M12 15.5h.01M16 15.5h.01" strokeWidth={2.4} />
  </svg>
);

export const IconTicket = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z" />
    <path d="M14 6v12" strokeDasharray="2.5 2.5" />
  </svg>
);

export const IconCheck = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}><path d="M5 13l4 4L19 7" strokeWidth={2.4} /></svg>
);

export const IconX = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}><path d="M6 6l12 12M18 6L6 18" /></svg>
);

export const IconInfo = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" strokeWidth={2.4} />
  </svg>
);

export const IconDownload = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M12 3v12m0 0l-4.5-4.5M12 15l4.5-4.5" />
    <path d="M4 19h16" />
  </svg>
);

export const IconPlus = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}><path d="M12 5v14M5 12h14" strokeWidth={2.2} /></svg>
);

export const IconTrash = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M4 7h16M10 7V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2M6 7l1 13h10l1-13" />
  </svg>
);

export const IconEdit = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M4 20h4L20 8a2.1 2.1 0 0 0-3-3L5 17z" />
    <path d="M14.5 6.5l3 3" />
  </svg>
);

export const IconArrowRight = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}><path d="M5 12h14m-6-6l6 6-6 6" /></svg>
);

export const IconVideo = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <rect x="3" y="5" width="14" height="14" rx="2.5" />
    <path d="M17 10.5l4-2.5v8l-4-2.5" />
  </svg>
);

export const IconGauge = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M12 14l4-4" />
    <path d="M4 18a8 8 0 1 1 16 0" />
    <circle cx="12" cy="14" r="1.4" fill="currentColor" stroke="none" />
  </svg>
);

export const IconSparkle = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
    <path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" />
  </svg>
);

export const IconDashboard = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.6" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.6" />
  </svg>
);

export const IconKey = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <circle cx="8" cy="15.5" r="4.5" />
    <path d="M11.5 12L20 3.5m-3.5 3.5l3 3m-6 -6l2 2" />
  </svg>
);

export const IconBook = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15.5H6.5A2.5 2.5 0 0 0 4 21z" />
    <path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20" />
  </svg>
);

export const IconLogout = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" />
    <path d="M15 8l4 4-4 4M10 12h9" />
  </svg>
);

export const IconSearch = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M16.5 16.5L21 21" />
  </svg>
);

export const IconLogo = (p) => (
  <svg viewBox="0 0 32 32" {...p}>
    <defs>
      <linearGradient id="lg1" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#5b8cff" />
        <stop offset="100%" stopColor="#a855f7" />
      </linearGradient>
    </defs>
    <rect x="2" y="2" width="28" height="28" rx="9" fill="url(#lg1)" />
    <path d="M11 20.5V11.5l9 4.5z" fill="#fff" />
  </svg>
);
