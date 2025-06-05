import { httpAction } from './_generated/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for user verification
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// CORS headers configuration
export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
  Vary: 'Origin',
};

// Helper function to create response with consistent headers
export const createResponse = (
  data: unknown,
  status: number,
  additionalHeaders: Record<string, string> = {},
) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
      ...additionalHeaders,
    },
  });
};

// Helper function to create error response
export const createErrorResponse = (
  error: string,
  status: number,
  additionalHeaders: Record<string, string> = {},
) => {
  return createResponse({ error }, status, additionalHeaders);
};

// Reusable pre-flight OPTIONS handler
export const createOptionsHandler = (
  allowedMethods: string[] = ['GET', 'POST', 'OPTIONS'],
) => {
  return httpAction(async (_, request) => {
    return new Response(null, {
      status: 204, // No content for OPTIONS
      headers: {
        ...CORS_HEADERS,
        'Access-Control-Allow-Methods': allowedMethods.join(', '),
      },
    });
  });
};

// Simple auth validation helper (returns token only)
export const validateAuth = (request: Request): string | null => {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.split(' ')[1];
};

// Comprehensive auth validation with Supabase user verification
export const validateAuthWithUser = async (request: Request) => {
  // Extract token from Authorization header
  const token = validateAuth(request);
  if (!token) {
    return {
      success: false,
      error: 'Unauthorized - Missing or invalid token',
      user: null,
      token: null,
    };
  }

  try {
    // Get user from Supabase using the token
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return {
        success: false,
        error: 'Invalid token or user not found',
        user: null,
        token,
      };
    }

    return {
      success: true,
      error: null,
      user,
      token,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Authentication service error',
      user: null,
      token,
    };
  }
};

// URL parameter extraction helper
export const getUrlParams = (
  request: Request,
  requiredParams: string[] = [],
) => {
  const url = new URL(request.url);
  const params: Record<string, string | null> = {};

  for (const param of requiredParams) {
    params[param] = url.searchParams.get(param);
  }

  // Get all other params
  for (const [key, value] of url.searchParams.entries()) {
    if (!requiredParams.includes(key)) {
      params[key] = value;
    }
  }

  return params;
};
