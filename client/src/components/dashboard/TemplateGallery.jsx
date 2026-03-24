import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../../stores/projectStore';
import { ArrowRight, Code, LayoutTemplate } from 'lucide-react';
import './TemplateGallery.css';

export default function TemplateGallery({ folderId }) {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { createProject } = useProjectStore(); // Future: we will need to update this to instantiate from template

  useEffect(() => {
    async function fetchTemplates() {
      try {
        const res = await fetch('/api/templates');
        if (res.ok) {
          const json = await res.json();
          setTemplates(json.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch templates:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTemplates();
  }, []);

  const handleSelectTemplate = async (template) => {
    // Generate instantly! We pass template._id to the API.
    const implicitPrompt = `Start with the ${template.name} template`;
    const newProjectId = await createProject(implicitPrompt, folderId, template._id);
    navigate(`/chat/${newProjectId}?isTemplate=true`);
  };

  if (isLoading) {
    return (
      <div className="template-gallery-loading">
        <div className="shimmer pulse"></div>
        <div className="shimmer pulse"></div>
        <div className="shimmer pulse"></div>
      </div>
    );
  }

  if (!templates.length) return null;

  return (
    <div className="template-gallery-container">
      <div className="template-gallery-header">
        <div className="header-left">
          <LayoutTemplate size={20} className="header-icon" />
          <h2>Starter Templates</h2>
        </div>
        <button className="view-all-btn">Browse all &rarr;</button>
      </div>

      <div className="template-grid">
        {templates.slice(0, 3).map((template, idx) => (
          <motion.div 
            key={template._id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1, duration: 0.4 }}
            className="template-card"
          >
            <div className="template-cover">
              <img src={template.coverImage} alt={template.name} />
              <div className="template-track-badge">
                <Code size={14} />
                {template.track === 'nextjs' ? 'Next.js' : 'HTML'}
              </div>
            </div>
            
            <div className="template-info">
              <h3>{template.name}</h3>
              <p>{template.description}</p>
              
              <div className="template-features">
                {template.features.slice(0, 2).map((feature, i) => (
                  <span key={i} className="feature-pill">{feature}</span>
                ))}
              </div>

              <button 
                className="use-template-btn"
                onClick={() => handleSelectTemplate(template)}
              >
                Use this <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
