import { StickyNote, MapPin } from 'lucide-react';

export default function DrugCard({ drug, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-md p-8 mb-3 mx-4 max-w-5xl mx-auto border-2 border-nhs-border cursor-pointer active:scale-[0.99] transition-transform"
    >
      {/* Drug name - very large for visibility */}
      <h3
        className="font-bold text-nhs-black leading-tight"
        style={{ fontSize: '48px', lineHeight: '60px' }}
      >
        {drug.name}
      </h3>

      {/* Location - prominent with icon */}
      <div className="flex items-center mt-5 text-nhs-blue">
        <MapPin className="flex-shrink-0 mr-4" size={48} />
        <span
          className="font-bold"
          style={{ fontSize: '30px', lineHeight: '40px' }}
        >
          {drug.location}
        </span>
      </div>

      {/* Bottom row: Type, badges, and notes icon */}
      <div className="flex items-center justify-between mt-6 pt-5 border-t border-nhs-border">
        <div className="flex items-center gap-5">
          <span className="text-nhs-heading-m text-nhs-grey">
            {drug.drugType}
          </span>

          {drug.outOfStock && (
            <span className="inline-block bg-nhs-red text-white px-6 py-3 rounded-full text-nhs-heading-s font-bold">
              Out of Stock
            </span>
          )}
        </div>

        {drug.hasNotes && (
          <StickyNote className="text-nhs-blue flex-shrink-0" size={48} />
        )}
      </div>
    </div>
  );
}
