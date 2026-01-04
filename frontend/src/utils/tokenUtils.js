// Utility functions for JWT token handling

/**
 * Decode JWT token without verification
 * Returns the payload as an object
 */
export const decodeJWT = (token) => {
  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    // Decode payload (second part)
    const payload = parts[1];
    
    // Base64URL decode
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

/**
 * Get customer ID from token
 */
export const getCustomerIdFromToken = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    return null;
  }

  const decoded = decodeJWT(token);
  if (!decoded) {
    return null;
  }

  // ThingsBoard JWT might have customerId in different fields
  // Common fields: customerId, sub, userId, etc.
  return decoded.customerId || decoded.customer_id || decoded.sub || null;
};

/**
 * Get user ID from token
 */
export const getUserIdFromToken = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    return null;
  }

  const decoded = decodeJWT(token);
  if (!decoded) {
    return null;
  }

  // ThingsBoard JWT might have userId in different fields
  return decoded.userId || decoded.user_id || decoded.sub || decoded.id || null;
};

/**
 * Get all token data
 */
export const getTokenData = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    return null;
  }

  return decodeJWT(token);
};

/**
 * Check if token is expired
 */
export const isTokenExpired = () => {
  const decoded = getTokenData();
  if (!decoded || !decoded.exp) {
    return true;
  }

  // exp is in seconds, Date.now() is in milliseconds
  return decoded.exp * 1000 < Date.now();
};







