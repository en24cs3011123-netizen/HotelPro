const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    provider: {
      type: String,
      default: 'razorpay'
    },
    providerOrderId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    providerPaymentId: {
      type: String,
      sparse: true,
      index: true
    },
    providerSignature: {
      type: String
    },
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'INR'
    },
    paymentStatus: {
      type: String,
      enum: ['created', 'authorized', 'captured', 'failed', 'refunded'],
      default: 'created',
      index: true
    },
    refundDetails: {
      refundId: { type: String },
      amount: { type: Number },
      status: { type: String },
      processedAt: { type: Date },
      reason: { type: String }
    },
    verifiedAt: {
      type: Date
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

const prohibitedFields = ['cardDetails', 'cardNumber', 'cvvcode', 'cvv', 'pin', 'expmonthyear', 'cardholdername'];

// Strict security safeguard: reject any attempts to persist raw card details
paymentSchema.pre('validate', function () {
  for (const field of prohibitedFields) {
    if (this.get(field) !== undefined || (this._doc && this._doc[field] !== undefined)) {
      throw new Error(`Security Violation: Storage of raw card authentication data (${field}) is strictly prohibited under PCI-DSS compliance.`);
    }
  }
});

const PaymentBase = mongoose.model('Payment', paymentSchema);

class Payment extends PaymentBase {
  constructor(doc, ...args) {
    if (doc && typeof doc === 'object') {
      for (const field of prohibitedFields) {
        if (doc[field] !== undefined) {
          throw new Error(`Security Violation: Storage of raw card authentication data (${field}) is strictly prohibited under PCI-DSS compliance.`);
        }
      }
    }
    super(doc, ...args);
  }
}

module.exports = Payment;
