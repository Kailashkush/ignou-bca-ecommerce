/**
 * Identity Verification Module — registration, login and profile endpoints.
 */
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { signToken } = require('../utils/token');

/** Shapes the public view of a user document sent back to the client. */
const toPublicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  address: user.address,
  createdAt: user.createdAt,
});

/**
 * POST /api/auth/register
 * Creates a customer account and returns an access token.
 *
 * The `role` field is deliberately NOT read from the request body: accepting it
 * would let anyone register themselves as an administrator. Administrators are
 * created only by the seed script or promoted by an existing administrator.
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email: String(email).toLowerCase() }).lean();
  if (existing) {
    // Checked explicitly so the client gets a clear message; the unique index
    // remains the real guarantee against a concurrent duplicate registration.
    throw ApiError.conflict('An account with this email address already exists.');
  }

  const user = await User.create({ name, email, password, role: 'customer' });

  res.status(201).json({
    success: true,
    message: 'Your account has been created.',
    data: { user: toPublicUser(user), token: signToken(user) },
  });
});

/**
 * POST /api/auth/login
 * Verifies credentials and issues an access token.
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // `+password` overrides the schema's `select: false`.
  const user = await User.findOne({ email: String(email).toLowerCase() }).select('+password');

  // One generic message for both "no such account" and "wrong password".
  // Distinguishing them would let an attacker enumerate registered addresses.
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Incorrect email address or password.');
  }
  if (!user.isActive) {
    throw ApiError.forbidden('This account has been deactivated. Contact the store administrator.');
  }

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  res.json({
    success: true,
    message: 'Signed in successfully.',
    data: { user: toPublicUser(user), token: signToken(user) },
  });
});

/** GET /api/auth/me — returns the signed-in user, used to restore a session. */
const getProfile = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: toPublicUser(req.user) } });
});

/** PATCH /api/auth/me — updates the caller's own name and default address. */
const updateProfile = asyncHandler(async (req, res) => {
  const { name, address } = req.body;
  const user = req.user;

  if (name !== undefined) user.name = name;
  if (address !== undefined) user.address = address;

  await user.save();
  res.json({
    success: true,
    message: 'Your profile has been updated.',
    data: { user: toPublicUser(user) },
  });
});

/** PATCH /api/auth/me/password — changes the caller's password. */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword))) {
    throw ApiError.unauthorized('Your current password is incorrect.');
  }
  if (currentPassword === newPassword) {
    throw ApiError.badRequest('The new password must be different from the current one.');
  }

  user.password = newPassword; // the pre-save hook re-hashes it
  await user.save();

  // A fresh token is returned so the client is not left holding one that was
  // issued before the credential change.
  res.json({
    success: true,
    message: 'Your password has been changed.',
    data: { token: signToken(user) },
  });
});

module.exports = { register, login, getProfile, updateProfile, changePassword, toPublicUser };
