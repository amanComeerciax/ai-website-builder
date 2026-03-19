import { useState, useMemo, useRef } from 'react'
import { RefreshCw, Monitor, Tablet, Smartphone, ExternalLink, Loader2 } from 'lucide-react'
import { 
    SandpackProvider, 
    SandpackLayout, 
    SandpackPreview, 
} from "@codesandbox/sandpack-react"
import { useEditorStore } from '../../stores/editorStore'
import './PreviewPanel.css'

// File extensions Sandpack can safely process (text-based only)
const TEXT_EXTENSIONS = new Set([
    '.js', '.jsx', '.ts', '.tsx', '.css', '.html', '.json', '.svg', '.md', '.txt', '.mjs'
]);

// Pre-baked dependency list — only add packages here that are guaranteed to exist on NPM
const STATIC_DEPS = {
    "lucide-react": "latest",
    "framer-motion": "latest",
    "recharts": "latest",
    "clsx": "latest",
    "tailwind-merge": "latest",
    "react-router-dom": "latest",
    "axios": "latest",
    "styled-components": "latest",
    "react-scroll": "latest",
    "react-icons": "latest",
    "react-toastify": "latest",
    "react-hook-form": "latest",
    "react-select": "latest",
    "react-helmet-async": "latest",
    "react-error-boundary": "latest",
    "date-fns": "latest",
    "lodash": "latest",
    "uuid": "latest",
    "zod": "latest",
    "yup": "latest",
    "zustand": "latest",
    "swiper": "latest",
    "react-intersection-observer": "latest",
    "react-countup": "latest",
    "react-type-animation": "latest",
    "react-parallax": "latest",
    "react-slick": "latest",
    "slick-carousel": "latest",
    "react-lazy-load-image-component": "latest",
    "react-vertical-timeline-component": "latest",
    "react-circular-progressbar": "latest",
    "react-player": "latest",
    "react-spring": "latest",
    "@react-spring/web": "latest",
    "react-tsparticles": "latest",
    "tsparticles": "latest",
    "aos": "latest",
    "sweetalert2": "latest",
    "sonner": "latest",
    "@emailjs/browser": "latest",
    "emailjs-com": "latest",
};

function isTextFile(path) {
    const ext = path.substring(path.lastIndexOf('.'));
    return TEXT_EXTENSIONS.has(ext.toLowerCase());
}

export default function PreviewPanel() {
    const { files } = useEditorStore()
    const [viewMode, setViewMode] = useState('desktop')
    const [refreshKey, setRefreshKey] = useState(0)

    // Convert VFS to Sandpack format, strictly filtering out binary/null files
    const sandpackFiles = useMemo(() => {
        const result = {}
        Object.entries(files).forEach(([path, file]) => {
            // Skip server/backend files entirely — Sandpack is a browser-only React env
            if (path.includes('server/') || path.includes('backend/')) return;

            // Strip 'client/' prefix to flatten the structure for Sandpack
            let cleanPath = path;
            if (path.startsWith('client/')) {
                cleanPath = path.replace('client/', '');
            } else if (path.startsWith('./client/')) {
                cleanPath = path.replace('./client/', '');
            }

            // Sandpack expects paths to start with /
            const finalPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`

            // CRITICAL: Skip non-text files (images, fonts, etc.) — their null/binary content
            // causes Sandpack's bundler to crash with "Cannot read properties of null (reading 'match')"
            if (!isTextFile(finalPath)) return;

            // Skip files with null/undefined/non-string content
            let safeContent = file.content;
            if (typeof safeContent !== 'string' || !safeContent) {
                safeContent = '/* empty */';
            }
            
            // Sanitize JS/JSX files
            if (finalPath.endsWith('.js') || finalPath.endsWith('.jsx') || finalPath.endsWith('.tsx') || finalPath.endsWith('.ts')) {
                // Replace Vite-specific import.meta.env with empty object
                safeContent = safeContent.replace(/import\.meta\.env/g, "({})");
                 
                // Strip AI-generated Routers to prevent "Nested Router" collisions
                safeContent = safeContent.replace(/<BrowserRouter[^>]*>/g, "<>");
                safeContent = safeContent.replace(/<\/BrowserRouter>/g, "</>");
                safeContent = safeContent.replace(/<Router[^>]*>/g, "<>");
                safeContent = safeContent.replace(/<\/Router>/g, "</>");
            }
            
            result[finalPath] = safeContent
        })
        
        const hasSrcApp = !!result['/src/App.jsx'] || !!result['/src/App.js'];
        const hasRootApp = !!result['/App.jsx'] || !!result['/App.js'];
        
        if (!hasSrcApp && !hasRootApp) {
             result['/App.jsx'] = `import React from 'react';\n\nexport default function App() {\n  return <div style={{ padding: '20px', color: 'white' }}>No entry file (App.jsx) found in the project.</div>;\n}`;
        }
        
        const appImportPath = hasSrcApp ? './src/App' : './App';
        const cssImport = result['/src/index.css'] ? `import "./src/index.css";\n` : (result['/index.css'] ? `import "./index.css";\n` : '');

        result['/index.js'] = `
import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
${cssImport}
import App from "${appImportPath}";

const root = createRoot(document.getElementById("root"));
root.render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
`;
        
        return result
    }, [files])

    const viewWidths = {
        desktop: '100%',
        tablet: '768px',
        mobile: '375px',
    }

    return (
        <div className="preview-panel">
            <div className="pp-toolbar">
                <div className="pp-url-bar">
                    <span className="pp-url-dot green" />
                    <span className="pp-url-dot yellow" />
                    <span className="pp-url-dot red" />
                    <div className="pp-url-text">localhost:3000</div>
                </div>
                <div className="pp-actions">
                    <button
                        className={`pp-view-btn ${viewMode === 'desktop' ? 'active' : ''}`}
                        onClick={() => setViewMode('desktop')}
                        title="Desktop"
                    >
                        <Monitor size={14} />
                    </button>
                    <button
                        className={`pp-view-btn ${viewMode === 'tablet' ? 'active' : ''}`}
                        onClick={() => setViewMode('tablet')}
                        title="Tablet"
                    >
                        <Tablet size={14} />
                    </button>
                    <button
                        className={`pp-view-btn ${viewMode === 'mobile' ? 'active' : ''}`}
                        onClick={() => setViewMode('mobile')}
                        title="Mobile"
                    >
                        <Smartphone size={14} />
                    </button>
                    <button className="pp-view-btn" onClick={() => setRefreshKey(k => k + 1)} title="Refresh">
                        <RefreshCw size={14} />
                    </button>
                </div>
            </div>

            <div className="pp-iframe-container" key={refreshKey}>
                <div className="pp-iframe-wrapper" style={{ maxWidth: viewWidths[viewMode] }}>
                    <SandpackProvider
                        template="react"
                        theme="dark"
                        files={sandpackFiles}
                        customSetup={{
                            dependencies: STATIC_DEPS
                        }}
                        options={{
                            recompileMode: "immediate",
                            recompileDelay: 300,
                        }}
                    >
                        <SandpackLayout style={{ height: '100%', border: 'none', background: 'transparent' }}>
                            <SandpackPreview 
                                style={{ height: '100%' }} 
                                showNavigator={false}
                                showRefreshButton={false}
                            />
                        </SandpackLayout>
                    </SandpackProvider>
                </div>
            </div>
        </div>
    )
}
