import sanitizeHtml from "sanitize-html";

// Back-office rich text (promotions): allow-list sanitizer. Anything not listed is dropped:
// scripts, iframes, forms, event handlers, javascript:/data: URLs, CSS expressions ...
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "br", "div", "span", "b", "strong", "i", "em", "u", "s", "small", "sub", "sup", "blockquote",
    "ul", "ol", "li", "h1", "h2", "h3", "h4", "h5", "h6", "a", "img", "table", "thead", "tbody", "tr", "th", "td", "hr", "font",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    img: ["src", "alt", "width", "height"],
    td: ["colspan", "rowspan"],
    th: ["colspan", "rowspan"],
    "*": ["style"],
  },
  // Only harmless formatting survives in style="" (fonts are overridden by the site anyway).
  allowedStyles: {
    "*": {
      color: [/^#[0-9a-f]{3,8}$/i, /^rgba?\([\d\s.,%]+\)$/i, /^[a-z]+$/i],
      "background-color": [/^#[0-9a-f]{3,8}$/i, /^rgba?\([\d\s.,%]+\)$/i, /^[a-z]+$/i],
      "text-align": [/^(left|right|center|justify)$/],
      "font-weight": [/^(normal|bold|bolder|[1-9]00)$/],
      "font-style": [/^(normal|italic)$/],
      "text-decoration": [/^(none|underline|line-through)$/],
    },
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesByTag: { img: ["http", "https"] },
  allowProtocolRelative: false,
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs: { ...attribs, rel: "noopener noreferrer", ...(attribs.href ? { target: "_blank" } : {}) },
    }),
  },
};

export function cleanHtml(html: unknown): string {
  if (typeof html !== "string") return "";
  return sanitizeHtml(html, OPTIONS);
}
