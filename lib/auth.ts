import { verify, sign, JwtPayload } from 'jsonwebtoken';

// Interface for JWT payload
export interface UserJwtPayload extends JwtPayload {
  userId: string;
  email: string;
  organizationId?: string; // Make organization ID optional
}

// Get the appropriate secret key
function getSecretKey(): string {
  const key = process.env.CLERK_SECRET_KEY || process.env.JWT_SECRET || 'fallback-secret-key-change-me';
  
  if (key === 'fallback-secret-key-change-me') {
    console.warn('WARNING: Using fallback secret key. Set CLERK_SECRET_KEY or JWT_SECRET environment variable.');
  }
  
  return key;
}

// Create a JWT token
export function createToken(payload: Omit<UserJwtPayload, 'iat' | 'exp'>): string {
  const secretKey = getSecretKey();
  
  try {
    console.log(`Creating token for user: ${payload.userId}`);
    if (payload.organizationId) {
      console.log(`Including organization: ${payload.organizationId}`);
    }
    
    const token = sign(
      payload,
      secretKey,
      { expiresIn: '7d' }
    );
    
    // Verify that the token is valid right after creation (sanity check)
    try {
      const decoded = verify(token, secretKey) as UserJwtPayload;
      console.log(`Token created and verified successfully for user: ${payload.userId}`);
      return token;
    } catch (verifyError) {
      console.error('Token verification after creation failed:', verifyError);
      throw verifyError;
    }
  } catch (error) {
    console.error('Token creation failed:', error);
    throw error;
  }
}

// Verify a JWT token
export function verifyToken(token: string): UserJwtPayload | null {
  try {
    console.log('Verifying token...');
    const secretKey = getSecretKey();
    const decoded = verify(
      token, 
      secretKey
    ) as UserJwtPayload;
    
    console.log(`Token verified successfully for user: ${decoded.userId}`);
    return decoded;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

// Get current user from token
export async function getCurrentUser(token: string) {
  const payload = verifyToken(token);
  if (!payload) return null;
  
  // Include organization if available in the token
  return {
    id: payload.userId,
    email: payload.email,
    organizationId: payload.organizationId
  };
} 