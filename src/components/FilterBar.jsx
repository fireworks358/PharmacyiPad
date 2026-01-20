export default function FilterBar({ drugTypes, activeFilter, onFilterChange }) {
  return (
    <div className="bg-nhs-background border-b-2 border-nhs-border px-4 py-4">
      <div className="flex overflow-x-auto scrollbar-hide gap-3 max-w-5xl mx-auto">
        <button
          onClick={() => onFilterChange(null)}
          className={`px-8 py-3 rounded-lg whitespace-nowrap text-nhs-body ipad:text-nhs-heading-s font-bold transition-colors ${
            activeFilter === null
              ? 'bg-nhs-blue text-white shadow-md'
              : 'bg-white text-nhs-black border-2 border-nhs-border hover:bg-gray-100'
          }`}
        >
          All
        </button>
        {drugTypes.map((type) => (
          <button
            key={type}
            onClick={() => onFilterChange(type)}
            className={`px-8 py-3 rounded-lg whitespace-nowrap text-nhs-body ipad:text-nhs-heading-s font-bold transition-colors ${
              activeFilter === type
                ? 'bg-nhs-blue text-white shadow-md'
                : 'bg-white text-nhs-black border-2 border-nhs-border hover:bg-gray-100'
            }`}
          >
            {type}
          </button>
        ))}
      </div>
    </div>
  );
}
