// Markdown to HTML conversion utility

// Load marked.js from CDN if not available
if (typeof marked === 'undefined') {
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
  document.head.appendChild(script);
  
  // Wait for script to load
  script.onload = () => {
    configureMarked();
  };
} else {
  configureMarked();
}

function configureMarked() {
  // Configure marked options
  if (typeof marked !== 'undefined') {
    marked.setOptions({
      breaks: true,
      gfm: true,
      pedantic: false,
      sanitize: false,
      smartypants: false
    });
  }
}

// Convert markdown to HTML with security considerations
function markdownToHtml(markdown) {
  if (!markdown) return '';
  
  // Wait for marked to be loaded
  if (typeof marked === 'undefined') {
    console.log('marked not loaded yet');
    return markdown;
  }
  
  try {
    // Use the marked library to convert markdown to HTML
    return marked.parse(markdown);
  } catch (error) {
    console.error('Error rendering markdown:', error);
    return markdown;
  }
}

// Simple URL sanitization function
function sanitizeUrl(url) {
  if (!url) return null;
  
  // Check for javascript: protocol
  const javascriptProtocol = /^\s*javascript:/i;
  if (javascriptProtocol.test(url)) {
    return null;
  }
  
  // Check for data: protocol
  const dataProtocol = /^\s*data:/i;
  if (dataProtocol.test(url) && !url.startsWith('data:image/')) {
    return null;
  }
  
  return url;
}
