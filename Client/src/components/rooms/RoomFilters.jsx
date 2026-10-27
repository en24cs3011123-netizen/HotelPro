import React from 'react';
import { FiFilter, FiSliders } from 'react-icons/fi';

const ROOM_TYPES = [
  { value: 'all', label: 'All Room Types' },
  { value: 'single', label: 'Single Executive' },
  { value: 'double', label: 'Double Classic' },
  { value: 'deluxe', label: 'Deluxe Suite' },
  { value: 'suite', label: 'Presidential Suite' },
  { value: 'family_villa', label: 'Family Villa' }
];

const RoomFilters = ({
  selectedType,
  onTypeChange,
  maxPrice,
  onPriceChange,
  minCapacity,
  onCapacityChange,
  sortBy,
  onSortChange
}) => {
  return (
    <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4">
      <div className="d-flex align-items-center gap-2 mb-3 text-dark fw-bold">
        <FiSliders style={{ color: 'var(--hp-primary-gold)' }} />
        <span>Refine Accommodation Options</span>
      </div>

      <div className="row g-3">
        {/* Room Type Selector */}
        <div className="col-md-3">
          <label className="form-label small fw-semibold text-muted mb-1">Room Category</label>
          <select
            className="form-select rounded-pill form-select-sm"
            value={selectedType}
            onChange={(e) => onTypeChange(e.target.value)}
          >
            {ROOM_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Max Price Slider */}
        <div className="col-md-3">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <label className="form-label small fw-semibold text-muted mb-0">Max Nightly Rate</label>
            <span className="small fw-bold" style={{ color: 'var(--hp-primary-gold)' }}>
              ₹{Number(maxPrice).toLocaleString('en-IN')}
            </span>
          </div>
          <input
            type="range"
            className="form-range"
            min="3000"
            max="30000"
            step="1000"
            value={maxPrice}
            onChange={(e) => onPriceChange(Number(e.target.value))}
          />
        </div>

        {/* Min Capacity */}
        <div className="col-md-3">
          <label className="form-label small fw-semibold text-muted mb-1">Guests Needed</label>
          <select
            className="form-select rounded-pill form-select-sm"
            value={minCapacity}
            onChange={(e) => onCapacityChange(Number(e.target.value))}
          >
            <option value="1">1+ Guest</option>
            <option value="2">2+ Guests</option>
            <option value="3">3+ Guests</option>
            <option value="4">4+ Guests</option>
            <option value="6">6+ Guests (Villa)</option>
          </select>
        </div>

        {/* Sort By */}
        <div className="col-md-3">
          <label className="form-label small fw-semibold text-muted mb-1">Sort Results</label>
          <select
            className="form-select rounded-pill form-select-sm"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
          >
            <option value="recommended">Featured Luxury</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="capacity">Largest Capacity</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default RoomFilters;
