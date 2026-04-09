import React, { useState, useEffect } from 'react';
import { 
  Type, Layout, Grid3X3, Check,
  Briefcase, Camera, Coffee, Utensils, Code2, Palette, 
  PenTool, Heart, Globe, FileText, Sparkles, ChevronLeft, Layers
} from 'lucide-react';

// Category icon + color mapping
const CATEGORY_META = {
  blog:        { icon: FileText,  color: '#f472b6', label: 'Blog' },
  'coffee-shop': { icon: Coffee, color: '#fbbf24', label: 'Coffee Shop' },
  fashion:     { icon: PenTool,   color: '#c084fc', label: 'Fashion' },
  landing:     { icon: Globe,     color: '#60a5fa', label: 'Landing Page' },
  portfolio:   { icon: Camera,    color: '#34d399', label: 'Portfolio' },
  restaurant:  { icon: Utensils,  color: '#fb923c', label: 'Restaurant' },
  saas:        { icon: Code2,     color: '#818cf8', label: 'SaaS' },
  service:     { icon: Briefcase, color: '#38bdf8', label: 'Service' },
  wellness:    { icon: Heart,     color: '#f9a8d4', label: 'Wellness' },
};

const STEP_INFO = [
  { icon: Type, label: 'Name', color: '#8b5cf6' },
  { icon: Layout, label: 'About', color: '#a855f7' },
  { icon: Grid3X3, label: 'Template', color: '#f59e0b' },
];

export default function WebsiteStylePicker({ step = 0, value, onChange }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(value.templateId || null);

  const details = {
    websiteName: value.websiteName || '',
    description: value.description || '',
  };

  const StepIcon = STEP_INFO[step]?.icon || Type;
  const stepColor = STEP_INFO[step]?.color || '#8b5cf6';

  // Fetch templates on mount
  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/templates');
        const data = await res.json();
        setTemplates(data.templates || []);
      } catch (err) {
        console.error('[StylePicker] Failed to fetch templates:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  // Group templates by categoryId
  const categoriesMap = {};
  templates.forEach(t => {
    const cid = t.categoryId;
    if (!categoriesMap[cid]) categoriesMap[cid] = [];
    categoriesMap[cid].push(t);
  });

  const categories = Object.keys(categoriesMap).sort();
  const filteredTemplates = selectedCategory ? (categoriesMap[selectedCategory] || []) : [];

  const handleDetailChange = (e) => {
    const { name, value: val } = e.target;
    onChange({ ...value, [name]: val });
  };

  const handleCategorySelect = (catId) => {
    setSelectedCategory(catId);
    setSelectedTemplate(null);
    onChange({ ...value, category: catId, templateId: '' });
  };

  const handleTemplateSelect = (templateId) => {
    setSelectedTemplate(templateId);
    onChange({ ...value, category: selectedCategory, templateId });
  };

  // Shared input styles
  const inputStyle = {
    width: '100%', background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px', padding: '14px 16px',
    color: '#fff', fontSize: '14px', fontWeight: '500',
    outline: 'none', transition: 'all 0.2s',
    letterSpacing: '-0.01em',
    boxSizing: 'border-box',
  };

  const cardBase = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '16px', padding: '16px',
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
            {step === 2 && (selectedCategory ? 'Choose a template' : 'Pick a category')}
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
        <div style={cardBase}>
          <input
            type="text"
            name="websiteName"
            autoFocus
            placeholder="e.g. BrewHouse Coffee"
            value={details.websiteName}
            onChange={handleDetailChange}
            style={inputStyle}
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
        <div style={cardBase}>
          <textarea
            name="description"
            autoFocus
            rows={3}
            placeholder="What does your business do? (e.g. Artisanal coffee roastery in Brooklyn...)"
            value={details.description}
            onChange={handleDetailChange}
            style={{
              ...inputStyle,
              fontWeight: '400',
              resize: 'none', fontFamily: 'inherit',
              lineHeight: '1.5',
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

      {/* Step 2: Category → Template Selection */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {loading ? (
            <div style={{
              textAlign: 'center', padding: '32px',
              color: 'rgba(255,255,255,0.4)', fontSize: '13px',
            }}>
              <Sparkles size={20} style={{ marginBottom: '8px', opacity: 0.5 }} />
              <div>Loading templates...</div>
            </div>
          ) : !selectedCategory ? (
            /* ──── Part A: Category Grid ──── */
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
            }}>
              {categories.map(catId => {
                const meta = CATEGORY_META[catId] || { icon: Layers, color: '#888', label: catId };
                const CatIcon = meta.icon;
                const count = categoriesMap[catId].length;

                return (
                  <button
                    key={catId}
                    onClick={() => handleCategorySelect(catId)}
                    style={{
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', gap: '6px',
                      padding: '14px 8px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease',
                      color: '#fff',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = meta.color + '55';
                      e.currentTarget.style.background = meta.color + '10';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = `0 8px 24px ${meta.color}15`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '10px',
                      background: `${meta.color}18`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <CatIcon size={16} style={{ color: meta.color }} />
                    </div>
                    <div style={{
                      fontSize: '11px', fontWeight: '600',
                      textAlign: 'center', lineHeight: '1.3',
                      letterSpacing: '-0.01em',
                    }}>
                      {meta.label}
                    </div>
                    <div style={{
                      fontSize: '9px', 
                      color: 'rgba(255,255,255,0.3)',
                      fontWeight: '500',
                    }}>
                      {count} {count === 1 ? 'template' : 'templates'}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            /* ──── Part B: Template Cards ──── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Back to categories */}
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setSelectedTemplate(null);
                  onChange({ ...value, category: '', templateId: '' });
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'rgba(255,255,255,0.4)', fontSize: '11px',
                  fontWeight: '500', padding: '4px 0',
                  transition: 'color 0.2s',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
              >
                <ChevronLeft size={12} /> Change category
              </button>

              {/* Category label */}
              {(() => {
                const meta = CATEGORY_META[selectedCategory] || { icon: Layers, color: '#888', label: selectedCategory };
                return (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    fontSize: '11px', fontWeight: '600',
                    color: meta.color,
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    marginBottom: '2px',
                  }}>
                    <meta.icon size={12} />
                    {meta.label}
                  </div>
                );
              })()}

              {/* Template list */}
              {filteredTemplates.map(tmpl => {
                const isSelected = selectedTemplate === tmpl.id;
                const meta = CATEGORY_META[selectedCategory] || { color: '#888' };

                return (
                  <button
                    key={tmpl.id}
                    onClick={() => handleTemplateSelect(tmpl.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '12px',
                      background: isSelected ? `${meta.color}12` : 'rgba(255,255,255,0.02)',
                      border: `1.5px solid ${isSelected ? meta.color : 'rgba(255,255,255,0.06)'}`,
                      borderRadius: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease',
                      textAlign: 'left',
                      width: '100%',
                      color: '#fff',
                      fontFamily: 'inherit',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = `${meta.color}44`;
                        e.currentTarget.style.background = `${meta.color}08`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                        e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                      }
                    }}
                  >
                    {/* Thumbnail */}
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '10px',
                      overflow: 'hidden', flexShrink: 0,
                      background: tmpl.image 
                        ? `url(${tmpl.image}) center/cover` 
                        : `linear-gradient(135deg, ${meta.color}30, ${meta.color}08)`,
                    }} />

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '13px', fontWeight: '600',
                        letterSpacing: '-0.01em', lineHeight: '1.3',
                        marginBottom: '2px',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {tmpl.title}
                      </div>
                      <div style={{
                        fontSize: '10.5px', color: 'rgba(255,255,255,0.35)',
                        lineHeight: '1.4',
                        display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      }}>
                        {tmpl.description}
                      </div>
                    </div>

                    {/* Check icon */}
                    {isSelected && (
                      <div style={{
                        width: '22px', height: '22px', borderRadius: '50%',
                        background: meta.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <Check size={12} color="#fff" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}

              {filteredTemplates.length === 0 && (
                <div style={{
                  textAlign: 'center', padding: '24px',
                  color: 'rgba(255,255,255,0.3)', fontSize: '12px',
                }}>
                  No templates available for this category yet.
                </div>
              )}
            </div>
          )}

          <div style={{
            fontSize: '11px', color: 'rgba(255,255,255,0.2)',
            textAlign: 'center', paddingTop: '2px',
          }}>
            {selectedTemplate 
              ? '✓ Template selected — click Build to start!' 
              : 'Select a template to get started'}
          </div>
        </div>
      )}
    </div>
  );
}
