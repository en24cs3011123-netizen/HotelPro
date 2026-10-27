const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: [true, 'Hotel reference is required'],
      index: true
    },
    roomNumber: {
      type: String,
      required: [true, 'Room number/identifier is required'],
      trim: true
    },
    rent: {
      type: Number,
      min: [0, 'Rent cannot be negative']
    },
    pricePerNight: {
      type: Number,
      min: [0, 'Price per night cannot be negative']
    },
    count: {
      type: Number,
      min: [0, 'Count / inventory cannot be negative']
    },
    totalInventory: {
      type: Number,
      min: [0, 'Total inventory cannot be negative']
    },
    type: {
      type: String,
      enum: {
        values: ['single', 'double', 'deluxe', 'suite', 'family_villa', 'penthouse'],
        message: '{VALUE} is not a valid room type'
      },
      index: true
    },
    roomType: {
      type: String,
      enum: {
        values: ['single', 'double', 'deluxe', 'suite', 'family_villa', 'penthouse'],
        message: '{VALUE} is not a valid room type'
      },
      index: true
    },
    photos: {
      type: [String],
      default: []
    },
    images: {
      type: [String],
      default: []
    },
    description: {
      type: String,
      required: [true, 'Room description is required'],
      trim: true
    },
    capacity: {
      type: Number,
      required: [true, 'Room capacity is required'],
      min: [1, 'Capacity must be at least 1 guest'],
      max: [10, 'Capacity cannot exceed 10 guests'],
      default: 2
    },
    amenities: {
      type: [String],
      default: []
    },
    operationalStatus: {
      type: String,
      enum: ['available', 'maintenance', 'out_of_order'],
      default: 'available',
      index: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.rent = ret.rent !== undefined ? ret.rent : ret.pricePerNight;
        ret.pricePerNight = ret.pricePerNight !== undefined ? ret.pricePerNight : ret.rent;
        ret.count = ret.count !== undefined ? ret.count : ret.totalInventory;
        ret.totalInventory = ret.totalInventory !== undefined ? ret.totalInventory : ret.count;
        ret.type = ret.type || ret.roomType;
        ret.roomType = ret.roomType || ret.type;
        ret.photos = ret.photos && ret.photos.length ? ret.photos : ret.images;
        ret.images = ret.images && ret.images.length ? ret.images : ret.photos;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Pre-validate synchronization ensuring both legacy and modern field variants exist
roomSchema.pre('validate', function () {
  // Sync rent & pricePerNight
  if (this.rent !== undefined && this.pricePerNight === undefined) {
    this.pricePerNight = this.rent;
  } else if (this.pricePerNight !== undefined && this.rent === undefined) {
    this.rent = this.pricePerNight;
  }
  if (this.rent === undefined && this.pricePerNight === undefined) {
    this.invalidate('rent', 'Rent / price per night is required');
  }

  // Sync count & totalInventory
  if (this.count !== undefined && this.totalInventory === undefined) {
    this.totalInventory = this.count;
  } else if (this.totalInventory !== undefined && this.count === undefined) {
    this.count = this.totalInventory;
  } else if (this.count === undefined && this.totalInventory === undefined) {
    this.count = 1;
    this.totalInventory = 1;
  }

  // Sync type & roomType
  if (this.type && !this.roomType) {
    this.roomType = this.type;
  } else if (this.roomType && !this.type) {
    this.type = this.roomType;
  }
  if (!this.type && !this.roomType) {
    this.invalidate('type', 'Room type is required');
  }

  // Sync photos & images
  if (this.photos && this.photos.length && (!this.images || !this.images.length)) {
    this.images = [...this.photos];
  } else if (this.images && this.images.length && (!this.photos || !this.photos.length)) {
    this.photos = [...this.images];
  }
});

// Virtual populate for current bookings (safely decoupled from Room document)
roomSchema.virtual('currentBookings', {
  ref: 'Booking',
  localField: '_id',
  foreignField: 'room'
});

// Compatibility virtual getter/setter for legacy currentbooking
roomSchema.virtual('currentbooking').get(function () {
  return this._currentbooking || [];
}).set(function (val) {
  this._currentbooking = val;
});

// Compound index ensuring unique room number within a specific hotel
roomSchema.index({ hotel: 1, roomNumber: 1 }, { unique: true });

// Performance indexes for search by hotel, type, and price
roomSchema.index({ hotel: 1, type: 1, isActive: 1 });
roomSchema.index({ hotel: 1, roomType: 1, isActive: 1 });
roomSchema.index({ rent: 1 });
roomSchema.index({ pricePerNight: 1 });

const Room = mongoose.model('Room', roomSchema);
module.exports = Room;
