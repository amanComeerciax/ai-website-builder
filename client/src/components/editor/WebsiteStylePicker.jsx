import React, { useState } from 'react';
import { Check, Sparkles, Type, Layout, Image as ImageIcon, Palette, ArrowRight } from 'lucide-react';

const THEMES = [
  { 
    id: 'modern-dark', 
    name: 'Modern Dark', 
    tag: 'Professional',
    gradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #3b82f6 100%)',
    accent: '#3b82f6',
    preview: ['#0f172a', '#1e293b', '#334155', '#3b82f6']
  },
  { 
    id: 'modern-light', 
    name: 'Modern Light', 
    tag: 'Clean',
    gradient: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #6366f1 100%)',
    accent: '#6366f1',
    preview: ['#f8fafc', '#e2e8f0', '#cbd5e1', '#6366f1']
  },
  { 
    id: 'minimal', 
    name: 'Minimal', 
    tag: 'Simple',
    gradient: 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 50%, #737373 100%)',
    accent: '#525252',
    preview: ['#fafafa', '#e5e5e5', '#a3a3a3', '#525252']
  },
  { 
    id: 'bold', 
    name: 'Bold', 
    tag: 'High Energy',
    gradient: 'linear-gradient(135deg, #1c1917 0%, #f97316 50%, #fbbf24 100%)',
    accent: '#f97316',
    preview: ['#1c1917', '#292524', '#f97316', '#fbbf24']
  },
  { 
    id: 'elegant', 
    name: 'Elegant', 
    tag: 'Premium',
    gradient: 'linear-gradient(135deg, #0c0a09 0%, #1c1917 50%, #d4a574 100%)',
    accent: '#c4a35a',
    preview: ['#0c0a09', '#1c1917', '#c4a35a', '#e8d5b5']
  },
  { 
    id: 'playful', 
    name: 'Playful', 
    tag: 'Creative',
    gradient: 'linear-gradient(135deg, #fdf2f8 0%, #ec4899 50%, #8b5cf6 100%)',
    accent: '#ec4899',
    preview: ['#fdf2f8', '#fbcfe8', '#ec4899', '#8b5cf6']
  },
];

const STEP_INFO = [
  { icon: Sparkles, label: 'Theme', color: '#3b82f6' },
  { icon: Type, label: 'Name', color: '#8b5cf6' },
  { icon: Layout, label: 'About', color: '#a855f7' },
  { icon: Palette, label: 'Brand', color: '#f59e0b' },
];

export default function WebsiteStylePicker({ step = 0, value, onChange }) {
  const selectedTheme = value.theme || 'modern-dark';
  const details = {
    websiteName: value.websiteName || '',
    description: value.description || '',
    logoUrl: value.logoUrl || '',
    brandColors: value.brandColors || '',
  };

  const StepIcon = STEP_INFO[step]?.icon || Sparkles;
  const stepColor = STEP_INFO[step]?.color || '#3b82f6';

  const handleThemeSelect = (themeId) => {
    onChange({ ...value, theme: themeId });
  };

  const handleDetailChange = (e) => {
    const { name, value: val } = e.target;
    onChange({ ...value, [name]: val });
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Step Progress Dots */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '6px', marginBottom: '16px'
      }}>
        {STEP_INFO.map((s, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <div style={{
              width: i <= step ? '24px' : '8px',
              height: '8px',
              borderRadius: '100px',
              background: i < step ? s.color : i === step 
                ? `linear-gradient(90deg, ${s.color}, ${s.color}88)` 
                : 'rgba(255,255,255,0.08)',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: i === step ? `0 0 12px ${s.color}40` : 'none',
            }} />
          </div>
        ))}
      </div>

      {/* Step Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        marginBottom: '16px', paddingLeft: '2px'
      }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '10px',
          background: `linear-gradient(135deg, ${stepColor}, ${stepColor}88)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 4px 12px ${stepColor}30`,
        }}>
          <StepIcon size={16} color="#fff" />
        </div>
        <div>
          <div style={{
            fontSize: '14px', fontWeight: '700', color: '#fff',
            letterSpacing: '-0.01em', lineHeight: '1.2'
          }}>
            {step === 0 && 'Choose your style'}
            {step === 1 && "What's your brand name?"}
            {step === 2 && 'Describe your project'}
            {step === 3 && 'Brand assets (optional)'}
          </div>
          <div style={{
            fontSize: '11px', color: 'rgba(255,255,255,0.35)',
            marginTop: '2px'
          }}>
            Step {step + 1} of 4
          </div>
        </div>
      </div>

      {/* Step 0: Theme Grid */}
      {step === 0 && (
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px',
        }}>
          {THEMES.map((theme) => {
            const isSelected = selectedTheme === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => handleThemeSelect(theme.id)}
                style={{
                  position: 'relative',
                  display: 'flex', flexDirection: 'column',
                  gap: '8px', padding: '0',
                  borderRadius: '14px', border: 'none',
                  cursor: 'pointer', textAlign: 'left',
                  background: isSelected ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.02)',
                  outline: isSelected ? `2px solid ${theme.accent}` : '1px solid rgba(255,255,255,0.06)',
                  outlineOffset: '-1px',
                  transition: 'all 0.3s ease',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.outline = '1px solid rgba(255,255,255,0.12)'; }}
                onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.outline = '1px solid rgba(255,255,255,0.06)'; }}
              >
                {/* Color Preview Strip */}
                <div style={{
                  width: '100%', height: '48px',
                  background: theme.gradient,
                  borderRadius: '14px 14px 0 0',
                  position: 'relative',
                }}>
                  {isSelected && (
                    <div style={{
                      position: 'absolute', top: '8px', right: '8px',
                      width: '20px', height: '20px', borderRadius: '50%',
                      background: theme.accent, display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      boxShadow: `0 2px 8px ${theme.accent}60`,
                    }}>
                      <Check size={12} color="#fff" strokeWidth={3} />
                    </div>
                  )}
                </div>

                {/* Theme Info */}
                <div style={{ padding: '4px 12px 12px' }}>
                  <div style={{
                    fontSize: '12px', fontWeight: '600',
                    color: isSelected ? '#fff' : 'rgba(255,255,255,0.6)',
                    lineHeight: '1.3', marginBottom: '4px',
                  }}>
                    {theme.name}
                  </div>
                  {/* Color Dots */}
                  <div style={{ display: 'flex', gap: '3px' }}>
                    {theme.preview.map((col, i) => (
                      <div key={i} style={{
                        width: '12px', height: '12px', borderRadius: '50%',
                        background: col,
                        border: '1px solid rgba(255,255,255,0.1)',
                      }} />
                    ))}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Step 1: Website Name */}
      {step === 1 && (
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '16px', padding: '16px',
        }}>
          <input
            type="text"
            name="websiteName"
            autoFocus
            placeholder="e.g. BrewHouse Coffee"
            value={details.websiteName}
            onChange={handleDetailChange}
            style={{
              width: '100%', background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px', padding: '14px 16px',
              color: '#fff', fontSize: '14px', fontWeight: '500',
              outline: 'none', transition: 'all 0.2s',
              letterSpacing: '-0.01em',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }}
            onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
          />
          <div style={{
            fontSize: '11px', color: 'rgba(255,255,255,0.25)',
            marginTop: '8px', paddingLeft: '4px',
          }}>
            This will appear as your site's brand name in the header
          </div>
        </div>
      )}

      {/* Step 2: Description */}
      {step === 2 && (
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '16px', padding: '16px',
        }}>
          <textarea
            name="description"
            autoFocus
            rows={3}
            placeholder="What does your business do? (e.g. Artisanal coffee roastery in Brooklyn...)"
            value={details.description}
            onChange={handleDetailChange}
            style={{
              width: '100%', background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px', padding: '14px 16px',
              color: '#fff', fontSize: '14px', fontWeight: '400',
              outline: 'none', transition: 'all 0.2s',
              resize: 'none', fontFamily: 'inherit',
              lineHeight: '1.5', letterSpacing: '-0.01em',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => { e.target.style.borderColor = '#a855f7'; e.target.style.boxShadow = '0 0 0 3px rgba(168,85,247,0.1)'; }}
            onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
          />
          <div style={{
            fontSize: '11px', color: 'rgba(255,255,255,0.25)',
            marginTop: '8px', paddingLeft: '4px',
          }}>
            The AI will use this to generate relevant content for your site
          </div>
        </div>
      )}

      {/* Step 3: Logo & Colors */}
      {step === 3 && (
        <div style={{
          display: 'flex', flexDirection: 'column', gap: '12px',
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '16px', padding: '16px',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.4)',
              textTransform: 'uppercase', letterSpacing: '0.05em',
              marginBottom: '10px',
            }}>
              <ImageIcon size={12} /> Logo URL
            </div>
            <input
              type="text"
              name="logoUrl"
              placeholder="https://your-logo-url.png"
              value={details.logoUrl}
              onChange={handleDetailChange}
              style={{
                width: '100%', background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px', padding: '12px 14px',
                color: '#fff', fontSize: '13px',
                outline: 'none', transition: 'all 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '16px', padding: '16px',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.4)',
              textTransform: 'uppercase', letterSpacing: '0.05em',
              marginBottom: '10px',
            }}>
              <Palette size={12} /> Brand Colors
            </div>
            <input
              type="text"
              name="brandColors"
              placeholder="#3b82f6, #000000 (comma separated)"
              value={details.brandColors}
              onChange={handleDetailChange}
              style={{
                width: '100%', background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px', padding: '12px 14px',
                color: '#fff', fontSize: '13px',
                outline: 'none', transition: 'all 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => { e.target.style.borderColor = '#f59e0b'; e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.1)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          <div style={{
            fontSize: '11px', color: 'rgba(255,255,255,0.2)',
            textAlign: 'center', paddingTop: '4px',
          }}>
            Both fields are optional — skip to start building
          </div>
        </div>
      )}
    </div>
  );
}
