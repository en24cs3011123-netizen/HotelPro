import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import RoomCard from '../components/rooms/RoomCard';
import RoomFilters from '../components/rooms/RoomFilters';
import AvailabilitySearch from '../components/rooms/AvailabilitySearch';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import { roomService, LUXURY_FALLBACK_ROOMS } from '../services/roomService';
import { FiGrid } from 'react-icons/fi';

const Rooms = () => {
  const [searchParams] = useSearchParams();

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [selectedType, setSelectedType] = useState(searchParams.get('roomType') || 'all');
  const [maxPrice, setMaxPrice] = useState(30000);
  const [minCapacity, setMinCapacity] = useState(Number(searchParams.get('guests')) || 1);
  const [sortBy, setSortBy] = useState('recommended');

  const fetchRooms = async () => {
    setLoading(true);
    setError(null);
    try {
      const checkIn = searchParams.get('checkIn');
      const checkOut = searchParams.get('checkOut');

      let response;
      if (checkIn && checkOut) {
        response = await roomService.checkAvailability({
          checkIn,
          checkOut,
          guests: minCapacity,
          roomType: selectedType !== 'all' ? selectedType : undefined
        });
      } else {
        response = await roomService.getRooms();
      }

      setRooms(response.data || LUXURY_FALLBACK_ROOMS);
    } catch (err) {
      // Fallback
      setRooms(LUXURY_FALLBACK_ROOMS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [searchParams]);

  // Client-side filtering & sorting
  const filteredRooms = useMemo(() => {
    return rooms
      .filter((room) => {
        const typeMatch =
          selectedType === 'all' ||
          room.type === selectedType ||
          room.roomType === selectedType;

        const price = room.rent || room.pricePerNight || 0;
        const priceMatch = price <= maxPrice;

        const capacityMatch = (room.capacity || 2) >= minCapacity;

        return typeMatch && priceMatch && capacityMatch;
      })
      .sort((a, b) => {
        const priceA = a.rent || a.pricePerNight || 0;
        const priceB = b.rent || b.pricePerNight || 0;

        if (sortBy === 'price_asc') return priceA - priceB;
        if (sortBy === 'price_desc') return priceB - priceA;
        if (sortBy === 'capacity') return (b.capacity || 2) - (a.capacity || 2);
        return 0; // recommended
      });
  }, [rooms, selectedType, maxPrice, minCapacity, sortBy]);

  return (
    <div className="py-5" style={{ backgroundColor: 'var(--hp-light-bg)', minHeight: '85vh' }}>
      <div className="container py-2">
        {/* Page Header */}
        <div className="mb-4 text-center text-md-start">
          <span
            className="text-uppercase fw-bold small"
            style={{ color: 'var(--hp-primary-gold)', letterSpacing: '1px' }}
          >
            Luxury Accommodations
          </span>
          <h2 className="display-6 fw-bold text-dark mb-1 brand-font">
            Suites, Villas &amp; Executive Rooms
          </h2>
          <p className="text-muted small">
            Discover curated retreats crafted for supreme relaxation and bespoke luxury hospitality.
          </p>
        </div>

        {/* Quick Date Availability Search */}
        <div className="mb-4">
          <AvailabilitySearch
            initialParams={{
              checkIn: searchParams.get('checkIn'),
              checkOut: searchParams.get('checkOut'),
              guests: searchParams.get('guests'),
              roomType: searchParams.get('roomType')
            }}
          />
        </div>

        {/* Filter Controls */}
        <RoomFilters
          selectedType={selectedType}
          onTypeChange={setSelectedType}
          maxPrice={maxPrice}
          onPriceChange={setMaxPrice}
          minCapacity={minCapacity}
          onCapacityChange={setMinCapacity}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />

        {/* Results Counter */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <span className="small text-muted fw-semibold">
            Showing <span className="text-dark fw-bold">{filteredRooms.length}</span> luxury accommodation{filteredRooms.length === 1 ? '' : 's'}
          </span>
        </div>

        {/* Content State Handling */}
        {loading ? (
          <LoadingSpinner message="Querying luxury suite availability..." />
        ) : error ? (
          <ErrorMessage message={error} onRetry={fetchRooms} />
        ) : filteredRooms.length === 0 ? (
          <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white my-4">
            <FiGrid size={40} className="text-muted mx-auto mb-3" />
            <h5 className="fw-bold text-dark mb-1">No Accommodations Found</h5>
            <p className="text-muted small mb-3">
              We couldn't find suites matching your active filters. Try broadening your price range or changing category.
            </p>
            <div>
              <button
                onClick={() => {
                  setSelectedType('all');
                  setMaxPrice(30000);
                  setMinCapacity(1);
                  setSortBy('recommended');
                }}
                className="btn btn-hp-gold btn-sm rounded-pill px-4"
              >
                Reset All Filters
              </button>
            </div>
          </div>
        ) : (
          <div className="row g-4">
            {filteredRooms.map((room) => (
              <div key={room._id} className="col-lg-4 col-md-6">
                <RoomCard room={room} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Rooms;
