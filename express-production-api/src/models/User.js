const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12;

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    roles: { type: [String], default: ['user'] },
    // Bumped to invalidate every outstanding refresh token for this user at once.
    tokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

userSchema.statics.hashPassword = function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
};

userSchema.methods.verifyPassword = function verifyPassword(plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

// Mongoose documents already expose a string `id` virtual over `_id`, so
// this reuses it rather than reinventing an id field.
userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this.id,
    email: this.email,
    roles: this.roles,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
