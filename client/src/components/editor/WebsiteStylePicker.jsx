import React, { useState } from 'react';
import { Type, Layout, Image as ImageIcon, Palette } from 'lucide-react';

const STEP_INFO = [
  { icon: Type, label: 'Name', color: '#8b5cf6' },
  { icon: Layout, label: 'About', color: '#a855f7' },
  { icon: Palette, label: 'Brand', color: '#f59e0b' },
];

export default function WebsiteStylePicker({ step = 0, value, onChange }) {
  const details = {
    websiteName: value.websiteName || '',
    description: value.description || '',
    logoUrl: value.logoUrl || '',
    brandColors: value.brandColors || '',
  };

  const StepIcon = STEP_INFO[step]?.icon || Type;
  const stepColor = STEP_INFO[step]?.color || '#8b5cf6';

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
            {step === 0 && "What's your brand name?"}
            {step === 1 && 'Describe your project'}
            {step === 2 && 'Brand assets (optional)'}
          </div>
          <div style={{
            fontSize: '11px', color: 'rgba(255,255,255,0.35)',
            marginTop: '2px'
          }}>
            Step {step + 1} of 3
          </div>
        </div>
      </div>



      {/* Step 0: Website Name */}
      {step === 0 && (
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

      {/* Step 1: Description */}
      {step === 1 && (
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

      {/* Step 2: Logo & Colors */}
      {step === 2 && (
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
