import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { RefreshCw, Monitor, Tablet, Smartphone, Loader2, Download, ArrowUp, Code } from 'lucide-react'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { useEditorStore } from '../../stores/editorStore'
import { useChatStore } from '../../stores/chatStore'
import { useAuth } from '@clerk/clerk-react'
import './PreviewPanel.css'

// The script injected into the iframe when visual edit mode is active.
// It handles hover highlighting, click selection, and style application.
function getVisualEditScript() {
    return [
        '<scr', 'ipt>',
        '(function(){',
        'var selected=[];',
        'var hoverEl=null;',
        'var enabled=false;',

        // Utility: get xpath for an element
        'function getXPath(el){',
        '  if(!el||el.nodeType!==1)return"";',
        '  var parts=[];',
        '  while(el&&el.nodeType===1){',
        '    var idx=1;var sib=el.previousSibling;',
        '    while(sib){if(sib.nodeType===1&&sib.tagName===el.tagName)idx++;sib=sib.previousSibling;}',
        '    parts.unshift(el.tagName.toLowerCase()+"["+idx+"]");',
        '    el=el.parentNode;',
        '  }',
        '  return"/"+parts.join("/");',
        '}',

        // Utility: get computed styles we care about
        'function getStyles(el){',
        '  var cs=window.getComputedStyle(el);',
        '  return{',
        '    fontSize:cs.fontSize,fontWeight:cs.fontWeight,fontStyle:cs.fontStyle,textAlign:cs.textAlign,',
        '    color:cs.color,backgroundColor:cs.backgroundColor,',
        '    marginTop:cs.marginTop,marginRight:cs.marginRight,marginBottom:cs.marginBottom,marginLeft:cs.marginLeft,',
        '    paddingTop:cs.paddingTop,paddingRight:cs.paddingRight,paddingBottom:cs.paddingBottom,paddingLeft:cs.paddingLeft,',
        '    borderWidth:cs.borderWidth,borderColor:cs.borderColor,borderStyle:cs.borderStyle,borderRadius:cs.borderRadius',
        '  };',
        '}',

        // Create/update overlay elements
        'var hoverOverlay=document.createElement("div");',
        'hoverOverlay.id="__ve_hover";',
        'hoverOverlay.style.cssText="position:fixed;pointer-events:none;border:2px dashed rgba(59,130,246,0.6);background:rgba(59,130,246,0.05);z-index:99999;display:none;transition:all 0.1s ease;";',
        'document.body.appendChild(hoverOverlay);',

        // Tag label
        'var tagLabel=document.createElement("div");',
        'tagLabel.id="__ve_label";',
        'tagLabel.style.cssText="position:fixed;pointer-events:none;z-index:100000;display:none;padding:2px 6px;font-size:10px;font-weight:700;font-family:monospace;border-radius:3px;color:#fff;";',
        'document.body.appendChild(tagLabel);',

        // Get tag color
        'function tagColor(t){',
        '  t=t.toLowerCase();',
        '  if(t.match(/^h[1-6]$/))return"#3b82f6";',
        '  if(t==="p"||t==="span")return"#a855f7";',
        '  if(t==="input"||t==="textarea"||t==="select")return"#22c55e";',
        '  if(t==="button"||t==="a")return"#f97316";',
        '  return"#6b7280";',
        '}',

        // Hover handler
        'document.addEventListener("mousemove",function(e){',
        '  if(!enabled)return;',
        '  var t=e.target;',
        '  if(t===hoverOverlay||t===tagLabel||t.id&&t.id.startsWith("__ve_"))return;',
        '  if(t.closest&&t.closest(".__ve_sel"))return;',
        '  if(t.closest&&t.closest(".__ve_bubble"))return;',
        '  if(t===document.body||t===document.documentElement)return;',
        '  hoverEl=t;',
        '  var r=t.getBoundingClientRect();',
        '  hoverOverlay.style.left=r.left+"px";',
        '  hoverOverlay.style.top=r.top+"px";',
        '  hoverOverlay.style.width=r.width+"px";',
        '  hoverOverlay.style.height=r.height+"px";',
        '  hoverOverlay.style.display="block";',
        '  hoverOverlay.style.borderColor=tagColor(t.tagName)+"99";',
        '  hoverOverlay.style.background=tagColor(t.tagName)+"0d";',
        '  tagLabel.textContent=t.tagName.toLowerCase();',
        '  tagLabel.style.background=tagColor(t.tagName);',
        '  tagLabel.style.left=r.left+"px";',
        '  tagLabel.style.top=Math.max(0,r.top-20)+"px";',
        '  tagLabel.style.display="block";',
        '});',

        // Click handler - select element
        'document.addEventListener("click",function(e){',
        '  if(!enabled)return;',
        '  e.preventDefault();e.stopPropagation();',
        '  var t=e.target;',
        '  if(t===hoverOverlay||t===tagLabel||t.id&&t.id.startsWith("__ve_"))return;',
        '  if(t.closest&&t.closest(".__ve_sel"))return;',
        '  if(t.closest&&t.closest(".__ve_bubble"))return;',
        '  if(t===document.body||t===document.documentElement)return;',
        '  var xpath=getXPath(t);',
        '  var r=t.getBoundingClientRect();',

        // Handle multi-select
        '  var isMulti=e.metaKey||e.ctrlKey;',
        '  if(!isMulti){',
        '    var markers=document.querySelectorAll(".__ve_sel");',
        '    markers.forEach(function(m){m.remove();});',
        '    selected=[];',
        '  }',

        // Add selection highlight
        '  var marker=document.createElement("div");',
        '  marker.className="__ve_sel";',
        '  marker.dataset.xpath=xpath;',
        '  var c=tagColor(t.tagName);',
        '  marker.style.cssText="position:fixed;pointer-events:none;border:2px solid "+c+";z-index:99998;left:"+r.left+"px;top:"+r.top+"px;width:"+r.width+"px;height:"+r.height+"px;";',


        // Floating bubble below selected element (single-select only, non-selectable)
        '  if (!isMulti) {',
        '    var bubble=document.createElement("div");',
        '    bubble.className="__ve_bubble";',
        '    bubble.style.cssText="position:absolute;pointer-events:auto;background:#1a1a1a;border:1px solid #333;border-radius:24px;padding:6px 14px;display:flex;align-items:center;gap:8px;box-shadow:0 8px 16px rgba(0,0,0,0.4);bottom:-48px;left:50%;transform:translateX(-50%);width:280px;z-index:99999;";',
        '    var inp=document.createElement("input");',
        '    inp.id="__ve_bubble_input";',
        '    inp.placeholder="Ask StackForge...";',
        '    inp.style.cssText="background:transparent;border:none;color:#fff;font-size:13px;outline:none;flex:1;font-family:inherit;";',
        '    var btnBox=document.createElement("div");',
        '    btnBox.style.cssText="display:flex;gap:4px;align-items:center;";',
        '    var sendBtn=document.createElement("button");',
        '    sendBtn.innerHTML="<svg width=\\"14\\" height=\\"14\\" viewBox=\\"0 0 24 24\\" fill=\\"none\\" stroke=\\"#fff\\" stroke-width=\\"2\\"><path d=\\"M5 12h14m-7-7 7 7-7 7\\"/></svg>";',
        '    sendBtn.style.cssText="background:#333;border:none;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background 0.2s;";',
        '    var parentBtn=document.createElement("button");',
        '    parentBtn.innerHTML="<svg width=\\"14\\" height=\\"14\\" viewBox=\\"0 0 24 24\\" fill=\\"none\\" stroke=\\"#aaa\\" stroke-width=\\"2\\"><path d=\\"M12 19V5M5 12l7-7 7 7\\"/></svg>";',
        '    parentBtn.style.cssText="background:transparent;border:none;cursor:pointer;padding:4px;";',
        '    parentBtn.title="Select parent";',
        '    var codeBtn=document.createElement("button");',
        '    codeBtn.innerHTML="<svg width=\\"14\\" height=\\"14\\" viewBox=\\"0 0 24 24\\" fill=\\"none\\" stroke=\\"#aaa\\" stroke-width=\\"2\\"><polyline points=\\"16 18 22 12 16 6\\"></polyline><polyline points=\\"8 6 2 12 8 18\\"></polyline></svg>";',
        '    codeBtn.style.cssText="background:transparent;border:none;cursor:pointer;padding:4px;";',
        '    codeBtn.title="View code";',
        '    sendBtn.onclick=function(ev){',
        '      ev.stopPropagation();',
        '      if(inp.value.trim()){',
        '        window.parent.postMessage({type:"VE_QUICK_PROMPT",text:inp.value,xpath:xpath},"*");',
        '        inp.value="";',
        '      }',
        '    };',
        '    parentBtn.onclick=function(ev){',
        '      ev.stopPropagation();',
        '      if(t.parentElement && t.parentElement !== document.body && t.parentElement !== document.documentElement){',
        '        var evt = new MouseEvent("click", { bubbles: true, cancelable: true, view: window });',
        '        t.parentElement.dispatchEvent(evt);',
        '      }',
        '    };',
        '    codeBtn.onclick=function(ev){',
        '      ev.stopPropagation();',
        '      window.parent.postMessage({type:"VE_VIEW_CODE",xpath:xpath},"*");',
        '    };',
        '    inp.onkeydown=function(ev){',
        '      if(ev.key==="Enter"){ sendBtn.click(); }',
        '      ev.stopPropagation();',
        '    };',
        '    inp.onclick=function(ev){ ev.stopPropagation(); };',
        '    btnBox.appendChild(sendBtn);',
        '    btnBox.appendChild(parentBtn);',
        '    btnBox.appendChild(codeBtn);',
        '    bubble.appendChild(inp);',
        '    bubble.appendChild(btnBox);',
        '    marker.appendChild(bubble);',
        '    setTimeout(function(){ inp.focus(); }, 20);',
        '  }',


        // Add tag badge on the selection
        '  var badge=document.createElement("div");',
        '  badge.style.cssText="position:absolute;top:-1px;left:-1px;padding:1px 5px;font-size:9px;font-weight:700;font-family:monospace;color:#fff;border-radius:0 0 4px 0;background:"+c+";";',
        '  badge.textContent=t.tagName.toLowerCase();',
        '  marker.appendChild(badge);',
        '  document.body.appendChild(marker);',

        '  selected.push({el:t,xpath:xpath,marker:marker});',

        // Send to parent
        '  var data={',
        '    tag:t.tagName.toLowerCase(),',
        '    id:t.id||"",',
        '    classes:t.className||"",',
        '    xpath:xpath,',
        '    text:(t.textContent||"").substring(0,80),',
        '    styles:getStyles(t)',
        '  };',
        '  window.parent.postMessage({type:"VE_ELEMENT_SELECTED",data:data,isMulti:isMulti},"*");',
        '},true);',

        // Listen for messages from parent
        'window.addEventListener("message",function(e){',
        '  var d=e.data;',
        '  if(!d||!d.type)return;',

        '  if(d.type==="VE_ENABLE"){',
        '    enabled=true;',
        '    document.body.style.cursor="crosshair";',
        '  }',
        '  if(d.type==="VE_DISABLE"){',
        '    enabled=false;',
        '    document.body.style.cursor="";',
        '    hoverOverlay.style.display="none";',
        '    tagLabel.style.display="none";',
        '    var markers=document.querySelectorAll(".__ve_sel");',
        '    markers.forEach(function(m){m.remove();});',
        '    selected=[];',
        '  }',

        '  if(d.type==="VE_APPLY_STYLE"&&d.xpath&&d.prop&&d.value!==undefined){',
        '    var found=selected.find(function(s){return s.xpath===d.xpath;});',
        '    if(found&&found.el){',
        '      found.el.style[d.prop]=d.value;',
        // Update the marker position in case size changed
        '      var r2=found.el.getBoundingClientRect();',
        '      found.marker.style.left=r2.left+"px";',
        '      found.marker.style.top=r2.top+"px";',
        '      found.marker.style.width=r2.width+"px";',
        '      found.marker.style.height=r2.height+"px";',
        '      window.parent.postMessage({type:"VE_STYLE_APPLIED",xpath:d.xpath,styles:getStyles(found.el)},"*");',
        '    }',
        '  }',

        '  if(d.type==="VE_DESELECT"&&d.xpath){',
        '    var idx=selected.findIndex(function(s){return s.xpath===d.xpath;});',
        '    if(idx>=0){selected[idx].marker.remove();selected.splice(idx,1);}',
        '  }',

        '  if(d.type==="VE_CLEAR"){',
        '    var markers2=document.querySelectorAll(".__ve_sel");',
        '    markers2.forEach(function(m){m.remove();});',
        '    selected=[];',
        '  }',

        '});',

        '})();',
        '</scr', 'ipt>'
    ].join('')
}

export default function PreviewPanel() {
    const { getToken } = useAuth()
    const { files, htmlContent } = useEditorStore()
    const { isGenerating, generationPhase, isVisualEditMode, addSelectedElement, clearSelectedElements, selectedElements } = useChatStore()
    const [viewMode, setViewMode] = useState('desktop')
    const [refreshKey, setRefreshKey] = useState(0)
    const iframeRef = useRef(null)

    const viewWidths = {
        desktop: '100%',
        tablet: '768px',
        mobile: '375px',
    }

    const previewHTML = useMemo(() => {
        if (htmlContent) return htmlContent
        const indexFile = files['index.html']
        if (indexFile) {
            return typeof indexFile === 'string' ? indexFile : indexFile.content
        }
        return null
    }, [htmlContent, files])

    const hasPreview = !!previewHTML

    // Build safe srcdoc with click interceptor + visual edit script
    const safeSrcDoc = useMemo(() => {
        if (!previewHTML) return ''
        let safe = previewHTML
        const baseTag = '<base target="_self">'
        if (safe.includes('<head>')) {
            safe = safe.replace('<head>', '<head>' + baseTag)
        }
        // Click interceptor for normal mode (only if NOT in visual edit mode)
        if (!isVisualEditMode) {
            const openTag = '<scr' + 'ipt>'
            const closeTag = '</scr' + 'ipt>'
            const clickHandler = [
                openTag,
                'document.addEventListener("click",function(e){',
                'var a=e.target.closest("a");',
                'if(a){var h=a.getAttribute("href");',
                'if(h&&h.startsWith("#")){e.preventDefault();var el=document.querySelector(h);if(el)el.scrollIntoView({behavior:"smooth"});}',
                'else if(h&&(h.startsWith("http")||h.startsWith("//"))){e.preventDefault();}',
                'else if(h&&h!=="#"){e.preventDefault();}}',
                '});',
                closeTag
            ].join('')
            if (safe.includes('</body>')) {
                safe = safe.replace('</body>', clickHandler + '</body>')
            } else {
                safe += clickHandler
            }
        }
        // Always inject visual edit script (controlled by enable/disable messages)
        const veScript = getVisualEditScript()
        if (safe.includes('</body>')) {
            safe = safe.replace('</body>', veScript + '</body>')
        } else {
            safe += veScript
        }
        return safe
    }, [previewHTML, isVisualEditMode])

    // Send enable/disable to iframe when visual edit mode changes
    useEffect(() => {
        const iframe = iframeRef.current
        if (!iframe) return
        const sendMsg = () => {
            try {
                iframe.contentWindow.postMessage(
                    { type: isVisualEditMode ? 'VE_ENABLE' : 'VE_DISABLE' },
                    '*'
                )
            } catch (e) { /* sandbox may block */ }
        }
        // Wait for iframe to load
        iframe.addEventListener('load', sendMsg)
        // Also try immediately
        sendMsg()
        return () => iframe.removeEventListener('load', sendMsg)
    }, [isVisualEditMode, safeSrcDoc])

    // Listen for messages from iframe
    useEffect(() => {
        const handler = async (e) => {
            const d = e.data
            if (!d || !d.type) return
            if (d.type === 'VE_ELEMENT_SELECTED' && d.data) {
                if (!d.isMulti) {
                    useChatStore.getState().clearSelectedElements()
                }
                setTimeout(() => useChatStore.getState().addSelectedElement(d.data), 0)
            }
            if (d.type === 'VE_STYLE_APPLIED' && d.xpath && d.styles) {
                // Update stored styles for that element
                const store = useChatStore.getState()
                const el = store.selectedElements.find(e => e.xpath === d.xpath)
                if (el) {
                    useChatStore.setState({
                        selectedElements: store.selectedElements.map(e =>
                            e.xpath === d.xpath ? { ...e, styles: d.styles } : e
                        )
                    })
                }
            }
            if (d.type === 'VE_QUICK_PROMPT' && d.text && d.xpath) {
                const store = useChatStore.getState()
                const { activeProjectId, addMessage, startGeneration, selectedModel } = store
                const xpathStr = d.xpath
                
                // Construct natural language prompt context
                const messageContent = `[Visual Edit on element: ${xpathStr}]\n${d.text}`
                
                addMessage({ role: 'user', content: messageContent })
                
                // Dismiss visual edit mode cleanly
                store.setVisualEditMode(false)
                store.clearSelectedElements()
                
                // Trigger backend processing
                const token = await getToken()
                startGeneration(messageContent, activeProjectId, token, null)
            }

            if (d.type === 'VE_VIEW_CODE' && d.xpath) {
                // Switch the main editor view to the code editor
                useChatStore.getState().setActiveView('code')
                useChatStore.getState().setIdeVisible(true)
            }

        }
        window.addEventListener('message', handler)
        return () => window.removeEventListener('message', handler)
    }, [addSelectedElement, getToken])

    // Send style changes to iframe
    const applyStyleToIframe = useCallback((xpath, prop, value) => {
        const iframe = iframeRef.current
        if (!iframe) return
        try {
            iframe.contentWindow.postMessage(
                { type: 'VE_APPLY_STYLE', xpath, prop, value },
                '*'
            )
        } catch (e) { /* sandbox */ }
    }, [])

    const handleDownloadZip = async () => {
        const zip = new JSZip()
        let projectName = 'my-website'
        Object.entries(files).forEach(([path, file]) => {
            let cleanPath = path
            if (cleanPath.startsWith('next-export/')) {
                cleanPath = cleanPath.replace('next-export/', '')
            }
            if (cleanPath === 'index.html') {
                zip.file('preview/index.html', typeof file === 'string' ? file : file.content)
                return
            }
            const content = typeof file === 'string' ? file : file.content
            zip.file(cleanPath, content)
            if (cleanPath === 'package.json') {
                try { projectName = JSON.parse(content).name || projectName } catch (e) {}
            }
        })
        const blob = await zip.generateAsync({ type: 'blob' })
        saveAs(blob, projectName.replace(/\s+/g, '-').toLowerCase() + '.zip')
    }

    return (
        <div className="preview-panel">
            <div className="pp-toolbar">
                <div className="pp-url-bar">
                    <span className="pp-url-dot green" />
                    <span className="pp-url-dot yellow" />
                    <span className="pp-url-dot red" />
                    <div className="pp-url-text">
                        {isVisualEditMode ? 'visual edit mode' : (hasPreview ? 'preview — live' : 'no preview')}
                    </div>
                </div>
                <div className="pp-actions">
                    <button
                        className={'pp-view-btn' + (viewMode === 'desktop' ? ' active' : '')}
                        onClick={() => setViewMode('desktop')}
                        title="Desktop"
                    >
                        <Monitor size={14} />
                    </button>
                    <button
                        className={'pp-view-btn' + (viewMode === 'tablet' ? ' active' : '')}
                        onClick={() => setViewMode('tablet')}
                        title="Tablet"
                    >
                        <Tablet size={14} />
                    </button>
                    <button
                        className={'pp-view-btn' + (viewMode === 'mobile' ? ' active' : '')}
                        onClick={() => setViewMode('mobile')}
                        title="Mobile"
                    >
                        <Smartphone size={14} />
                    </button>
                    <button className="pp-view-btn" onClick={() => setRefreshKey(k => k + 1)} title="Refresh">
                        <RefreshCw size={14} />
                    </button>
                    <button 
                        className="pp-view-btn download" 
                        onClick={handleDownloadZip} 
                        title="Download Next.js Project"
                        disabled={!hasPreview}
                    >
                        <Download size={14} />
                    </button>
                </div>
            </div>

            <div className="pp-iframe-container" key={refreshKey}>
                <div className="pp-iframe-wrapper" style={{ maxWidth: viewWidths[viewMode] }}>
                    {hasPreview ? (
                        <iframe
                            ref={iframeRef}
                            srcDoc={safeSrcDoc}
                            sandbox="allow-scripts"
                            style={{ width: '100%', height: '100%', border: 'none' }}
                            title="Generated website preview"
                        />
                    ) : (
                        <div style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            justifyContent: 'center', height: '100%', gap: '1rem',
                            color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter, sans-serif',
                            textAlign: 'center', padding: '2rem'
                        }}>
                            {(isGenerating || generationPhase === 'thinking' || generationPhase === 'streaming_logs') ? (
                                <>
                                    <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
                                    <p style={{ fontSize: '0.9rem' }}>Generating your website...</p>
                                    <style>{'@keyframes spin { 100% { transform: rotate(360deg); } }'}</style>
                                </>
                            ) : (
                                <>
                                    <Monitor size={40} strokeWidth={1.2} />
                                    <p style={{ fontSize: '0.95rem', fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}>
                                        No preview yet
                                    </p>
                                    <p style={{ fontSize: '0.8rem', maxWidth: '260px' }}>
                                        Send a prompt to generate your website
                                    </p>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// Export the applyStyleToIframe for use by VisualEditPanel
export function getPreviewIframeRef() {
    return document.querySelector('.pp-iframe-wrapper iframe')
}
