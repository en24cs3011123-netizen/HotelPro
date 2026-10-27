const ApiError = require('../utils/ApiError');

/**
 * Restricts access to specified roles
 * @param  {...string} roles - e.g. 'admin', 'staff', 'guest'
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required.'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(403, `Forbidden: Role '${req.user.role}' lacks permission for this action.`)
      );
    }

    next();
  };
};

/**
 * Ensures user is admin, assigned staff, or the resource owner
 */
const requireOwnerOrStaffOrAdmin = (getOwnerId, getHotelId) => {
  return (req, res, next) => {
    const user = req.user;
    if (!user) {
      return next(new ApiError(401, 'Authentication required.'));
    }

    // Admins bypass property restrictions
    if (user.role === 'admin') {
      return next();
    }

    // Check Guest Ownership
    if (getOwnerId) {
      const ownerId = typeof getOwnerId === 'function' ? getOwnerId(req) : req[getOwnerId];
      if (ownerId && ownerId.toString() === user._id.toString()) {
        return next();
      }
    }

    // Check Staff Property Assignment
    if (user.role === 'staff' && getHotelId) {
      const targetHotelId = typeof getHotelId === 'function' ? getHotelId(req) : req[getHotelId];
      if (user.assignedHotel && targetHotelId && user.assignedHotel.toString() === targetHotelId.toString()) {
        return next();
      }
    }

    return next(new ApiError(403, 'Forbidden: You do not own or manage this resource.'));
  };
};

module.exports = {
  authorize,
  requireOwnerOrStaffOrAdmin
};
