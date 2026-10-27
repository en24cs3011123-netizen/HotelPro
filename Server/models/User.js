const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/, 'Please provide a valid email']
    },
    password: {
      type: String,
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false
    },
    passwordHash: {
      type: String,
      select: false
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^[0-9+()-\s]{7,20}$/, 'Please provide a valid phone number']
    },
    userType: {
      type: String,
      enum: {
        values: ['customer', 'admin'],
        message: '{VALUE} is not a valid userType'
      },
      default: 'customer'
    },
    role: {
      type: String,
      enum: {
        values: ['guest', 'staff', 'admin', 'customer'],
        message: '{VALUE} is not a valid user role'
      },
      default: 'guest'
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    assignedHotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      default: null // Staff members are scoped to their assigned hotel property
    },
    resetPasswordToken: {
      type: String,
      select: false
    },
    resetPasswordExpires: {
      type: Date,
      select: false
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.password;
        delete ret.passwordHash;
        delete ret.confirmPassword;
        delete ret.c_password;
        delete ret.confirm_password;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpires;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Pre-validate hook ensuring password or passwordHash is provided and syncs them
userSchema.pre('validate', function () {
  if (!this.password && this.passwordHash) {
    this.password = this.passwordHash;
  } else if (!this.passwordHash && this.password) {
    this.passwordHash = this.password;
  }
  if (!this.password && !this.passwordHash) {
    this.invalidate('password', 'Password is required');
  }

  // Sync userType and role
  if (this.userType === 'admin' && this.role !== 'admin') {
    this.role = 'admin';
  } else if (this.role === 'admin' && this.userType !== 'admin') {
    this.userType = 'admin';
  } else if (this.role === 'guest' || this.role === 'customer') {
    this.userType = 'customer';
  }
});

// Pre-save hook: Hashes password if modified and not already bcrypt hashed
userSchema.pre('save', async function () {
  // If password or passwordHash is modified
  const pwd = this.password || this.passwordHash;
  if ((this.isModified('password') || this.isModified('passwordHash')) && pwd) {
    // Only hash if not already a valid bcrypt hash
    if (!pwd.startsWith('$2a$') && !pwd.startsWith('$2b$')) {
      const salt = await bcrypt.genSalt(12);
      const hashed = await bcrypt.hash(pwd, salt);
      this.password = hashed;
      this.passwordHash = hashed;
    } else {
      this.password = pwd;
      this.passwordHash = pwd;
    }
  }

  // Never store confirmPassword in the database
  if (this._doc) {
    delete this._doc.confirmPassword;
    delete this._doc.c_password;
    delete this._doc.confirm_password;
  }
});

// Password verification instance method
userSchema.methods.comparePassword = async function (candidatePassword) {
  const hash = this.password || this.passwordHash;
  if (!hash) return false;
  return bcrypt.compare(candidatePassword, hash);
};

// Static helper to hash passwords
userSchema.statics.hashPassword = async function (password) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
