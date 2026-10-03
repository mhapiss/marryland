import { toast } from 'sonner';
import { TOAST } from '../constants/toastMessages';

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(TOAST.copySuccess);
    return true;
  } catch {
    // Fallback for iOS Safari < 13.1 and older browsers
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      textarea.setSelectionRange(0, text.length);
      document.execCommand('copy');
      document.body.removeChild(textarea);
      toast.success(TOAST.copySuccess);
      return true;
    } catch {
      toast.error(TOAST.copyFail);
      return false;
    }
  }
}
