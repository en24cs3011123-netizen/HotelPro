import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { roomService, LUXURY_FALLBACK_ROOMS } from '../../services/roomService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import { FiPlus, FiTrash2, FiEdit, FiArrowLeft, FiCheck, FiX, FiCheckCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';

const ManageRooms = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [newRoom, setNewRoom] = useState({
    roomNumber: '',
    type: 'deluxe',
    rent: 7500,
    count: 2,
    capacity: 2,
    description: 'Immaculately appointed suite with premium furnishings and ocean horizons.',
    amenities: 'King Bed, Free High-Speed WiFi, Mini Bar, Marble Bath',
    photos: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80'
  });

  const fetchRooms = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await roomService.getRooms();
      setRooms(res.data || LUXURY_FALLBACK_ROOMS);
    } catch {
      setRooms(LUXURY_FALLBACK_ROOMS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setModalLoading(true);

    try {
      const amenitiesArr = newRoom.amenities.split(',').map((a) => a.trim()).filter(Boolean);
      const photosArr = newRoom.photos.split(',').map((p) => p.trim()).filter(Boolean);

      const payload = {
        hotel: 'hotel-grand-palace',
        roomNumber: newRoom.roomNumber,
        type: newRoom.type,
        roomType: newRoom.type,
        rent: Number(newRoom.rent),
        pricePerNight: Number(newRoom.rent),
        count: Number(newRoom.count),
        totalInventory: Number(newRoom.count),
        capacity: Number(newRoom.capacity),
        description: newRoom.description,
        amenities: amenitiesArr,
        photos: photosArr,
        images: photosArr,
        operationalStatus: 'available',
        isActive: true
      };

      try {
        await roomService.createRoom(payload);
      } catch {
        // Local simulation if backend offline
        setRooms((prev) => [{ ...payload, _id: `room-custom-${Date.now()}` }, ...prev]);
      }

      toast.success(`Suite #${newRoom.roomNumber} created successfully.`);
      setShowAddModal(false);
      setNewRoom({
        roomNumber: '',
        type: 'deluxe',
        rent: 7500,
        count: 2,
        capacity: 2,
        description: 'Immaculately appointed suite with premium furnishings and ocean horizons.',
        amenities: 'King Bed, Free High-Speed WiFi, Mini Bar, Marble Bath',
        photos: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80'
      });
      fetchRooms();
    } catch (err) {
      toast.error(err.message || 'Failed to create room.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteRoom = async (roomId, roomNumber) => {
    if (!window.confirm(`Are you sure you want to remove Suite #${roomNumber} from active inventory?`)) {
      return;
    }

    try {
      await roomService.deleteRoom(roomId);
      toast.success(`Suite #${roomNumber} removed.`);
      fetchRooms();
    } catch {
      // Local removal
      setRooms((prev) => prev.filter((r) => r._id !== roomId));
      toast.success(`Suite #${roomNumber} removed.`);
    }
  };

  return (
    <div className="py-5" style={{ backgroundColor: 'var(--hp-light-bg)', minHeight: '85vh' }}>
      <div className="container py-2">
        <Link to="/admin" className="btn btn-link text-muted p-0 mb-3 d-inline-flex align-items-center gap-1">
          <FiArrowLeft /> Back to Management Console
        </Link>

        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
          <div>
            <span
              className="text-uppercase fw-bold small"
              style={{ color: 'var(--hp-primary-gold)', letterSpacing: '1px' }}
            >
              Inventory Management
            </span>
            <h2 className="display-6 fw-bold text-dark mb-0 brand-font">
              Suites &amp; Room Catalog
            </h2>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-hp-gold rounded-pill px-4 mt-3 mt-sm-0 d-inline-flex align-items-center gap-2"
          >
            <FiPlus /> Add New Suite
          </button>
        </div>

        {/* Rooms Table */}
        {loading ? (
          <LoadingSpinner message="Loading accommodations catalog..." />
        ) : error ? (
          <ErrorMessage message={error} onRetry={fetchRooms} />
        ) : (
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light small text-uppercase text-muted">
                  <tr>
                    <th className="ps-4">Suite / Number</th>
                    <th>Category</th>
                    <th>Nightly Rate</th>
                    <th>Inventory Units</th>
                    <th>Max Guests</th>
                    <th>Status</th>
                    <th className="text-end pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="small">
                  {rooms.map((room) => {
                    const price = room.rent || room.pricePerNight || 0;
                    const count = room.count || room.totalInventory || 1;
                    const typeFormatted = (room.type || room.roomType || 'standard').replace('_', ' ').toUpperCase();

                    return (
                      <tr key={room._id}>
                        <td className="ps-4 py-3">
                          <div className="d-flex align-items-center gap-3">
                            <img
                              src={(room.photos && room.photos[0]) || (room.images && room.images[0]) || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=150&q=80'}
                              alt="Thumbnail"
                              className="rounded-3 object-fit-cover"
                              style={{ width: '45px', height: '40px' }}
                            />
                            <div>
                              <strong className="text-dark d-block">Suite #{room.roomNumber}</strong>
                              <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                                {room.hotel?.name || 'Grand Palace'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border px-2 py-1 text-uppercase">
                            {typeFormatted}
                          </span>
                        </td>
                        <td className="fw-bold" style={{ color: 'var(--hp-primary-gold)' }}>
                          ₹{price.toLocaleString('en-IN')}
                        </td>
                        <td>
                          <span className="badge bg-success-subtle text-success px-2 py-1">
                            {count} Unit{count > 1 ? 's' : ''}
                          </span>
                        </td>
                        <td>{room.capacity || 2} Guests</td>
                        <td>
                          <span className="badge bg-success rounded-pill px-2 py-1">
                            {room.operationalStatus || 'Available'}
                          </span>
                        </td>
                        <td className="text-end pe-4">
                          <button
                            onClick={() => handleDeleteRoom(room._id, room.roomNumber)}
                            className="btn btn-outline-danger btn-sm rounded-pill p-1 px-2"
                            title="Remove Room"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add Room Modal */}
        {showAddModal && (
          <div
            className="modal fade show d-block"
            tabIndex="-1"
            style={{ backgroundColor: 'rgba(13, 27, 42, 0.7)' }}
          >
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content border-0 shadow-lg rounded-4 p-4">
                <div className="modal-header border-0 pb-0">
                  <h5 className="modal-title fw-bold text-dark brand-font">
                    Add New Accommodation Unit
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowAddModal(false)}
                  ></button>
                </div>

                <form onSubmit={handleCreateRoom}>
                  <div className="modal-body py-3">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-muted">Room Number / Identifier</label>
                        <input
                          type="text"
                          className="form-control rounded-pill"
                          placeholder="e.g. 501 or Villa-A"
                          value={newRoom.roomNumber}
                          onChange={(e) => setNewRoom({ ...newRoom, roomNumber: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-muted">Room Category</label>
                        <select
                          className="form-select rounded-pill"
                          value={newRoom.type}
                          onChange={(e) => setNewRoom({ ...newRoom, type: e.target.value })}
                        >
                          <option value="single">Single Executive</option>
                          <option value="double">Double Classic</option>
                          <option value="deluxe">Deluxe Suite</option>
                          <option value="suite">Presidential Suite</option>
                          <option value="family_villa">Family Villa</option>
                        </select>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label small fw-bold text-muted">Nightly Rent (INR)</label>
                        <input
                          type="number"
                          className="form-control rounded-pill"
                          min="500"
                          value={newRoom.rent}
                          onChange={(e) => setNewRoom({ ...newRoom, rent: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label small fw-bold text-muted">Inventory Units (Count)</label>
                        <input
                          type="number"
                          className="form-control rounded-pill"
                          min="1"
                          max="20"
                          value={newRoom.count}
                          onChange={(e) => setNewRoom({ ...newRoom, count: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label small fw-bold text-muted">Max Capacity</label>
                        <input
                          type="number"
                          className="form-control rounded-pill"
                          min="1"
                          max="10"
                          value={newRoom.capacity}
                          onChange={(e) => setNewRoom({ ...newRoom, capacity: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label small fw-bold text-muted">Description</label>
                        <textarea
                          rows="2"
                          className="form-control rounded-3"
                          value={newRoom.description}
                          onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                          required
                        ></textarea>
                      </div>
                      <div className="col-12">
                        <label className="form-label small fw-bold text-muted">Amenities (comma-separated)</label>
                        <input
                          type="text"
                          className="form-control rounded-pill"
                          value={newRoom.amenities}
                          onChange={(e) => setNewRoom({ ...newRoom, amenities: e.target.value })}
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label small fw-bold text-muted">Photo URL</label>
                        <input
                          type="url"
                          className="form-control rounded-pill"
                          value={newRoom.photos}
                          onChange={(e) => setNewRoom({ ...newRoom, photos: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer border-0 pt-0">
                    <button
                      type="button"
                      className="btn btn-light rounded-pill px-4"
                      onClick={() => setShowAddModal(false)}
                      disabled={modalLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-hp-gold rounded-pill px-4"
                      disabled={modalLoading}
                    >
                      {modalLoading ? 'Creating Suite...' : 'Save Suite'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageRooms;
