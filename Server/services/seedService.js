const User = require('../models/User');
const Hotel = require('../models/Hotel');
const Room = require('../models/Room');

/**
 * Automatically provisions Demo Administrator, Demo Guest accounts,
 * and initial Hotel & Room inventory when the database is connected.
 */
const seedDemoAccounts = async () => {
  try {
    // 1. Seed Demo Admin
    const adminExists = await User.findOne({ email: 'admin@hotelpro.com' });
    if (!adminExists) {
      const adminHash = await User.hashPassword('AdminPassword2026!');
      await User.create({
        name: 'Administrator',
        email: 'admin@hotelpro.com',
        phone: '+919800000000',
        password: adminHash,
        passwordHash: adminHash,
        role: 'admin',
        userType: 'admin',
        isActive: true,
        isEmailVerified: true
      });
      console.log('[Seed] Demo Administrator account created: admin@hotelpro.com / AdminPassword2026!');
    }

    // 2. Seed Demo Guest
    const guestExists = await User.findOne({ email: 'priya.sharma@example.com' });
    if (!guestExists) {
      const guestHash = await User.hashPassword('LuxuryHotelPassword2026!');
      await User.create({
        name: 'Priya Sharma',
        email: 'priya.sharma@example.com',
        phone: '+919876543210',
        password: guestHash,
        passwordHash: guestHash,
        role: 'guest',
        userType: 'customer',
        isActive: true,
        isEmailVerified: true
      });
      console.log('[Seed] Demo Guest account created: priya.sharma@example.com / LuxuryHotelPassword2026!');
    }

    // 3. Seed Demo Hotel
    let hotel = await Hotel.findOne();
    if (!hotel) {
      hotel = await Hotel.create({
        name: 'The Grand Palace Hotel',
        slug: 'the-grand-palace-hotel',
        description: 'A 5-star premier heritage hotel offering luxury suites and world-class hospitality.',
        address: '100 Marine Drive',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        contact: { phone: '+91 22 1234 5678', email: 'concierge@grandpalace.com' },
        amenities: ['Swimming Pool', 'Spa & Wellness', 'Fine Dining Restaurant', 'High-Speed Wi-Fi', 'Valet Parking', '24/7 Room Service']
      });
      console.log('[Seed] Demo Hotel created: The Grand Palace Hotel');
    }

    // 4. Seed Demo Rooms
    const roomCount = await Room.countDocuments();
    if (roomCount === 0 && hotel) {
      await Room.create([
        {
          hotel: hotel._id,
          roomNumber: '101',
          roomType: 'deluxe',
          type: 'deluxe',
          title: 'Executive Deluxe Suite',
          description: 'Sophisticated king room with sweeping skyline views, plush bedding, and marble bath.',
          pricePerNight: 8500,
          rent: 8500,
          capacity: 2,
          totalInventory: 5,
          count: 5,
          amenities: ['Free High-Speed Wi-Fi', 'King Bed', 'City View', 'Air Conditioning', 'Ensuite Marble Bathroom', 'Smart TV'],
          images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'],
          operationalStatus: 'available',
          isActive: true
        },
        {
          hotel: hotel._id,
          roomNumber: '202',
          roomType: 'suite',
          type: 'suite',
          title: 'Presidential Royal Suite',
          description: 'Expansive private suite with separate living area, panoramic balcony, and 24/7 dedicated butler service.',
          pricePerNight: 16000,
          rent: 16000,
          capacity: 4,
          totalInventory: 3,
          count: 3,
          amenities: ['Complimentary Champagne', 'Jacuzzi', 'Dedicated Butler', 'Ocean View', 'Balcony', 'Breakfast Included'],
          images: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80'],
          operationalStatus: 'available',
          isActive: true
        },
        {
          hotel: hotel._id,
          roomNumber: '305',
          roomType: 'single',
          type: 'single',
          title: 'Business Single Room',
          description: 'Compact, ultra-quiet room optimized for business travelers, featuring ergonomic workstation and espresso bar.',
          pricePerNight: 4500,
          rent: 4500,
          capacity: 1,
          totalInventory: 8,
          count: 8,
          amenities: ['Ergonomic Desk', 'High-Speed Wi-Fi', 'Espresso Machine', 'Air Conditioning', 'Soundproof Windows'],
          images: ['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80'],
          operationalStatus: 'available',
          isActive: true
        }
      ]);
      console.log('[Seed] Demo Rooms provisioned.');
    }
  } catch (err) {
    console.warn(`[Seed] Demo account auto-seeding skipped: ${err.message}`);
  }
};

module.exports = { seedDemoAccounts };
