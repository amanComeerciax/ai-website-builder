/**
 * Code Fixer Utility
 * 
 * Automatically sanitizes generated React/JSX code to fix common AI hallucinations:
 * 1. Lucide icon casing/misspelling (GitHub vs Github)
 * 2. Missing default exports
 * 3. Common React-Router-Dom usage errors
 */

const COMMON_LUCIDE_ICONS = [
  'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown',
  'ChevronRight', 'ChevronLeft', 'ChevronUp', 'ChevronDown',
  'Menu', 'X', 'Search', 'Bell', 'Settings', 'User', 'Mail', 'Phone',
  'Github', 'Twitter', 'Facebook', 'Instagram', 'Linkedin', 'Globe',
  'Check', 'AlertCircle', 'Info', 'HelpCircle', 'Home', 'Layout',
  'ShoppingBag', 'ShoppingCart', 'Zap', 'Star', 'Heart', 'Trash2',
  'Plus', 'Minus', 'Download', 'Upload', 'ExternalLink', 'Eye', 'EyeOff',
  'Lock', 'Unlock', 'Power', 'RefreshCw', 'Play', 'Pause', 'SkipBack', 'SkipForward',
  'MapPin', 'Calendar', 'Clock', 'CreditCard', 'Shield', 'HardDrive', 'Cpu', 'Database',
  'Layers', 'Image', 'Video', 'Music', 'Cloud', 'Send', 'Paperclip', 'Anchor', 
  'Target', 'Zap', 'Flame', 'Activity', 'Award', 'BarChart', 'PieChart', 'Book',
  'Bookmark', 'Briefcase', 'Camera', 'Code', 'Coffee', 'Compass', 'DollarSign',
  'Edit', 'Filter', 'Flag', 'Folder', 'Gift', 'Grid', 'Hash', 'Key', 'Layers',
  'LifeBuoy', 'Link', 'List', 'Maximize', 'Minimize', 'Monitor', 'Moon', 'MoreHorizontal',
  'Music', 'Package', 'Pause', 'Play', 'Printer', 'Save', 'Server', 'Share', 'Share2',
  'Sliders', 'Smartphone', 'Speaker', 'Sun', 'Tag', 'Terminal', 'ThumbsUp', 'ThumbsDown',
  'Tool', 'TrendingUp', 'TrendingDown', 'Truck', 'Tv', 'UserPlus', 'UserMinus', 'UserCheck',
  'Video', 'Wifi', 'Wind', 'Youtube', 'Linkedin', 'Chrome'
];

function sanitizeReactCode(path, content) {
  if (!path.endsWith('.jsx') && !path.endsWith('.js')) return content;

  let fixed = content;

  // 1. Ensure 'react' is imported if hooks are used but no import exists
  if (content.includes('useState') || content.includes('useEffect') || content.includes('useRef')) {
    if (!content.includes("from 'react'") && !content.includes('from "react"')) {
      fixed = "import React, { useState, useEffect, useRef } from 'react';\n" + fixed;
    }
  }

  // 2. Fix common Lucide icon casing and naming issues (e.g. GitHubIcon -> Github)
  // AI often appends "Icon" or "Logo" to lucide names
  let lucideImports = [];
  const lucideImportRegex = /import\s+{([^}]+)}\s+from\s+['"]lucide-react['"]/g;
  fixed = fixed.replace(lucideImportRegex, (match, p1) => {
    const icons = p1.split(',').map(i => i.trim());
    const fixedIcons = icons.map(i => {
      // Strip common AI suffixes: Icon, Logo, _Icon
      const baseName = i.replace(/(Icon|Logo|_Icon|_Logo)$/i, '');
      const match = COMMON_LUCIDE_ICONS.find(c => c.toLowerCase() === baseName.toLowerCase());
      if (match) {
        // If we fixed the name, we also need to update its usage in the JSX
        if (match !== i) {
          const usageRegex = new RegExp(`<${i}\\b`, 'g');
          const closeUsageRegex = new RegExp(`</${i}\\b`, 'g');
          fixed = fixed.replace(usageRegex, `<${match}`);
          fixed = fixed.replace(closeUsageRegex, `</${match}`);
        }
        lucideImports.push(match);
        return match;
      }
      lucideImports.push(i);
      return i;
    });
    return `import { ${Array.from(new Set(fixedIcons)).join(', ')} } from 'lucide-react'`;
  });

  // Also catch icons used but NOT in the import list (AI often misses adding them to the import)
  COMMON_LUCIDE_ICONS.forEach(icon => {
    const usageRegex = new RegExp(`<${icon}\\b`, 'g');
    if (usageRegex.test(fixed) && !lucideImports.includes(icon)) {
      // Add to imports if missing
      const lucideImportLineRegex = /import\s+{([^}]+)}\s+from\s+['"]lucide-react['"]/;
      if (lucideImportLineRegex.test(fixed)) {
        fixed = fixed.replace(lucideImportLineRegex, (match, p1) => {
          return match.replace(p1, `${p1}, ${icon}`);
        });
      } else {
        fixed = `import { ${icon} } from 'lucide-react';\n` + fixed;
      }
      lucideImports.push(icon);
    }
  });

  // 3. Ensure component has a default export if it looks like a component
  if (!fixed.includes('export default')) {
    const filename = path.split('/').pop().replace(/\.(jsx|js)$/, '');
    const funcRegex = new RegExp(`(function|const|class)\\s+(${filename})\\b`, 'i');
    const match = fixed.match(funcRegex);
    if (match) {
      const actualName = match[2];
      fixed += `\n\nexport default ${actualName};`;
    }
  }

  // 4. Fix common react-router-dom Link vs NavLink issues
  if (fixed.includes('<Link') && !fixed.includes("from 'react-router-dom'") && !fixed.includes('from "react-router-dom"')) {
     fixed = "import { Link } from 'react-router-dom';\n" + fixed;
  }

  return fixed;
}

module.exports = { sanitizeReactCode };
