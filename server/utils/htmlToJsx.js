function convertStyle(styleString) {
  if (!styleString) return '{}';
  const styleObj = {};
  const declarations = styleString.split(';');
  for (const dec of declarations) {
    if (!dec.trim()) continue;
    const parts = dec.split(':');
    if (parts.length >= 2) {
      const keyStr = parts.shift().trim();
      const valStr = parts.join(':').trim();
      const camelKey = keyStr.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
      styleObj[camelKey] = valStr;
    }
  }
  return JSON.stringify(styleObj);
}

function htmlToJsx(html) {
  if (!html) return '';
  
  // 1. Replace class with className
  let jsx = html.replace(/class=/g, 'className=');
  
  // 2. Remove HTML comments
  jsx = jsx.replace(/<!--[\s\S]*?-->/g, '');
  
  // 3. Self-close tags (img, input, br, hr, path, circle, svg, polygon)
  // Also close <path> or other SVG tags if they don't have closing tags? Usually they do, or we can use a simpler approach.
  jsx = jsx.replace(/<(img|input|br|hr)([^>]*?)(?<!\/)>/ig, '<$1$2 />');
  
  // 4. Convert inline styles strings to React objects
  jsx = jsx.replace(/style="([^"]*?)"/gi, (match, styleString) => {
    return `style={${convertStyle(styleString)}}`;
  });

  // 5. Strip inline DOM event handlers (they prevent React from compiling)
  jsx = jsx.replace(/onmouseover="[^"]*"/gi, '');
  jsx = jsx.replace(/onmouseout="[^"]*"/gi, '');
  jsx = jsx.replace(/onclick="[^"]*"/gi, '');
  
  // 6. SVG specific attributes (React expects camelCase)
  jsx = jsx.replace(/stroke-width/g, 'strokeWidth');
  jsx = jsx.replace(/stroke-linecap/g, 'strokeLinecap');
  jsx = jsx.replace(/stroke-linejoin/g, 'strokeLinejoin');
  jsx = jsx.replace(/fill-rule/g, 'fillRule');
  jsx = jsx.replace(/clip-rule/g, 'clipRule');
  jsx = jsx.replace(/viewbox/gi, 'viewBox');
  
  return `<>\n${jsx}\n</>`;
}

module.exports = { htmlToJsx, convertStyle };
