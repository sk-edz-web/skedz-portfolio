import { ProjectItem } from '../types';

/**
 * Generates a clean, universal share URL for a specific project card.
 * When visited, this URL automatically directs to the Works view
 * and opens this exact project card in fullscreen!
 */
export function getCardShareUrl(projectId: string): string {
  if (typeof window === 'undefined') return '';
  const origin = window.location.origin;
  return `${origin}/?project=${encodeURIComponent(projectId)}`;
}

export interface ShareResult {
  success: boolean;
  method: 'native' | 'clipboard';
  url: string;
}

/**
 * Attempts native Web Share API (mobile/desktop), with automatic
 * fallback to copying the direct share link to clipboard.
 */
export async function shareProjectCard(project: ProjectItem): Promise<ShareResult> {
  const url = getCardShareUrl(project.id);
  const title = `${project.title} | Sarathi Portfolio`;
  const text = `Take a look at "${project.title}" on Sarathi's creative portfolio!`;

  // Try Native Share first (perfect for mobile, WhatsApp, Instagram, Telegram)
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title,
        text,
        url,
      });
      return { success: true, method: 'native', url };
    } catch (err: any) {
      // User dismissed or aborted native dialog, fall through to clipboard copy if error wasn't AbortError
      if (err.name === 'AbortError') {
        return { success: false, method: 'native', url };
      }
    }
  }

  // Fallback: Clipboard copy
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      return { success: true, method: 'clipboard', url };
    }
  } catch (clipErr) {
    console.error('Clipboard copy failed:', clipErr);
  }

  // Last-ditch textarea copy fallback for older browsers or restricted permissions
  try {
    const textarea = document.createElement('textarea');
    textarea.value = url;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return { success: true, method: 'clipboard', url };
  } catch {
    return { success: false, method: 'clipboard', url };
  }
}

/**
 * Generates a direct WhatsApp share link
 */
export function getWhatsAppShareUrl(project: ProjectItem): string {
  const url = getCardShareUrl(project.id);
  const message = `Check out "${project.title}" by Sarathi:\n${url}`;
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
}
