/**
 * Code Validator V3.0
 * 
 * Performs instantaneous AST-lite Regex validation of the AI generated code string
 * before the UI renders it. Maps exactly to Section 8: Code Quality Rules.
 * Prevents hallucinatory CSS logic from breaking the preview iframe.
 */

/**
 * Array of strict validation rules matching Section 8 in stackforge-rulebook.md.
 * `matcher` runs against the code string. If it returns true, the rule is VIOLATED.
 */
const GLOBAL_RULES = [
  {
    code: 'INLINE_STYLE',
    matcher: (str) => /style=["'].*?["']/i.test(str) || /style=\{\{.*?\}\}/i.test(str),
    message: 'Remove all inline style="" or style={{}}. Always use CSS classes or utility classes.',
    maxRetries: 2
  },
  {
    code: 'CONSOLE_LOG',
    matcher: (str) => /console\.(log|warn|error)\(/i.test(str),
    message: 'Remove all console.log/error/warn statements.',
    maxRetries: 1
  },
  {
    code: 'LOREM_IPSUM',
    matcher: (str) => /lorem\s+ipsum/i.test(str),
    message: 'Replace lorem ipsum with contextually appropriate realistic text.',
    maxRetries: 1
  },
  {
    code: 'TODO_FIXME',
    matcher: (str) => /\/\/\s*(TODO|FIXME|HACK|XXX)/i.test(str),
    message: 'Remove all TODO, FIXME, HACK, XXX comments.',
    maxRetries: 1
  },
  {
    code: 'MISSING_ALT',
    matcher: (str) => /<img\s[^>]*(?!alt=)[^>]*>/i.test(str) && /<img/i.test(str) && !/<img[^>]+alt=/i.test(str.match(/<img[^>]*>/i)?.[0] || ''),
    message: 'Add alt attributes to all img tags. Decorative: alt="". Meaningful: describe the image.',
    maxRetries: 1
  }
];

const HTML_RULES = [
  {
    code: 'IMPORT_IN_HTML',
    matcher: (str) => /\bimport\s+.*\s+from\s+['"]/i.test(str) || /\brequire\s*\(/i.test(str),
    message: 'Track A (HTML) must have ZERO import/require statements. All libraries via CDN only.',
    maxRetries: 2
  }
];

const NEXTJS_RULES = [
  {
    code: 'HARDCODED_COLOR',
    matcher: (str) => /text-\[#[0-9a-fA-F]{3,6}\]/i.test(str) || /bg-\[#[0-9a-fA-F]{3,6}\]/i.test(str),
    message: 'Replace all arbitrary hex values in classes (e.g. text-[#ff0000]) with CSS custom properties from :root (var(--color-name)).',
    maxRetries: 2
  },
  {
    code: 'MISSING_USE_CLIENT',
    matcher: (str) => {
      const usesClientLibs = /from\s+['"](react|framer-motion)['"]/.test(str) || /useState|useEffect|useRef/.test(str);
      const hasUseClient = /['"]use\s+client['"]/.test(str);
      return usesClientLibs && !hasUseClient;
    },
    message: 'All interactive components importing hooks or framer-motion must begin with "use client".',
    maxRetries: 1
  },
  {
    code: 'FORBIDDEN_PACKAGE',
    matcher: (str) => {
      // Allowed packages in Track B (Section 7.2 + 7.3)
      const ALLOWED = new Set([
        'react', 'react-dom', 'next', 'next/font', 'next/font/google', 'next/image', 'next/link',
        'framer-motion', 'lucide-react', 'tailwindcss',
        'clsx', 'class-variance-authority', 'tailwind-merge',
        '@radix-ui/react-dialog', '@radix-ui/react-tooltip', '@radix-ui/react-accordion',
        '@radix-ui/react-slot',
      ]);
      const importMatches = str.matchAll(/from\s+['"]([^'"./][^'"]*)['"]/g);
      for (const match of importMatches) {
        const pkg = match[1].startsWith('@') ? match[1] : match[1].split('/')[0];
        if (!ALLOWED.has(pkg) && !ALLOWED.has(match[1])) {
          return true;
        }
      }
      return false;
    },
    message: 'Remove forbidden package imports. Use only packages from the allowed list (Section 7.2/7.3).',
    maxRetries: 2
  }
];

/**
 * Synchronous code validator against generated LLM strings.
 * 
 * @param {string} codeString Generated raw code
 * @param {'html' | 'nextjs'} outputTrack 
 * @returns {{ isValid: boolean, code?: string, message?: string, maxRetries?: number }}
 */
function validateCode(codeString, outputTrack) {
  // 1. Run global checks
  for (const rule of GLOBAL_RULES) {
    if (rule.matcher(codeString)) {
      return {
        isValid: false,
        code: rule.code,
        message: rule.message,
        maxRetries: rule.maxRetries
      };
    }
  }

  // 2. Run track-specific checks
  if (outputTrack === 'html') {
    for (const rule of HTML_RULES) {
      if (rule.matcher(codeString)) {
        return {
          isValid: false,
          code: rule.code,
          message: rule.message,
          maxRetries: rule.maxRetries
        };
      }
    }
  }

  if (outputTrack === 'nextjs') {
    for (const rule of NEXTJS_RULES) {
      if (rule.matcher(codeString)) {
        return {
          isValid: false,
          code: rule.code,
          message: rule.message,
          maxRetries: rule.maxRetries
        };
      }
    }
  }

  // Code passed strict regex checks!
  return { isValid: true };
}

// V3.0 alias — plan uses both names
const validateFile = (filePath, content) => validateCode(content, filePath.endsWith('.html') ? 'html' : 'nextjs');

module.exports = { validateCode, validateFile };

