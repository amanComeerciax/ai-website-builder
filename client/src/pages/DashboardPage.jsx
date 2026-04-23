import { useState, useRef, useEffect } from "react";
import {
  Plus,
  Mic,
  ArrowUp,
  MessageSquare,
  ArrowRight,
  Clock,
  LayoutTemplate,
  FolderOpen,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useAuthStore } from "../stores/authStore";
import { useProjectStore } from "../stores/projectStore";
import { useWorkspaceStore } from "../stores/workspaceStore";
import { useRecentlyViewedStore } from "../stores/recentlyViewedStore";
import "./DashboardPage.css";

// Rotating placeholder
const PROMPTS = [
  "Describe what you want to create...",
  "A minimalist portfolio with dark mode...",
  "An e-commerce store for artisan candles...",
  "A SaaS dashboard with analytics charts...",
  "A restaurant site with online ordering...",
];

// Shared prompt quality check
function isNonActionablePrompt(text) {
  const cleaned = text
    .replace(/[^a-zA-Z\s]/g, "")
    .toLowerCase()
    .trim();
  const words = cleaned.split(/\s+/).filter((w) => w.length > 0);
  if (cleaned.length < 2) return true;
  if (/^(.)\1+$/.test(cleaned.replace(/\s/g, ""))) return true;
  const noSpaces = cleaned.replace(/\s/g, "");
  const vowelCount = (noSpaces.match(/[aeiou]/gi) || []).length;
  const vowelRatio = noSpaces.length > 0 ? vowelCount / noSpaces.length : 0;
  if (noSpaces.length > 4 && vowelRatio < 0.12) return true;
  const throwawayWords = new Set([
    "this",
    "that",
    "what",
    "yes",
    "no",
    "ok",
    "okay",
    "sure",
    "test",
    "testing",
    "junky",
    "junk",
    "stuff",
    "thing",
    "things",
    "idk",
    "hmm",
    "um",
    "uh",
    "huh",
    "nah",
    "nope",
    "yep",
    "yeah",
    "yea",
    "lol",
    "lmao",
    "haha",
    "bruh",
    "bro",
    "dude",
    "cool",
    "nice",
    "wow",
    "meh",
    "blah",
    "asdf",
    "qwer",
    "zxcv",
    "sdfg",
    "hjkl",
    "nothing",
    "something",
    "whatever",
    "random",
    "check",
    "see",
    "try",
    "done",
    "thanks",
    "thank",
    "bye",
    "stop",
    "wait",
    "go",
    "help",
    "why",
    "how",
    "who",
    "when",
    "where",
    "the",
    "a",
    "an",
    "it",
    "is",
    "was",
    "are",
    "do",
    "does",
    "can",
    "will",
    "just",
    "only",
    "here",
    "there",
    "now",
    "then",
    "please",
    "plz",
    "pls",
    "aaa",
    "bbb",
    "xxx",
    "zzz",
    "abc",
  ]);
  if (words.length <= 2 && words.every((w) => throwawayWords.has(w)))
    return true;
  const actionKeywords = new Set([
    "add",
    "create",
    "build",
    "make",
    "change",
    "update",
    "fix",
    "remove",
    "delete",
    "move",
    "style",
    "color",
    "font",
    "resize",
    "align",
    "center",
    "navbar",
    "footer",
    "header",
    "hero",
    "section",
    "page",
    "button",
    "form",
    "image",
    "text",
    "link",
    "menu",
    "sidebar",
    "card",
    "grid",
    "responsive",
    "mobile",
    "dark",
    "light",
    "animate",
    "animation",
    "deploy",
    "publish",
    "portfolio",
    "blog",
    "ecommerce",
    "landing",
    "redesign",
    "improve",
    "refactor",
    "optimize",
  ]);
  if (words.length === 1 && !actionKeywords.has(words[0])) return true;
  return false;
}

// ── Live Thumbnail component ──
function LiveThumbnail({ projectId }) {
  const [html, setHtml] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    fetch(`/api/projects/${projectId}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const tree = data?.project?.currentFileTree;
        if (tree && tree["index.html"]) {
          setHtml(tree["index.html"]);
        } else {
          setFailed(true);
        }
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  if (failed || !html) {
    return (
      <div className="lv-card-thumb-placeholder">
        <LayoutTemplate size={28} />
      </div>
    );
  }

  return (
    <iframe
      srcDoc={html}
      title="preview"
      sandbox="allow-scripts allow-same-origin"
      loading="lazy"
    />
  );
}

// ── Template Thumbnail ──
function TemplateThumbnail({ templateId }) {
  const [html, setHtml] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!templateId) return;
    let cancelled = false;
    fetch(`/api/templates/preview/${templateId}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.html) {
          setHtml(data.html);
        } else {
          setFailed(true);
        }
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [templateId]);

  if (failed || !html) {
    return (
      <div className="lv-card-thumb-placeholder">
        <LayoutTemplate size={28} />
      </div>
    );
  }

  return (
    <iframe
      srcDoc={html}
      title="template preview"
      sandbox="allow-scripts allow-same-origin"
      loading="lazy"
    />
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user: clerkUser } = useUser();
  const { userData, fetchUserData } = useAuthStore();
  const [promptValue, setPromptValue] = useState("");
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [placeholder, setPlaceholder] = useState("");
  const [charIdx, setCharIdx] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const [warningMsg, setWarningMsg] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const textareaRef = useRef(null);

  const { projects, createProject, fetchProjects, isLoading: isProjectsLoading } = useProjectStore();
  const { recentItems } = useRecentlyViewedStore();

  // Tab state
  const [activeTab, setActiveTab] = useState("projects");

  // Templates
  const [templates, setTemplates] = useState([]);

  // Fetch projects on mount if empty
  useEffect(() => {
    if (isLoaded && isSignedIn && projects.length === 0 && !isProjectsLoading) {
      getToken().then(token => {
        const { activeWorkspaceId } = useWorkspaceStore.getState();
        fetchProjects(token, activeWorkspaceId);
      });
    }
  }, [isLoaded, isSignedIn]); // Only depend on auth load

  useEffect(() => {
    if (isLoaded && isSignedIn && !userData) {
      fetchUserData(getToken);
    }
  }, [isLoaded, isSignedIn]); // Only depend on auth load

  // Fetch templates on mount — dedup by slug so multi-category templates show once
  useEffect(() => {
    fetch("/api/templates")
      .then((r) => r.json())
      .then((data) => {
        if (data.templates) {
          // API already returns one entry per template, but guard against duplicates
          const seen = new Set();
          const unique = data.templates.filter(t => {
            if (!t.isVisible) return false;
            const key = t.slug || t.id;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          setTemplates(unique);
        }
      })
      .catch(() => { });
  }, []);

  // Typewriter placeholder
  useEffect(() => {
    const current = PROMPTS[placeholderIdx];
    let timeout;
    if (!isDeleting) {
      if (charIdx < current.length) {
        timeout = setTimeout(() => {
          setPlaceholder(current.slice(0, charIdx + 1));
          setCharIdx((c) => c + 1);
        }, 45);
      } else {
        timeout = setTimeout(() => setIsDeleting(true), 2800);
      }
    } else {
      if (charIdx > 0) {
        timeout = setTimeout(() => {
          setPlaceholder(current.slice(0, charIdx - 1));
          setCharIdx((c) => c - 1);
        }, 20);
      } else {
        setIsDeleting(false);
        setPlaceholderIdx((i) => (i + 1) % PROMPTS.length);
      }
    }
    return () => clearTimeout(timeout);
  }, [charIdx, isDeleting, placeholderIdx]);

  const userName =
    userData?.name ||
    clerkUser?.fullName ||
    clerkUser?.username ||
    userData?.email?.split("@")[0] ||
    "User";

  const handleInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  };

  const handleSend = async () => {
    const trimmed = promptValue.trim();
    if (!trimmed || isCreating) return;

    // Check for gibberish/vague prompts BEFORE creating a project
    if (isNonActionablePrompt(trimmed)) {
      setWarningMsg(
        'That doesn\'t look like a website description. Try something like: "A portfolio website with dark mode" or "An e-commerce store for shoes"',
      );
      setTimeout(() => setWarningMsg(""), 5000);
      return;
    }

    setWarningMsg("");
    setIsCreating(true);

    try {
      const token = await getToken();
      const folderId = searchParams.get("folder");
      const { activeWorkspaceId } = useWorkspaceStore.getState();
      
      const newProjectId = await createProject(
        trimmed,
        token,
        folderId || null,
        null,
        activeWorkspaceId,
      );

      if (!newProjectId) {
         // If createProject returns null, it means an error occurred and was handled in the store
         // But we want to know what the error was. Let's make createProject throw or handle it.
         throw new Error("Failed to create project");
      }

      // Redirect to the real project URL
      const url = `/chat/${newProjectId}?prompt=${encodeURIComponent(trimmed)}`;
      navigate(url);
    } catch (err) {
      console.error('Project creation failed:', err);
      setWarningMsg(err.message || "Failed to create project. Please try again.");
      setIsCreating(false);
      
      // If limit reached, scroll to top to see the warning
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Build recently viewed list from stored IDs + project data
  const recentProjects = recentItems
    .map((item) => {
      const proj = projects.find((p) => p.id === item.projectId);
      return proj ? { ...proj, viewedAt: item.viewedAt } : null;
    })
    .filter(Boolean);

  // Format time ago
  const timeAgo = (date) => {
    if (!date) return "";
    const now = Date.now();
    const ts = typeof date === "number" ? date : new Date(date).getTime();
    const diff = Math.floor((now - ts) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(ts).toLocaleDateString();
  };

  if (!isLoaded) {
    return null;
  }

  return (
    <div className="lv-dashboard-page">
      <div className="lv-center-content">
        <h1 className="lv-hero-title">Ready to build, {userName}?</h1>

        {warningMsg && (
          <div
            style={{
              maxWidth: "680px",
              width: "100%",
              marginBottom: "16px",
              padding: "12px 16px",
              borderRadius: "12px",
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#fca5a5",
              fontSize: "13px",
              lineHeight: "1.5",
              animation: "slideUpFade 0.2s ease-out",
              textAlign: "center",
            }}
          >
            {warningMsg}
          </div>
        )}

        <div className="lv-prompt-box">
          <textarea
            ref={textareaRef}
            value={promptValue}
            onChange={(e) => {
              setPromptValue(e.target.value);
              handleInput();
            }}
            placeholder={placeholder}
            className="lv-prompt-textarea"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <div className="lv-prompt-toolbar">
            <div className="lv-toolbar-left">
              <button className="lv-tool-icon">
                <Plus size={24} />
              </button>
              <button className="lv-tool-icon">
                <MessageSquare size={24} />
              </button>
            </div>
            <div className="lv-toolbar-right">
              <button className="lv-tool-icon">
                <Mic size={24} />
              </button>
              <button
                className={`lv-send-btn ${promptValue.trim() ? "active" : ""}`}
                onClick={handleSend}
                disabled={!promptValue.trim() || isCreating}
              >
                <ArrowUp size={18} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab Section ── */}
      <div className="lv-tab-section">
        <div className="lv-tabs-bar">
          <button
            className={`lv-tab ${activeTab === "projects" ? "active" : ""}`}
            onClick={() => setActiveTab("projects")}
          >
            My projects
          </button>
          <button
            className={`lv-tab ${activeTab === "recent" ? "active" : ""}`}
            onClick={() => setActiveTab("recent")}
          >
            Recently viewed
          </button>
          <button
            className={`lv-tab ${activeTab === "templates" ? "active" : ""}`}
            onClick={() => setActiveTab("templates")}
          >
            Templates
          </button>
          <button
            className="lv-tab-browse"
            onClick={() => navigate("/templates")}
          >
            Browse all <ArrowRight size={14} />
          </button>
        </div>

        {/* ── My Projects ── */}
        {activeTab === "projects" &&
          (isProjectsLoading && projects.length === 0 ? (
            <div className="lv-empty-tab">
               <div className="lv-loading-spinner" />
               <div className="lv-empty-tab-text">Loading your projects...</div>
            </div>
          ) : projects.length > 0 ? (
            <div className="lv-cards-grid" key="projects">
              {projects.slice(0, 4).map((proj) => (
                <div
                  key={proj.id}
                  className="lv-project-card"
                  onClick={() => navigate(`/chat/${proj.id}`)}
                >
                  <div className="lv-card-thumb">
                    <LiveThumbnail projectId={proj.id} />
                    <div className="lv-card-thumb-gradient" />
                    {proj.publishedUrl && (
                      <div className="lv-card-badge">Published</div>
                    )}
                  </div>
                  <div className="lv-card-body">
                    <div className="lv-card-title">{proj.name}</div>
                    <div className="lv-card-meta">
                      {timeAgo(proj.updatedAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="lv-empty-tab">
              <FolderOpen size={36} className="lv-empty-tab-icon" />
              <div className="lv-empty-tab-text">No projects yet</div>
              <button
                className="lv-empty-tab-btn"
                onClick={() => textareaRef.current?.focus()}
              >
                Create your first project
              </button>
            </div>
          ))}

        {/* ── Recently Viewed ── */}
        {activeTab === "recent" &&
          (recentProjects.length > 0 ? (
            <div className="lv-cards-grid" key="recent">
              {recentProjects.slice(0, 4).map((proj) => (
                <div
                  key={proj.id}
                  className="lv-project-card"
                  onClick={() => navigate(`/chat/${proj.id}`)}
                >
                  <div className="lv-card-thumb">
                    <LiveThumbnail projectId={proj.id} />
                    <div className="lv-card-thumb-gradient" />
                    {proj.publishedUrl && (
                      <div className="lv-card-badge">Published</div>
                    )}
                  </div>
                  <div className="lv-card-body">
                    <div className="lv-card-title">{proj.name}</div>
                    <div className="lv-card-meta">
                      Viewed {timeAgo(proj.viewedAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="lv-empty-tab">
              <Clock size={36} className="lv-empty-tab-icon" />
              <div className="lv-empty-tab-text">
                No recently viewed projects
              </div>
              <div className="lv-card-meta">
                Projects you open will appear here
              </div>
            </div>
          ))}

        {/* ── Templates ── */}
        {activeTab === "templates" &&
          (templates.length > 0 ? (
            <div className="lv-cards-grid" key="templates">
              {templates.slice(0, 4).map((t) => (
                <div
                  key={t.id}
                  className="lv-project-card"
                  onClick={() => navigate(`/templates`)}
                >
                  <div className="lv-card-thumb">
                    <TemplateThumbnail templateId={t.id} />
                    <div className="lv-card-thumb-gradient" />
                  </div>
                  <div className="lv-card-body">
                    <div className="lv-card-title">{t.themeName || t.title}</div>
                    <div className="lv-card-desc">{t.themeTagline || t.description}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="lv-empty-tab">
              <LayoutTemplate size={36} className="lv-empty-tab-icon" />
              <div className="lv-empty-tab-text">Loading templates...</div>
            </div>
          ))}
      </div>
    </div>
  );
}
