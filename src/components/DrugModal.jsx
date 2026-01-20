import { useState, useEffect } from 'react';
import { X, Trash2, Loader2 } from 'lucide-react';

export default function DrugModal({
  drug,
  isOpen,
  onClose,
  onSave,
  onDelete,
  mode = 'edit',
  drugTypes = [],
  isSaving = false,
}) {
  const [formData, setFormData] = useState({
    name: '',
    drugType: '',
    location: '',
    notes: '',
    outOfStock: false,
  });

  useEffect(() => {
    if (mode === 'edit' && drug) {
      setFormData({
        name: drug.name || '',
        drugType: drug.drugType || '',
        location: drug.location || '',
        notes: drug.notes || '',
        outOfStock: drug.outOfStock || false,
      });
    } else if (mode === 'add') {
      setFormData({
        name: '',
        drugType: drugTypes[0] || '',
        location: '',
        notes: '',
        outOfStock: false,
      });
    }
  }, [drug, mode, drugTypes]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      return;
    }

    if (mode === 'edit' && drug) {
      onSave({
        ...drug,
        ...formData,
        hasNotes: Boolean(formData.notes && formData.notes.trim()),
      });
    } else {
      onSave({
        ...formData,
        barcodes: [],
        image: null,
        hasNotes: Boolean(formData.notes && formData.notes.trim()),
      });
    }
  };

  const handleDelete = () => {
    if (drug && onDelete) {
      onDelete(drug.id);
    }
  };

  const isEdit = mode === 'edit';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-30"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-x-0 bottom-0 top-20 bg-white rounded-t-xl z-40 overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-nhs-border px-6 py-4 flex justify-between items-center">
          <h2 className="text-nhs-heading-m font-bold text-nhs-black">
            {isEdit ? 'Edit Drug Details' : 'Add New Drug'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
            aria-label="Close modal"
            disabled={isSaving}
          >
            <X className="text-nhs-grey" size={28} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Drug Name */}
          <div className="mb-6">
            <label
              htmlFor="name"
              className="block text-nhs-body font-bold text-nhs-black mb-2"
            >
              Drug Name <span className="text-nhs-red">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-3 text-nhs-body border-2 border-nhs-grey rounded-md focus:border-nhs-blue focus:ring-2 focus:ring-nhs-yellow outline-none"
              required
              disabled={isSaving}
            />
          </div>

          {/* Drug Type */}
          <div className="mb-6">
            <label
              htmlFor="drugType"
              className="block text-nhs-body font-bold text-nhs-black mb-2"
            >
              Drug Type
            </label>
            <select
              id="drugType"
              value={formData.drugType}
              onChange={(e) =>
                setFormData({ ...formData, drugType: e.target.value })
              }
              className="w-full px-4 py-3 text-nhs-body border-2 border-nhs-grey rounded-md focus:border-nhs-blue focus:ring-2 focus:ring-nhs-yellow outline-none bg-white"
              disabled={isSaving}
            >
              <option value="">Select type...</option>
              {drugTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div className="mb-6">
            <label
              htmlFor="location"
              className="block text-nhs-body font-bold text-nhs-black mb-2"
            >
              Location
            </label>
            <input
              id="location"
              type="text"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              className="w-full px-4 py-3 text-nhs-body border-2 border-nhs-grey rounded-md focus:border-nhs-blue focus:ring-2 focus:ring-nhs-yellow outline-none"
              disabled={isSaving}
            />
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label
              htmlFor="notes"
              className="block text-nhs-body font-bold text-nhs-black mb-2"
            >
              Notes
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={4}
              className="w-full px-4 py-3 text-nhs-body border-2 border-nhs-grey rounded-md focus:border-nhs-blue focus:ring-2 focus:ring-nhs-yellow outline-none"
              disabled={isSaving}
            />
          </div>

          {/* Stock Toggle */}
          <div className="mb-8">
            <p className="block text-nhs-body font-bold text-nhs-black mb-3">
              Stock Status
            </p>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, outOfStock: false })}
                className={`flex-1 px-6 py-3 rounded-md text-nhs-body font-semibold min-h-touch transition-colors ${
                  !formData.outOfStock
                    ? 'bg-nhs-green text-white'
                    : 'bg-gray-200 text-nhs-black border border-nhs-border'
                }`}
                disabled={isSaving}
              >
                In Stock
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, outOfStock: true })}
                className={`flex-1 px-6 py-3 rounded-md text-nhs-body font-semibold min-h-touch transition-colors ${
                  formData.outOfStock
                    ? 'bg-nhs-red text-white'
                    : 'bg-gray-200 text-nhs-black border border-nhs-border'
                }`}
                disabled={isSaving}
              >
                Out of Stock
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            {/* Save Button */}
            <button
              type="submit"
              disabled={isSaving || !formData.name.trim()}
              className="w-full bg-nhs-blue hover:bg-nhs-blue/90 disabled:bg-nhs-blue/50 text-white px-8 py-4 rounded-md text-nhs-body font-bold min-h-touch transition-colors flex items-center justify-center gap-2"
            >
              {isSaving && <Loader2 size={20} className="animate-spin" />}
              {isSaving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Drug'}
            </button>

            {/* Delete Button (edit mode only) */}
            {isEdit && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSaving}
                className="w-full bg-white hover:bg-red-50 border-2 border-nhs-red text-nhs-red px-8 py-4 rounded-md text-nhs-body font-bold min-h-touch transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 size={20} />
                Delete Drug
              </button>
            )}
          </div>
        </form>
      </div>
    </>
  );
}
