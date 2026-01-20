import { AlertTriangle, X } from 'lucide-react';

export default function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-nhs-red text-white px-4 py-3 flex items-center justify-between z-50 shadow-md">
      <div className="flex items-center gap-2">
        <AlertTriangle size={20} />
        <span className="text-nhs-body">{message}</span>
      </div>
      <button
        onClick={onDismiss}
        className="p-1 hover:bg-white/20 rounded transition-colors"
        aria-label="Dismiss error"
      >
        <X size={20} />
      </button>
    </div>
  );
}
