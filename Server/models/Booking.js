const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    bookingReference: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    // References
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: [true, 'Room reference is required'],
      index: true
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room'
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: [true, 'Hotel reference is required'],
      index: true
    },
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel'
    },

    // Guest identity
    username: {
      type: String,
      required: [true, 'Username / guest name is required'],
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true
    },
    guestDetails: {
      fullName: { type: String },
      email: { type: String },
      phone: { type: String },
      specialRequests: { type: String }
    },

    // Date range
    checkIn: {
      type: Date,
      required: [true, 'Check-in date (fromDate) is required'],
      index: true
    },
    fromDate: {
      type: Date
    },
    checkOut: {
      type: Date,
      required: [true, 'Check-out date (toDate) is required'],
      index: true
    },
    toDate: {
      type: Date
    },

    // Stay capacity and rooms
    numberOfGuests: {
      type: Number,
      default: 1,
      min: 1
    },
    numberOfRooms: {
      type: Number,
      default: 1,
      min: [1, 'Number of rooms must be at least 1']
    },
    numberOfNights: {
      type: Number,
      required: [true, 'Number of nights (totalDays) is required'],
      min: [1, 'Total days must be at least 1']
    },
    totalDays: {
      type: Number,
      min: [1, 'Total days must be at least 1']
    },

    // Financial breakdown
    pricePerNight: {
      type: Number,
      default: 0
    },
    subtotal: {
      type: Number,
      default: 0
    },
    taxes: {
      type: Number,
      default: 0
    },
    fees: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative']
    },
    currency: {
      type: String,
      default: 'INR'
    },

    // Explicit statuses
    bookingStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'completed', 'expired'],
      default: 'pending',
      index: true
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'completed', 'expired'],
      default: 'pending'
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'],
      default: 'pending',
      index: true
    },

    // Cancellation and temporary hold
    cancellationDetails: {
      cancelledAt: { type: Date },
      reason: { type: String },
      cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      refundAmount: { type: Number, default: 0 }
    },
    holdExpiresAt: {
      type: Date,
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.roomId = ret.roomId || ret.room;
        ret.userId = ret.userId || ret.user;
        ret.hotelId = ret.hotelId || ret.hotel;
        ret.fromDate = ret.fromDate || ret.checkIn;
        ret.toDate = ret.toDate || ret.checkOut;
        ret.totalDays = ret.totalDays || ret.numberOfNights;
        ret.status = ret.status || ret.bookingStatus;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Pre-validate synchronization and integrity checks
bookingSchema.pre('validate', function () {
  // 1. Strict security check against raw card details
  const prohibitedFields = ['cardDetails', 'cardNumber', 'cvvcode', 'cvv', 'pin', 'expmonthyear', 'cardholdername'];
  for (const field of prohibitedFields) {
    if (this.get(field) !== undefined || (this._doc && this._doc[field] !== undefined)) {
      throw new Error(`Security Violation: Storing raw card data (${field}) in booking records is strictly prohibited.`);
    }
  }

  // 2. Reference synchronization
  if (this.roomId && !this.room) this.room = this.roomId;
  if (this.room && !this.roomId) this.roomId = this.room;
  if (this.userId && !this.user) this.user = this.userId;
  if (this.user && !this.userId) this.userId = this.user;
  if (this.hotelId && !this.hotel) this.hotel = this.hotelId;
  if (this.hotel && !this.hotelId) this.hotelId = this.hotel;

  // 3. Date synchronization
  if (this.fromDate && !this.checkIn) this.checkIn = this.fromDate;
  if (this.checkIn && !this.fromDate) this.fromDate = this.checkIn;
  if (this.toDate && !this.checkOut) this.checkOut = this.toDate;
  if (this.checkOut && !this.toDate) this.toDate = this.checkOut;

  // 4. Validate date chronological rule: fromDate/checkIn must precede toDate/checkOut
  if (this.checkIn && this.checkOut) {
    if (new Date(this.checkOut) <= new Date(this.checkIn)) {
      this.invalidate('checkOut', 'Check-out date (toDate) must be strictly after check-in date (fromDate)');
    }
  }

  // 5. Nights / Days calculation
  if (this.checkIn && this.checkOut) {
    const diffTime = Math.abs(new Date(this.checkOut) - new Date(this.checkIn));
    const calculatedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    if (!this.numberOfNights) this.numberOfNights = calculatedDays;
    if (!this.totalDays) this.totalDays = calculatedDays;
  }
  if (this.totalDays && !this.numberOfNights) this.numberOfNights = this.totalDays;
  if (this.numberOfNights && !this.totalDays) this.totalDays = this.numberOfNights;

  // 6. Guest details synchronization
  if (this.username && (!this.guestDetails || !this.guestDetails.fullName)) {
    if (!this.guestDetails) this.guestDetails = {};
    this.guestDetails.fullName = this.username;
  } else if (this.guestDetails && this.guestDetails.fullName && !this.username) {
    this.username = this.guestDetails.fullName;
  }

  if (this.phone && (!this.guestDetails || !this.guestDetails.phone)) {
    if (!this.guestDetails) this.guestDetails = {};
    this.guestDetails.phone = this.phone;
  } else if (this.guestDetails && this.guestDetails.phone && !this.phone) {
    this.phone = this.guestDetails.phone;
  }

  // 7. Status synchronization
  if (this.status && !this.bookingStatus) this.bookingStatus = this.status;
  if (this.bookingStatus && !this.status) this.status = this.bookingStatus;

  // 8. Auto-generate booking reference if missing
  if (!this.bookingReference) {
    this.bookingReference = `HP-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
  }
});

// Compound index for date collision & availability checks
bookingSchema.index({
  hotel: 1,
  room: 1,
  checkIn: 1,
  checkOut: 1,
  bookingStatus: 1
});

// Legacy and alternate query indexes
bookingSchema.index({
  hotelId: 1,
  roomId: 1,
  fromDate: 1,
  toDate: 1,
  status: 1
});

// Performance indexes for guest history and hotel dashboard queries
bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ userId: 1, createdAt: -1 });
bookingSchema.index({ bookingStatus: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ bookingReference: 1 }, { unique: true });

const BookingBase = mongoose.model('Booking', bookingSchema);

class Booking extends BookingBase {
  constructor(doc, ...args) {
    if (doc && typeof doc === 'object') {
      const prohibitedFields = ['cardDetails', 'cardNumber', 'cvvcode', 'cvv', 'pin', 'expmonthyear', 'cardholdername'];
      for (const field of prohibitedFields) {
        if (doc[field] !== undefined) {
          throw new Error(`Security Violation: Storing raw card data (${field}) in booking records is strictly prohibited.`);
        }
      }
    }
    super(doc, ...args);
  }
}

module.exports = Booking;
