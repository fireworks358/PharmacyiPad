import { useState, useMemo } from 'react';
import { useCloudDrugData } from './hooks/useCloudDrugData';
import SearchBar from './components/SearchBar';
import FilterBar from './components/FilterBar';
import DrugCard from './components/DrugCard';
import DrugModal from './components/DrugModal';
import EmptyState from './components/EmptyState';
import FloatingAddButton from './components/FloatingAddButton';
import ErrorBanner from './components/ErrorBanner';

function App() {
  const {
    drugs,
    isLoading,
    isSaving,
    error,
    addDrug,
    updateDrug,
    deleteDrug,
    refresh,
    clearError,
  } = useCloudDrugData();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState(null);
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Derived state: filtered drugs
  const filteredDrugs = useMemo(() => {
    return drugs.filter((drug) => {
      const matchesSearch = drug.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesFilter = !activeFilter || drug.drugType === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [drugs, searchTerm, activeFilter]);

  // Derived state: unique drug types
  const drugTypes = useMemo(() => {
    return [...new Set(drugs.map((d) => d.drugType).filter(Boolean))].sort();
  }, [drugs]);

  // Derived state: sorted drugs
  const sortedDrugs = useMemo(() => {
    return [...filteredDrugs].sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredDrugs]);

  // Handle save drug (edit)
  const handleSaveDrug = async (updatedDrug) => {
    try {
      await updateDrug(updatedDrug);
      setSelectedDrug(null);
    } catch {
      // Error is handled by the hook
    }
  };

  // Handle add drug
  const handleAddDrug = async (newDrug) => {
    try {
      await addDrug(newDrug);
      setIsAddModalOpen(false);
    } catch {
      // Error is handled by the hook
    }
  };

  // Handle delete drug
  const handleDeleteDrug = async (drugId) => {
    if (window.confirm('Are you sure you want to delete this drug?')) {
      try {
        await deleteDrug(drugId);
        setSelectedDrug(null);
      } catch {
        // Error is handled by the hook
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-nhs-background">
        <p className="text-nhs-heading-m text-nhs-black">Loading pharmacy inventory...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-nhs-background ${error ? 'pt-12' : ''}`}>
      <ErrorBanner message={error} onDismiss={clearError} />

      <SearchBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onRefresh={refresh}
        isRefreshing={isLoading}
      />
      <FilterBar
        drugTypes={drugTypes}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      <div className="pb-8 pt-4">
        {sortedDrugs.length === 0 ? (
          <EmptyState message="No drugs found. Try adjusting your search or filter." />
        ) : (
          sortedDrugs.map((drug) => (
            <DrugCard
              key={drug.id}
              drug={drug}
              onClick={() => setSelectedDrug(drug)}
            />
          ))
        )}
      </div>

      {/* Edit Drug Modal */}
      {selectedDrug && (
        <DrugModal
          drug={selectedDrug}
          isOpen={Boolean(selectedDrug)}
          onClose={() => setSelectedDrug(null)}
          onSave={handleSaveDrug}
          onDelete={handleDeleteDrug}
          mode="edit"
          drugTypes={drugTypes}
          isSaving={isSaving}
        />
      )}

      {/* Add Drug Modal */}
      {isAddModalOpen && (
        <DrugModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleAddDrug}
          mode="add"
          drugTypes={drugTypes}
          isSaving={isSaving}
        />
      )}

      <FloatingAddButton onClick={() => setIsAddModalOpen(true)} />

      <img
        src="/Logo.png"
        alt="Trust Logo"
        className="fixed bottom-4 right-4 h-12 w-auto z-50"
      />
    </div>
  );
}

export default App;
