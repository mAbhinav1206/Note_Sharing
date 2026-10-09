const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User - a student or an admin.
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true, // creates a unique index
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    // The plain password is never stored - only this bcrypt hash.
    // Controllers assign a plain password and the pre-save hook below hashes it.
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false, // never returned by queries unless explicitly selected
    },
    role: {
      type: String,
      enum: ['student', 'admin'],
      default: 'student',
    },
    status: {
      type: String,
      enum: ['active', 'blocked'],
      default: 'active',
    },
    // Simple profile fields used for filtering suggestions on the client.
    course: { type: String, trim: true, default: '' },
    semester: { type: Number, min: 1, max: 10, default: null },
    // Filename of the avatar inside uploads/avatars (served via API route).
    avatar: { type: String, default: '' },
  },
  { timestamps: true }
);

// Hash the password whenever it changes, right before saving.
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
  next();
});

// Instance helper: compare a plain password with the stored hash.
userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Never leak the hash when a user document is converted to JSON.
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
