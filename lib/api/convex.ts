import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

// Helper function to get authenticated session
export const getAuthenticatedSession = async () => {
  const supabase = createClient();

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    console.error('Session error:', sessionError);
    toast.error('Error getting session. Please try again.');
    return null;
  }

  if (!session?.access_token) {
    toast.error('No active session. Please log in again.');
    return null;
  }

  return session;
};

// Helper function to make authenticated HTTP requests
export const makeAuthenticatedRequest = async (
  endpoint: string,
  method: 'GET' | 'POST',
  data?: unknown,
  customHeaders?: Record<string, string>,
) => {
  const session = await getAuthenticatedSession();
  if (!session) return null;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${session.access_token}`,
    ...customHeaders,
  };

  const requestOptions: RequestInit = {
    method,
    headers,
  };

  // Handle different types of data
  if (data) {
    if (data instanceof File || data instanceof Blob) {
      // For file uploads, only delete Content-Type if no custom one is provided
      // This allows for direct file uploads with specific content types
      if (!customHeaders?.['Content-Type']) {
        delete headers['Content-Type'];
      }
      requestOptions.body = data;
    } else {
      // For JSON data
      if (!customHeaders?.['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }
      requestOptions.body = JSON.stringify(data);
    }
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_CONVEX_HTTP_ACTIONS_URL}${endpoint}`,
    requestOptions,
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `Failed to ${method.toLowerCase()} request`,
    );
  }

  return response.json();
};
