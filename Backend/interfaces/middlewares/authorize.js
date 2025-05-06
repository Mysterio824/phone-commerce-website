const CustomError = require("../../utils/cerror");
const ROLES = require("../../application/enums/roles");

const policies = {
  OwnResource: (req, resourceOwnerId) => {
    return req.user && req.user.uid === resourceOwnerId;
  },

  ResourceCreator: (req, resource) => {
    return req.user && resource && req.user.uid === resource.createdBy;
  },

  AdminOrOwner: (req, resourceOwnerId) => {
    return (
      req.user &&
      (req.user.role === ROLES.ADMIN || req.user.uid === resourceOwnerId)
    );
  },
};

const authorize = (options = {}) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new CustomError(401, "Authentication required");
      }      

      if (req.user.role === ROLES.NON_USER) {
        throw new CustomError(401, "Authentication required");
      }

      if (Object.keys(options).length === 0) {
        return next();
      }

      let authorized = true;

      if (options.roles) {
        const requiredRoles = Array.isArray(options.roles)
          ? options.roles
          : [options.roles];
        authorized = requiredRoles.includes(req.user.role);

        if (!authorized) {
          throw new CustomError(
            403,
            "You do not have the required role to access this resource"
          );
        }
      }

      if (options.policy) {
        if (!policies[options.policy]) {
          console.error(`Policy '${options.policy}' not found`);
          throw new CustomError(500, "Server configuration error");
        }

        // Get data for policy evaluation
        let policyData = null;
        if (typeof options.data === "function") {
          policyData = await Promise.resolve(options.data(req));
        } else {
          policyData = options.data;
        }

        // Apply the policy
        authorized = policies[options.policy](req, policyData);

        if (!authorized) {
          throw new CustomError(403, "Policy check failed");
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Export the middleware and policies for extensibility
module.exports = {
  authorize,
  policies,
  // Method to register custom policies
  registerPolicy: (name, policyFn) => {
    policies[name] = policyFn;
  },
};
