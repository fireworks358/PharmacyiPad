import { StickyNote, MapPin } from 'lucide-react';

export default function DrugCard({ drug, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-md px-6 py-4 mb-2 mx-4 max-w-5xl mx-auto border-2 border-nhs-border cursor-pointer active:scale-[0.99] transition-transform"
    >
      {/* Drug name */}
      <h3
        className="font-bold text-nhs-black leading-tight"
        style={{ fontSize: '42px', lineHeight: '50px' }}
      >
        {drug.name}
      </h3>

      {/* Location, type, badges, and notes icon - all on one line */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-6">
          <div className="flex items-center text-nhs-blue">
            <MapPin className="flex-shrink-0 mr-2" size={36} />
            <span className="font-bold" style={{ fontSize: '26px' }}>
              {drug.location}
            </span>
          </div>

          {drug.outOfStock && (
            <span className="inline-block bg-nhs-red text-white px-4 py-1 rounded-full font-bold" style={{ fontSize: '18px' }}>
              Out of Stock
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <span className="text-nhs-grey" style={{ fontSize: '22px' }}>
            {drug.drugType}
          </span>

          {drug.hasNotes && (
            <StickyNote className="text-nhs-blue flex-shrink-0" size={36} />
          )}
        </div>
      </div>
    </div>
  );
}
