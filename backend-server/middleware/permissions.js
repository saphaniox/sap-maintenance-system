// Role-based permission middleware
const permissions = {
  // Define permissions for each role
  roles: {
    visitor: [
      'read:dashboard', // Visitors can only view their dashboard
    ],
    administrator: ['all'], // Administrator can do everything
    manager: [
      'read:all',
      'create:machines',
      'update:machines',
      'delete:machines',
      'create:maintenance',
      'update:maintenance',
      'delete:maintenance',
      'approve:requisitions',
      'reject:requisitions',
      'create:inventory',
      'update:inventory',
      'delete:inventory',
      'create:sites',
      'update:sites',
      'delete:sites',
      'read:users',
    ],
    supervisor: [
      'read:all',
      'create:machines',
      'update:machines',
      'create:maintenance',
      'update:maintenance',
      'create:requisitions',
      'update:requisitions',
      'approve:requisitions',
      'create:inventory',
      'update:inventory',
    ],
    operator: [
      'read:all',
      'create:maintenance',
      'update:maintenance',
      'create:requisitions',
      'update:requisitions',
    ],
  },

  // Check if user has required permission
  hasPermission(userRole, requiredPermission) {
    if (!userRole) return false;
    
    const rolePermissions = this.roles[userRole] || [];
    
    // Admin has all permissions
    if (rolePermissions.includes('all')) return true;
    
    // Check specific permission
    return rolePermissions.includes(requiredPermission);
  },
};

// Middleware factory to check permissions
const checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userRole = req.user.role;

    if (!permissions.hasPermission(userRole, requiredPermission)) {
      return res.status(403).json({ 
        message: 'Insufficient permissions',
        required: requiredPermission,
        userRole: userRole,
      });
    }

    next();
  };
};

// Middleware to check if user is administrator
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (req.user.role !== 'administrator') {
    return res.status(403).json({ message: 'Administrator access required' });
  }

  next();
};

// Middleware to check if user is manager or administrator
const isManagerOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (!['administrator', 'manager'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Manager or Administrator access required' });
  }

  next();
};

module.exports = {
  permissions,
  checkPermission,
  isAdmin,
  isManagerOrAdmin,
};
