const jwt = require('jsonwebtoken');
const Admin = require('../Models/Admin.js');

// Verify JWT token
const authenticateAdmin = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No authentication token, access denied' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find admin
    const admin = await Admin.findById(decoded.id).select('-password');

    if (!admin) {
      return res.status(401).json({ 
        success: false, 
        message: 'Admin not found' 
      });
    }

    if (!admin.active) {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin account is deactivated' 
      });
    }

    // Attach admin to request
    req.admin = admin;
    next();

  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ 
      success: false, 
      message: 'Invalid token, authorization denied' 
    });
  }
};

// Check if admin is super admin
const isSuperAdmin = (req, res, next) => {
  if (req.admin.role !== 'super-admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Super admin only.' 
    });
  }
  next();
};

module.exports = {
  authenticateAdmin,
  isSuperAdmin
};