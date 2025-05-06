const CustomError = require("../../utils/cerror");

const authorizeRoles = (roles) => {
  return (req, res, next) => {
    try {
      // Check if user exists in request (set by JwtMiddleware)
      if (!req.user) {
        throw new CustomError(401, "Authentication required");
      }

      // If no specific roles required, just need to be authenticated
      if (!roles) {
        if (req.user.role === "non-user") {
          throw new CustomError(401, "Authentication required");
        }
        return next();
      }

      console.log(roles);

      // Convert string to array for consistent handling
      const requiredRoles = Array.isArray(roles) ? roles : [roles];

      // Check if user has any of the required roles
      if (!requiredRoles.includes(req.user.role)) {
        throw new CustomError(
          403,
          "You do not have permission to access this resource"
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = authorizeRoles;
