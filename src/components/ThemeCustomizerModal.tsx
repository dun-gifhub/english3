import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ThemeConfig } from '../types';
import {
  Palette,
  Sun,
  Moon,
  Monitor,
  Sparkles,
  Layers,
  Feather,
  Eye,
  Check,
  X,
  RotateCcw,
  Sliders,
  Image as ImageIcon,
  Upload,
  Type,
  Square,
  Box,
  Flame,
  CheckCircle2
} from 'lucide-react';
import {
  THEME_PRESETS,
  PRESET_WALLPAPERS,
  ACCENT_SWATCHES,
  DEFAULT_THEME_CONFIG,
  getEffectiveTheme,
  applyThemeToDom
} from '../services/themeService';

interface ThemeCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeCustomizerModal: React.FC<ThemeCustomizerModalProps> = ({ isOpen, onClose }) => {
  const { themeConfig, setThemeConfig } = useApp();

  const [localTheme, setLocalTheme] = useState<ThemeConfig>(themeConfig);
  const [activeSubTab, setActiveSubTab] = useState<'palette' | 'wallpaper' | 'typography' | 'advanced'>('palette');
  const [customImageUrlInput, setCustomImageUrlInput] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLocalTheme(themeConfig);
      setCustomImageUrlInput(themeConfig.customBgImage || '');
    }
  }, [isOpen, themeConfig]);

  if (!isOpen) return null;

  const effective = getEffectiveTheme(localTheme);

  const handleApplyTheme = async () => {
    await setThemeConfig(localTheme);
    applyThemeToDom(localTheme);
    setToastMessage('Đã lưu và áp dụng giao diện thành công!');
    setTimeout(() => {
      setToastMessage(null);
      onClose();
    }, 900);
  };

  const handleReset = async () => {
    setLocalTheme(DEFAULT_THEME_CONFIG);
    setCustomImageUrlInput('');
    applyThemeToDom(DEFAULT_THEME_CONFIG);
    await setThemeConfig(DEFAULT_THEME_CONFIG);
    setToastMessage('Đã khôi phục giao diện mặc định');
    setTimeout(() => setToastMessage(null), 1500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Vui lòng chọn ảnh có dung lượng dưới 2MB để đảm bảo hiệu năng tải trang mượt mà.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const next = { ...localTheme, customBgImage: reader.result };
        setLocalTheme(next);
        applyThemeToDom(next);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-3xl rounded-3xl bg-[#1B263B] border border-[#27384E] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-[#F8F9FA]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#27384E] flex items-center justify-between bg-[#131F2E]/80">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-md transition-colors"
              style={{
                backgroundColor: `${effective.colors.accent}20`,
                color: effective.colors.accent,
                border: `1px solid ${effective.colors.accent}40`
              }}
            >
              <Palette size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white">Tùy Biến Giao Diện Toàn Diện</h2>
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase"
                  style={{ backgroundColor: `${effective.colors.accent}20`, color: effective.colors.accent }}
                >
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-[#778DA9]">
                Tùy chỉnh màu sắc, ảnh nền, chế độ sáng/tối, độ bo góc, cỡ chữ và phòng thi tập trung
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#778DA9] hover:text-white hover:bg-[#27384E] transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Live Preview Card */}
        <div className="p-4 bg-[#0D1B2A]/70 border-b border-[#27384E] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-[#778DA9] font-bold">Xem trước:</span>
            <div
              className="px-3 py-1.5 rounded-xl border flex items-center gap-2 shadow-sm"
              style={{
                backgroundColor: effective.colors.bgSurface,
                borderColor: effective.colors.borderColor,
                color: effective.colors.textMain
              }}
            >
              <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: effective.colors.accent }} />
              <span className="font-bold">{effective.colors.label}</span>
              <span className="text-[10px] opacity-70">({localTheme.mode.toUpperCase()})</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div
              className="px-3 py-1 rounded-lg text-xs font-black shadow"
              style={{
                backgroundColor: effective.colors.accent,
                color: effective.isLight ? '#FFFFFF' : '#0D1B2A'
              }}
            >
              Nút Mẫu
            </div>
            <div
              className="px-2.5 py-1 rounded-lg border text-[11px]"
              style={{
                borderColor: effective.colors.borderColor,
                backgroundColor: effective.colors.bgCard,
                color: effective.colors.textMuted
              }}
            >
              Thẻ thông tin
            </div>
          </div>
        </div>

        {/* Sub-tabs Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 pb-1 border-b border-[#27384E]/70 overflow-x-auto text-xs font-bold">
          {[
            { id: 'palette', label: 'Bảng Màu & Chế Độ', icon: Palette },
            { id: 'wallpaper', label: 'Hình Nền & Hiệu Ứng', icon: ImageIcon },
            { id: 'typography', label: 'Cỡ Chữ & Bố Cục', icon: Type },
            { id: 'advanced', label: 'Phong Cách & Phòng Thi', icon: Sliders }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-[#00E5FF] text-[#0D1B2A] font-black shadow-md'
                    : 'text-[#CBD5E1] hover:text-white hover:bg-[#27384E]'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* TAB 1: PALETTE & MODE */}
          {activeSubTab === 'palette' && (
            <div className="space-y-6">
              {/* Display Mode */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#778DA9] block mb-2.5">
                  1. Chế Độ Hiển Thị (Display Mode)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'dark', label: 'Chế Độ Tối (Dark)', desc: 'Chống lóa mắt, tối ưu ban đêm', icon: Moon },
                    { id: 'light', label: 'Chế Độ Sáng (Light)', desc: 'Sáng sủa, tương phản ban ngày', icon: Sun },
                    { id: 'system', label: 'Hệ Thống (Auto)', desc: 'Tự động theo thiết bị', icon: Monitor }
                  ].map((m) => {
                    const Icon = m.icon;
                    const isSelected = localTheme.mode === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => {
                          const next = { ...localTheme, mode: m.id as any };
                          setLocalTheme(next);
                          applyThemeToDom(next);
                        }}
                        className={`p-3.5 rounded-2xl border flex flex-col items-center text-center gap-1.5 transition font-bold text-xs cursor-pointer ${
                          isSelected
                            ? 'bg-[#00E5FF]/20 border-[#00E5FF] text-[#00E5FF] shadow-lg shadow-[#00E5FF]/10'
                            : 'bg-[#131F2E] border-[#27384E] text-[#CBD5E1] hover:bg-[#27384E]'
                        }`}
                      >
                        <Icon size={20} />
                        <span className="font-black">{m.label}</span>
                        <span className="text-[10px] opacity-70 font-normal">{m.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Theme Presets */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#778DA9] block mb-2.5">
                  2. Bộ Màu Chủ Đề Không Gian Học Tập (Color Presets)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.values(THEME_PRESETS).map((p) => {
                    const isSelected = localTheme.preset === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          const next = {
                            ...localTheme,
                            preset: p.id as any,
                            mode: p.isLight ? 'light' : localTheme.mode === 'light' ? 'dark' : localTheme.mode,
                            primaryColor: p.accent
                          };
                          setLocalTheme(next);
                          applyThemeToDom(next);
                        }}
                        className={`p-3 rounded-2xl border flex items-center gap-3 transition text-left cursor-pointer ${
                          isSelected
                            ? 'border-[#00E5FF] bg-[#131F2E] shadow-md ring-2 ring-[#00E5FF]/30'
                            : 'border-[#27384E] bg-[#131F2E]/60 hover:bg-[#131F2E]'
                        }`}
                      >
                        <div
                          className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center shrink-0 shadow-inner"
                          style={{ backgroundColor: p.bgBase }}
                        >
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: p.accent }} />
                        </div>
                        <div className="min-w-0">
                          <span className={`text-xs font-bold block truncate ${isSelected ? 'text-[#00E5FF]' : 'text-white'}`}>
                            {p.label}
                          </span>
                          <span className="text-[10px] text-[#778DA9] line-clamp-1">{p.description}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Accent Color Swatches */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#778DA9] block mb-2.5">
                  3. Màu Nhấn Chủ Đạo (Accent Primary Color)
                </label>
                <div className="flex items-center gap-2.5 flex-wrap">
                  {ACCENT_SWATCHES.map((color) => {
                    const isSelected = (localTheme.primaryColor || effective.colors.accent) === color;
                    return (
                      <button
                        key={color}
                        onClick={() => {
                          const next = { ...localTheme, primaryColor: color };
                          setLocalTheme(next);
                          applyThemeToDom(next);
                        }}
                        className={`w-9 h-9 rounded-xl transition flex items-center justify-center cursor-pointer shadow-md ${
                          isSelected ? 'scale-115 ring-2 ring-white ring-offset-2 ring-offset-[#0D1B2A]' : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                      >
                        {isSelected && <Check size={16} className="text-white drop-shadow" />}
                      </button>
                    );
                  })}

                  {/* Custom color input */}
                  <div className="flex items-center gap-1.5 ml-2 bg-[#131F2E] px-3 py-1.5 rounded-xl border border-[#27384E]">
                    <span className="text-xs text-[#778DA9]">Tùy chọn:</span>
                    <input
                      type="color"
                      value={localTheme.primaryColor || effective.colors.accent}
                      onChange={(e) => {
                        const next = { ...localTheme, primaryColor: e.target.value };
                        setLocalTheme(next);
                        applyThemeToDom(next);
                      }}
                      className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WALLPAPER & EFFECTS */}
          {activeSubTab === 'wallpaper' && (
            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#778DA9] block mb-2.5">
                  Hình Nền Học Viện Tuyển Chọn
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {PRESET_WALLPAPERS.map((wp) => {
                    const isSelected = (!localTheme.customBgImage && wp.id === 'none') || localTheme.customBgImage === wp.url;
                    return (
                      <button
                        key={wp.id}
                        onClick={() => {
                          const next = { ...localTheme, customBgImage: wp.url };
                          setLocalTheme(next);
                          setCustomImageUrlInput(wp.url);
                          applyThemeToDom(next);
                        }}
                        className={`relative rounded-2xl border overflow-hidden p-2 text-left transition cursor-pointer flex flex-col justify-end h-24 ${
                          isSelected
                            ? 'border-[#00E5FF] ring-2 ring-[#00E5FF]/40 shadow-lg'
                            : 'border-[#27384E] hover:border-[#778DA9]'
                        }`}
                        style={{
                          backgroundImage: wp.url ? `url("${wp.url}")` : undefined,
                          backgroundColor: wp.url ? '#000000' : '#131F2E',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      >
                        <div className="absolute inset-0 bg-black/40" />
                        <div className="relative z-10 flex items-center justify-between">
                          <span className="text-xs font-bold text-white drop-shadow">{wp.label}</span>
                          {isSelected && <Check size={16} className="text-[#00E5FF] drop-shadow" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Image Upload & URL */}
              <div className="p-4 rounded-2xl bg-[#131F2E] border border-[#27384E] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Upload size={14} className="text-[#00E5FF]" />
                    Tải Ảnh Nền Riêng Hoặc Nhập Link
                  </span>
                  <label className="px-3 py-1.5 rounded-xl bg-[#27384E] hover:bg-[#344966] text-white text-xs font-bold cursor-pointer transition flex items-center gap-1.5">
                    <span>Chọn tệp ảnh</span>
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customImageUrlInput}
                    onChange={(e) => setCustomImageUrlInput(e.target.value)}
                    placeholder="https://example.com/hinh-nen.jpg"
                    className="flex-1 px-3 py-2 rounded-xl bg-[#0D1B2A] border border-[#27384E] text-xs text-white focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      const next = { ...localTheme, customBgImage: customImageUrlInput.trim() };
                      setLocalTheme(next);
                      applyThemeToDom(next);
                    }}
                    className="px-4 py-2 rounded-xl bg-[#00E5FF] text-[#0D1B2A] text-xs font-bold hover:bg-[#00E5FF]/90 transition cursor-pointer"
                  >
                    Gắn ảnh
                  </button>
                </div>
              </div>

              {/* Blur and Opacity sliders */}
              {localTheme.customBgImage && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-[#131F2E] border border-[#27384E]">
                  <div>
                    <div className="flex justify-between text-xs font-bold text-[#CBD5E1] mb-1.5">
                      <span>Độ mờ hậu cảnh (Blur)</span>
                      <span className="text-[#00E5FF]">{localTheme.bgBlur ?? 0}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={localTheme.bgBlur ?? 0}
                      onChange={(e) => {
                        const next = { ...localTheme, bgBlur: Number(e.target.value) };
                        setLocalTheme(next);
                        applyThemeToDom(next);
                      }}
                      className="w-full accent-[#00E5FF]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-[#CBD5E1] mb-1.5">
                      <span>Độ rõ ảnh nền (Opacity)</span>
                      <span className="text-[#00E5FF]">{localTheme.bgOpacity ?? 100}%</span>
                    </div>
                    <input
                      type="range"
                      min="15"
                      max="100"
                      value={localTheme.bgOpacity ?? 100}
                      onChange={(e) => {
                        const next = { ...localTheme, bgOpacity: Number(e.target.value) };
                        setLocalTheme(next);
                        applyThemeToDom(next);
                      }}
                      className="w-full accent-[#00E5FF]"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TYPOGRAPHY & LAYOUT */}
          {activeSubTab === 'typography' && (
            <div className="space-y-6">
              {/* Font Scale */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#778DA9] block mb-2.5">
                  1. Cỡ Chữ Hiển Thị Toàn Ứng Dụng (Font Scale)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'small', label: 'Cỡ Chữ Nhỏ (90%)', desc: 'Hiển thị nhiều nội dung hơn trên màn hình' },
                    { id: 'medium', label: 'Tiêu Chuẩn (100%)', desc: 'Cân đối, tối ưu đọc hiểu' },
                    { id: 'large', label: 'Cỡ Chữ Lớn (115%)', desc: 'Dễ đọc, phù hợp máy chiếu hoặc học sinh' }
                  ].map((f) => {
                    const isSelected = (localTheme.fontScale || 'medium') === f.id;
                    return (
                      <button
                        key={f.id}
                        onClick={() => {
                          const next = { ...localTheme, fontScale: f.id as any };
                          setLocalTheme(next);
                          applyThemeToDom(next);
                        }}
                        className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
                          isSelected
                            ? 'bg-[#00E5FF]/20 border-[#00E5FF] text-[#00E5FF] shadow-lg'
                            : 'bg-[#131F2E] border-[#27384E] text-[#CBD5E1] hover:bg-[#27384E]'
                        }`}
                      >
                        <span className="font-black text-xs block">{f.label}</span>
                        <span className="text-[10px] text-[#778DA9] mt-0.5 block">{f.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Border Radius */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#778DA9] block mb-2.5">
                  2. Độ Bo Góc Khung & Nút Bấm (Border Radius)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: 'rounded-none', label: 'Vuông Vức (Sharp)' },
                    { id: 'rounded-lg', label: 'Bo Nhẹ (Light)' },
                    { id: 'rounded-2xl', label: 'Tiêu Chuẩn (Modern)' },
                    { id: 'rounded-3xl', label: 'Mềm Mại (Pill/Soft)' }
                  ].map((r) => {
                    const isSelected = (localTheme.borderRadius || 'rounded-2xl') === r.id;
                    return (
                      <button
                        key={r.id}
                        onClick={() => {
                          const next = { ...localTheme, borderRadius: r.id as any };
                          setLocalTheme(next);
                          applyThemeToDom(next);
                        }}
                        className={`p-3 rounded-xl border text-center transition font-bold text-xs cursor-pointer ${
                          isSelected
                            ? 'border-[#00E5FF] bg-[#00E5FF]/20 text-[#00E5FF]'
                            : 'border-[#27384E] bg-[#131F2E] text-[#CBD5E1]'
                        }`}
                      >
                        {r.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Shadow Level */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#778DA9] block mb-2.5">
                  3. Mức Độ Bóng Đổ Khối (Shadow Level)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: 'none', label: 'Phẳng (Flat No Shadow)' },
                    { id: 'low', label: 'Bóng Nhẹ (Subtle)' },
                    { id: 'medium', label: 'Tiêu Chuẩn (Depth)' },
                    { id: 'high', label: 'Nổi Khối Mạnh (High Depth)' }
                  ].map((s) => {
                    const isSelected = (localTheme.shadowLevel || 'medium') === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => {
                          const next = { ...localTheme, shadowLevel: s.id as any };
                          setLocalTheme(next);
                          applyThemeToDom(next);
                        }}
                        className={`p-3 rounded-xl border text-center transition font-bold text-xs cursor-pointer ${
                          isSelected
                            ? 'border-[#00E5FF] bg-[#00E5FF]/20 text-[#00E5FF]'
                            : 'border-[#27384E] bg-[#131F2E] text-[#CBD5E1]'
                        }`}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ADVANCED & EXAM FOCUS */}
          {activeSubTab === 'advanced' && (
            <div className="space-y-6">
              {/* Aesthetic Style */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#778DA9] block mb-2.5">
                  Phong Cách Mỹ Thuật (Aesthetic Style)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: '3d', label: '3D Depth & Cards', desc: 'Độ sâu thẻ nhẹ, nút bấm nổi khối hiện đại', icon: Layers },
                    { id: 'minimal', label: 'Minimalism Tối Giản', desc: 'Bố cục sạch, ít phân tâm, tập trung', icon: Feather },
                    { id: 'handdrawn', label: 'Vẽ Tay Sư Phạm', desc: 'Viền nét đứt, phong cách vở bài tập học đường', icon: Sparkles }
                  ].map((s) => {
                    const Icon = s.icon;
                    const isSelected = localTheme.style === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => {
                          const next = { ...localTheme, style: s.id as any };
                          setLocalTheme(next);
                          applyThemeToDom(next);
                        }}
                        className={`p-3.5 rounded-2xl border text-left flex flex-col gap-1.5 transition cursor-pointer ${
                          isSelected
                            ? 'bg-[#FFD166]/15 border-[#FFD166] text-white shadow-lg shadow-[#FFD166]/10'
                            : 'bg-[#131F2E] border-[#27384E] text-[#CBD5E1] hover:bg-[#27384E]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <Icon size={18} className={isSelected ? 'text-[#FFD166]' : 'text-[#778DA9]'} />
                          {isSelected && <Check size={16} className="text-[#FFD166]" />}
                        </div>
                        <span className="font-bold text-xs">{s.label}</span>
                        <span className="text-[10px] text-[#778DA9] line-clamp-2">{s.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Exam Focus Mode Toggle */}
              <div className="p-4 rounded-2xl bg-[#131F2E] border border-[#27384E] flex items-center justify-between">
                <div className="space-y-0.5 pr-4">
                  <span className="font-bold text-white block text-sm flex items-center gap-1.5">
                    <Flame size={16} className="text-[#06D6A0]" />
                    Chế Độ Phòng Thi Tập Trung (Exam Focus Mode)
                  </span>
                  <p className="text-xs text-[#778DA9]">
                    Tự động ẩn hình nền khi học sinh vào làm bài kiểm tra để tối đa hóa sự tập trung và chống mỏi mắt.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const next = { ...localTheme, examFocusMode: !localTheme.examFocusMode };
                    setLocalTheme(next);
                    applyThemeToDom(next);
                  }}
                  className={`w-12 h-7 rounded-full transition-colors relative shrink-0 cursor-pointer ${
                    localTheme.examFocusMode ? 'bg-[#06D6A0]' : 'bg-[#27384E]'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white absolute top-1 transition-transform ${
                      localTheme.examFocusMode ? 'left-6' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[#27384E] bg-[#131F2E]/90 flex items-center justify-between gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#27384E] text-[#778DA9] hover:text-white hover:bg-[#27384E] text-xs font-bold transition cursor-pointer"
          >
            <RotateCcw size={15} />
            <span className="hidden sm:inline">Khôi phục mặc định</span>
            <span className="sm:hidden">Mặc định</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#CBD5E1] hover:bg-[#27384E] transition cursor-pointer"
            >
              Đóng
            </button>
            <button
              onClick={handleApplyTheme}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#00E5FF] text-[#0D1B2A] text-xs font-black hover:bg-[#00E5FF]/90 transition shadow-lg shadow-[#00E5FF]/20 cursor-pointer"
            >
              <Check size={16} />
              <span>Áp Dụng Giao Diện</span>
            </button>
          </div>
        </div>

        {/* Success Toast */}
        {toastMessage && (
          <div className="absolute top-4 right-4 z-60 px-4 py-2.5 rounded-2xl bg-[#06D6A0] text-[#0D1B2A] font-black text-xs shadow-2xl flex items-center gap-2 animate-bounce">
            <CheckCircle2 size={16} />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};
