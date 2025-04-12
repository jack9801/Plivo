import { verify, sign, JwtPayload } from 'jsonwebtoken';

// Interface for JWT payload
export interface UserJwtPayload extends JwtPayload {
  userId: string;
  email: string;
}

// Create a JWT token
export function createToken(payload: Omit<UserJwtPayload, 'iat' | 'exp'>) {
  return sign(
    payload,
    process.env.CLERK_SECRET_KEY || 'fallback-secret-key-change-me',
    { expiresIn: '7d' }
  );
}

// Verify a JWT token
export function verifyToken(token: string): UserJwtPayload | null {
  try {
    const decoded = verify(
      token, 
      process.env.CLERK_SECRET_KEY || 'fallback-secret-key-change-me'
    ) as UserJwtPayload;
    
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
  
  // If needed, you can fetch more user data from the database here
  return {
    id: payload.userId,
    email: payload.email
  };
} 