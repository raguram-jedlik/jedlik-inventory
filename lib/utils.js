/**
 * Shared client-side utility functions.
 * Port of the utility functions from JavaScript.html.
 */

/**
 * Escapes HTML entities for safe display.
 */
export function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(String(str)));
  return div.innerHTML;
}

/**
 * Formats a date for display.
 */
export function formatDate(date) {
  if (!date) return '—';
  if (typeof date === 'string') {
    if (date === '' || date === '—') return '—';
    date = new Date(date);
  }
  if (!(date instanceof Date) || isNaN(date.getTime())) return String(date);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return date.getDate() + ' ' + months[date.getMonth()] + ' ' + date.getFullYear();
}

/**
 * Formats a date with time.
 */
export function formatDateTime(date) {
  if (!date) return '—';
  if (typeof date === 'string') {
    if (date === '' || date === '—') return '—';
    date = new Date(date);
  }
  if (!(date instanceof Date) || isNaN(date.getTime())) return String(date);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let h = date.getHours();
  let m = date.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  m = m < 10 ? '0' + m : m;

  return date.getDate() + ' ' + months[date.getMonth()] + ', ' + h + ':' + m + ' ' + ampm;
}

/**
 * Formats a number as currency (₹).
 */
export function formatCurrency(amount) {
  const num = parseFloat(amount) || 0;
  return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Returns time ago string.
 */
export function timeAgo(date) {
  if (!date) return '';
  if (typeof date === 'string') date = new Date(date);
  if (!(date instanceof Date) || isNaN(date.getTime())) return '';

  const diff = Math.floor((new Date() - date) / 1000);

  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
  return formatDate(date);
}

/**
 * Debounce function.
 */
export function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Copies text to clipboard.
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }
}

/**
 * Helper to call API endpoints.
 */
export async function callApi(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json();
  if (!res.ok && data.error) {
    throw new Error(data.error);
  }
  return data;
}
