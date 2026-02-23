// Citation format generators (for fallback when API unavailable)
export function generateCitationAPA(paper) {
  const authors = paper.authors?.map(a => a.name).join(', ') || 'Unknown';
  const year = paper.year || 'n.d.';
  const title = paper.title || 'Unknown Title';
  const journal = paper.journal || 'Unknown Journal';
  const doi = paper.doi ? `, https://doi.org/${paper.doi}` : '';

  return `${authors} (${year}). ${title}. ${journal}${doi}.`;
}

export function generateCitationMLA(paper) {
  const authors = paper.authors?.map(a => a.name).join(', ') || 'Unknown';
  const title = paper.title || 'Unknown Title';
  const journal = paper.journal || 'Unknown Journal';
  const year = paper.year || 'n.d.';
  const doi = paper.doi ? `, doi:${paper.doi}` : '';

  return `${authors}. "${title}." ${journal}, ${year}${doi}.`;
}

// Copy to clipboard
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Copy to clipboard failed:', error);
    return false;
  }
}

// Download file
export function downloadFile(content, filename, type = 'text/plain') {
  const element = document.createElement('a');
  element.setAttribute('href', `data:${type};charset=utf-8,${encodeURIComponent(content)}`);
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

// Format date
export function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Truncate text
export function truncate(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// Debounce function
export function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

// Search highlighting
export function highlightSearchTerm(text, term) {
  if (!text || !term) return text;
  const regex = new RegExp(`(${term})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}