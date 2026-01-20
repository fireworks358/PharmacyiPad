import { Plus } from 'lucide-react';

export default function FloatingAddButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 right-4 w-16 h-16 bg-nhs-green hover:bg-nhs-green/90 active:bg-nhs-green/80 text-white rounded-full shadow-lg flex items-center justify-center z-40 transition-colors"
      aria-label="Add new drug"
    >
      <Plus size={32} />
    </button>
  );
}
