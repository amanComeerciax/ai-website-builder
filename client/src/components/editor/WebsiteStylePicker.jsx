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
  { icon: Grid3X3, label: 'Theme', color: '#f59e0b' },
];

export default function WebsiteStylePicker({ step = 0, value, onChange }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analyzingPrompt, setAnalyzingPrompt] = useState(false);
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
        const activeThemes = (data.templates || []).filter(t => t.isVisibleInThemes);
        setTemplates(activeThemes);
      } catch (err) {
        console.error('[StylePicker] Failed to fetch templates:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  // AI Categorization Effect for Step 2
  useEffect(() => {
    if (step === 2 && !selectedCategory) {
      const promptToAnalyze = value.initialPrompt || value.description || value.websiteName;
      if (!promptToAnalyze) {
        setSelectedCategory('all');
        return;
      }
      
      setAnalyzingPrompt(true);
      fetch('/api/generate/suggest-category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptToAnalyze })
      })
      .then(res => res.json())
      .then(data => {
        if (data.category && data.category !== 'all') {
          setSelectedCategory(data.category);
          onChange({ ...value, category: data.category });
        } else {
          setSelectedCategory('all');
        }
      })
      .catch(err => {
        setSelectedCategory('all');
      })
      .finally(() => {
        setAnalyzingPrompt(false);
      });
    }
  }, [step, selectedCategory, value.initialPrompt, value.description, value.websiteName]);

  // Group templates by every category in allCategories (one card per template per category view)
  const categoriesMap = {};
  templates.forEach(t => {
    const cats = t.allCategories && t.allCategories.length > 0 ? t.allCategories : [t.categoryId || 'custom'];
    cats.forEach(cid => {
      if (!categoriesMap[cid]) categoriesMap[cid] = [];
      // Avoid adding same template twice to same category bucket (slug-dedup)
      if (!categoriesMap[cid].find(x => x.slug === t.slug)) {
        categoriesMap[cid].push(t);
      }
    });
  });

  const categories = Object.keys(categoriesMap).sort();
  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : (selectedCategory ? (categoriesMap[selectedCategory] || []) : []);

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

  // Helper: get display name for a template (theme name > title fallback)
  const getDisplayName = (tmpl) => tmpl.themeName || tmpl.title;
  const getDisplayDesc = (tmpl) => tmpl.themeTagline || tmpl.description;

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
            {step === 2 && (selectedCategory ? 'Choose a theme' : 'Pick a category')}
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

      {/* Step 2: Category → Theme Selection */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {(loading || analyzingPrompt) ? (
            <div style={{
              textAlign: 'center', padding: '32px',
              color: 'rgba(255,255,255,0.4)', fontSize: '13px',
            }}>
              <Sparkles size={20} style={{ marginBottom: '8px', opacity: 0.5, animation: 'pulse 1.5s infinite' }} />
              <div>Analyzing your prompt for blueprints...</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              
              {selectedCategory && selectedCategory !== 'all' && (
                  <button
                    onClick={() => {
                      setSelectedCategory('all');
                      onChange({ ...value, category: 'all', templateId: '' });
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
                    <ChevronLeft size={12} /> View all categories
                  </button>
              )}
              {selectedCategory === 'all' ? (
                // Category Picker Grid
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {categories.map(cid => {
                    const meta = CATEGORY_META[cid] || { icon: Layers, color: '#888', label: cid.replace('-', ' ') };
                    return (
                      <button
                        key={cid}
                        onClick={() => handleCategorySelect(cid)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '8px',
                          padding: '12px 14px', background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px',
                          color: '#fff', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                          fontFamily: 'inherit'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                      >
                        <meta.icon size={16} color={meta.color} />
                        <div style={{ fontSize: '13px', fontWeight: '500', textTransform: 'capitalize' }}>
                          {meta.label}
                        </div>
                      </button>
                    )
                  })}
                  <button
                    onClick={() => handleTemplateSelect('custom')}
                    style={{
                      gridColumn: '1 / -1',
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '14px', background: 'rgba(99, 102, 241, 0.1)',
                      border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '12px',
                      color: '#fff', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                      fontFamily: 'inherit', marginTop: '4px'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(99, 102, 241, 0.18)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)'; }}
                  >
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '8px', flexShrink: 0,
                      background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.4), rgba(99, 102, 241, 0.1))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Sparkles size={18} color="#a5b4fc" />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '2px' }}>Custom AI Build</div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Generate from scratch utilizing AI blueprints</div>
                    </div>
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(() => {
                    const meta = CATEGORY_META[selectedCategory] || { icon: Layers, color: '#888', label: selectedCategory };
                    return (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        fontSize: '11px', fontWeight: '600',
                        color: meta.color,
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                        marginBottom: '4px',
                      }}>
                        <meta.icon size={12} />
                        {meta.label}
                      </div>
                    );
                  })()}

                  {/* Custom AI Option within category */}
                  <button
                    key="custom-ai-generation-inner"
                    onClick={() => handleTemplateSelect('custom')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '12px',
                      background: selectedTemplate === 'custom' ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255,255,255,0.02)',
                      border: `1.5px solid ${selectedTemplate === 'custom' ? '#6366f1' : 'rgba(255,255,255,0.06)'}`,
                      borderRadius: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease',
                      textAlign: 'left',
                      width: '100%',
                      color: '#fff',
                      fontFamily: 'inherit',
                      position: 'relative',
                      marginBottom: '4px',
                    }}
                    onMouseEnter={(e) => {
                      if (selectedTemplate !== 'custom') {
                        e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.44)';
                        e.currentTarget.style.background = 'rgba(99, 102, 241, 0.08)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedTemplate !== 'custom') {
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                        e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                      }
                    }}
                  >
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '10px',
                      overflow: 'hidden', flexShrink: 0,
                      background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.4), rgba(99, 102, 241, 0.1))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Sparkles size={24} color="#a5b4fc" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '13px', fontWeight: '600',
                        letterSpacing: '-0.01em', lineHeight: '1.3',
                        marginBottom: '2px',
                      }}>
                        Custom AI Build
                      </div>
                      <div style={{
                        fontSize: '10.5px', color: 'rgba(255,255,255,0.35)',
                        lineHeight: '1.4',
                      }}>
                        Generate a completely unique website from scratch using AI blueprints.
                      </div>
                    </div>
                    {selectedTemplate === 'custom' && (
                      <div style={{
                        width: '22px', height: '22px', borderRadius: '50%',
                        background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <Check size={12} color="#fff" strokeWidth={3} />
                      </div>
                    )}
                  </button>

                  {filteredTemplates.map(tmpl => {
                    const isSelected = selectedTemplate === tmpl.id;
                    const meta = CATEGORY_META[selectedCategory === 'all' ? (tmpl.categoryId || tmpl.allCategories?.[0] || 'landing') : selectedCategory] || { color: '#888' };

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
                            {getDisplayName(tmpl)}
                          </div>
                          <div style={{
                            fontSize: '10.5px', color: 'rgba(255,255,255,0.35)',
                            lineHeight: '1.4',
                            display: '-webkit-box', WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical', overflow: 'hidden',
                          }}>
                            {getDisplayDesc(tmpl)}
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
                </div>
              )}

            </div>
          )}

          <div style={{
            fontSize: '11px', color: 'rgba(255,255,255,0.2)',
            textAlign: 'center', paddingTop: '2px',
          }}>
            {selectedTemplate 
              ? '✓ Blueprint selected — click Send to start!' 
              : 'Select a blueprint to get started'}
          </div>
        </div>
      )}
    </div>
  );
}
