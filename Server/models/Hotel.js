const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Hotel name is required'],
      trim: true,
      maxlength: [150, 'Hotel name cannot exceed 150 characters']
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Hotel description is required'],
      trim: true
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      index: true
    },
    state: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      default: 'India',
      trim: true
    },
    contact: {
      phone: { type: String, trim: true },
      email: { type: String, trim: true, lowercase: true }
    },
    amenities: {
      type: [String],
      default: []
    },
    images: {
      type: [String],
      default: []
    },
    policies: {
      checkInTime: { type: String, default: '14:00' },
      checkOutTime: { type: String, default: '11:00' },
      cancellationPolicy: {
        type: String,
        default: 'Free cancellation up to 48 hours before check-in'
      }
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
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Auto-generate slug before validation if missing
hotelSchema.pre('validate', function () {
  if (this.name && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
});

// Compound index for city queries and active status
hotelSchema.index({ city: 1, isActive: 1 });

const Hotel = mongoose.model('Hotel', hotelSchema);
module.exports = Hotel;
