import { ThemeConfig } from '../types';

export interface ThemePresetInfo {
  id: string;
  label: string;
  description: string;
  bgBase: string;
  bgSurface: string;
  bgCard: string;
  borderColor: string;
  accent: string;
  textMain: string;
  textMuted: string;
  isLight?: boolean;
}

export const THEME_PRESETS: Record<string, ThemePresetInfo> = {
  navy: {
    id: 'navy',
    label: 'Xanh Hải Quân (Mặc định)',
    description: 'Tông màu xanh thẫm hiện đại, chiều sâu công nghệ và chống mỏi mắt',
    bgBase: '#0D1B2A',
    bgSurface: '#131F2E',
    bgCard: '#1B263B',
    borderColor: '#27384E',
    accent: '#00E5FF',
    textMain: '#F8F9FA',
    textMuted: '#778DA9'
  },
  slate: {
    id: 'slate',
    label: 'Đá Phiến Tối Giản',
    description: 'Tông xám than trung tính, tập trung cao độ khi đọc và làm bài',
    bgBase: '#0B1120',
    bgSurface: '#111827',
    bgCard: '#1E293B',
    borderColor: '#334155',
    accent: '#38BDF8',
    textMain: '#F8FAFC',
    textMuted: '#94A3B8'
  },
  canvas: {
    id: 'canvas',
    label: 'Bảng Đen Sư Phạm',
    description: 'Tông xanh rêu phấn bảng trường học, mang lại cảm giác thân thuộc',
    bgBase: '#091711',
    bgSurface: '#10241A',
    bgCard: '#173325',
    borderColor: '#254E39',
    accent: '#4ADE80',
    textMain: '#F0FDF4',
    textMuted: '#86EFAC'
  },
  warm: {
    id: 'warm',
    label: 'Học Viện Ấm Áp',
    description: 'Tông nâu gỗ thư viện cổ điển kết hợp vàng hổ phách trang trọng',
    bgBase: '#14110E',
    bgSurface: '#1E1915',
    bgCard: '#2B231D',
    borderColor: '#43362E',
    accent: '#F59E0B',
    textMain: '#FFFBEB',
    textMuted: '#D97706'
  },
  cyberpunk: {
    id: 'cyberpunk',
    label: 'Neon Tương Lai',
    description: 'Tông tím đậm pha hồng dạ quang, phong cách game thủ tràn đầy năng lượng',
    bgBase: '#110826',
    bgSurface: '#1B0D38',
    bgCard: '#281452',
    borderColor: '#48248F',
    accent: '#EC4899',
    textMain: '#FDF2F8',
    textMuted: '#C084FC'
  },
  minimal: {
    id: 'minimal',
    label: 'Giao Diện Sáng Học Đường',
    description: 'Chế độ nền trắng thanh lịch, độ sáng rõ ràng phù hợp ban ngày',
    bgBase: '#F8FAFC',
    bgSurface: '#F1F5F9',
    bgCard: '#FFFFFF',
    borderColor: '#E2E8F0',
    accent: '#2563EB',
    textMain: '#0F172A',
    textMuted: '#64748B',
    isLight: true
  }
};

export const PRESET_WALLPAPERS = [
  {
    id: 'none',
    label: 'Không dùng ảnh nền',
    url: ''
  },
  {
    id: 'mesh_gradient',
    label: 'Cực Quang Trừu Tượng',
    url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1920&q=80'
  },
  {
    id: 'digital_cosmos',
    label: 'Vũ Trụ Tri Thức',
    url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1920&q=80'
  },
  {
    id: 'modern_library',
    label: 'Thư Viện Hiện Đại',
    url: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1920&q=80'
  },
  {
    id: 'deep_waves',
    label: 'Sóng Biển Huyền Ảo',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80'
  }
];

export const ACCENT_SWATCHES = [
  '#00E5FF', // Cyan
  '#38BDF8', // Sky Blue
  '#4ADE80', // Emerald Green
  '#FFD166', // Gold Yellow
  '#F59E0B', // Amber
  '#EC4899', // Pink Neon
  '#9D4EDD', // Purple Neon
  '#EF476F', // Coral Red
  '#2563EB'  // Royal Blue
];

export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  mode: 'dark',
  preset: 'navy',
  style: '3d',
  primaryColor: '#00E5FF',
  bgBlur: 0,
  bgOpacity: 100,
  fontScale: 'medium',
  borderRadius: 'rounded-2xl',
  shadowLevel: 'medium',
  examFocusMode: true
};

export function getEffectiveTheme(config?: ThemeConfig): {
  isLight: boolean;
  colors: ThemePresetInfo;
  fontScale: 'small' | 'medium' | 'large';
  borderRadiusClass: string;
  shadowClass: string;
} {
  const cfg = config || DEFAULT_THEME_CONFIG;
  const presetKey = cfg.preset || 'navy';
  const basePreset = THEME_PRESETS[presetKey] || THEME_PRESETS.navy;

  const isLight =
    cfg.mode === 'light' ||
    (cfg.mode === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches) ||
    presetKey === 'minimal';

  const accent = cfg.primaryColor || basePreset.accent;

  const colors: ThemePresetInfo = {
    ...basePreset,
    accent,
    bgBase: cfg.backgroundColor || (isLight ? '#F8FAFC' : basePreset.bgBase),
    bgSurface: cfg.surfaceColor || (isLight ? '#F1F5F9' : basePreset.bgSurface),
    bgCard: isLight ? '#FFFFFF' : basePreset.bgCard,
    textMain: cfg.textColor || (isLight ? '#0F172A' : basePreset.textMain),
    textMuted: isLight ? '#64748B' : basePreset.textMuted,
    borderColor: isLight ? '#E2E8F0' : basePreset.borderColor,
    isLight
  };

  const borderRadiusClass =
    cfg.borderRadius === 'rounded-none'
      ? 'rounded-none'
      : cfg.borderRadius === 'rounded-lg'
      ? 'rounded-lg'
      : cfg.borderRadius === 'rounded-3xl'
      ? 'rounded-3xl'
      : 'rounded-2xl';

  const shadowClass =
    cfg.shadowLevel === 'none'
      ? 'shadow-none'
      : cfg.shadowLevel === 'low'
      ? 'shadow-sm'
      : cfg.shadowLevel === 'high'
      ? 'shadow-2xl'
      : 'shadow-lg';

  return {
    isLight,
    colors,
    fontScale: cfg.fontScale || 'medium',
    borderRadiusClass,
    shadowClass
  };
}

/**
 * Apply CSS custom properties and classes to HTML document root
 */
export function applyThemeToDom(config: ThemeConfig, isExamActive: boolean = false) {
  if (typeof document === 'undefined') return;

  const { isLight, colors, fontScale } = getEffectiveTheme(config);
  const root = document.documentElement;

  // Toggle dark/light root classes
  if (isLight) {
    root.classList.remove('dark');
    root.classList.add('light');
  } else {
    root.classList.remove('light');
    root.classList.add('dark');
  }

  // Aesthetic style classes
  root.classList.remove('theme-style-3d', 'theme-style-minimal', 'theme-style-handdrawn');
  root.classList.add(`theme-style-${config.style || '3d'}`);

  // Set font size
  const fontSizes: Record<string, string> = {
    small: '14px',
    medium: '16px',
    large: '18px'
  };
  root.style.fontSize = fontSizes[fontScale] || '16px';

  // Inject CSS Variables for dynamic usage across the app
  root.style.setProperty('--app-bg-base', colors.bgBase);
  root.style.setProperty('--app-bg-surface', colors.bgSurface);
  root.style.setProperty('--app-bg-card', colors.bgCard);
  root.style.setProperty('--app-border', colors.borderColor);
  root.style.setProperty('--app-accent', colors.accent);
  root.style.setProperty('--app-text-main', colors.textMain);
  root.style.setProperty('--app-text-muted', colors.textMuted);

  // Background body color sync
  document.body.style.backgroundColor = colors.bgBase;
  document.body.style.color = colors.textMain;

  // Handle Exam Focus Mode: silence background image if taking an exam
  const bgImg = isExamActive && config.examFocusMode ? '' : config.customBgImage || '';
  if (bgImg) {
    root.style.setProperty('--app-bg-image', `url("${bgImg}")`);
  } else {
    root.style.removeProperty('--app-bg-image');
  }
}
