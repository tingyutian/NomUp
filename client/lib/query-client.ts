import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

/**
 * Gets the base URL for the Express API server (e.g., "http://localhost:3000")
 * @returns {string} The API base URL
 */
export function getApiUrl(): string {
  let host = process.env.EXPO_PUBLIC_DOMAIN;

  if (!host) {
    throw new Error("EXPO_PUBLIC_DOMAIN is not set");
  }

  let url = new URL(`https://${host}`);

  return url.href;
}

/** Returns the current Supabase access token, or undefined if not logged in. */
async function getAccessToken(): Promise<string | undefined> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

/**
 * Issue #16: Attempt a Supabase token refresh on 401 responses, then retry the
 * original request once.  If the refresh fails, sign the user out so the app
 * navigates back to the login screen cleanly (Supabase auth state change
 * listener handles the navigation).
 *
 * @returns The refreshed access token, or undefined if refresh failed.
 */
async function refreshAndGetToken(): Promise<string | undefined> {
  const { data, error } = await supabase.auth.refreshSession();
  if (error || !data.session) {
    // Refresh failed — sign out to force re-login.
    await supabase.auth.signOut();
    return undefined;
  }
  return data.session.access_token;
}

export async function apiRequest(
  method: string,
  route: string,
  data?: unknown | undefined,
): Promise<Response> {
  const baseUrl = getApiUrl();
  const url = new URL(route, baseUrl);
  const token = await getAccessToken();

  const headers: Record<string, string> = {};
  if (data) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  // Issue #16: Retry once after refreshing the session on 401.
  if (res.status === 401) {
    const newToken = await refreshAndGetToken();
    if (!newToken) {
      throw new Error("Session expired. Please sign in again.");
    }
    const retryHeaders: Record<string, string> = { ...headers };
    retryHeaders["Authorization"] = `Bearer ${newToken}`;
    const retryRes = await fetch(url, {
      method,
      headers: retryHeaders,
      body: data ? JSON.stringify(data) : undefined,
    });
    await throwIfResNotOk(retryRes);
    return retryRes;
  }

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const baseUrl = getApiUrl();
    const url = new URL(queryKey.join("/") as string, baseUrl);
    const token = await getAccessToken();

    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(url, { headers });

    // Issue #16: On 401, attempt token refresh and retry once before failing.
    if (res.status === 401) {
      if (unauthorizedBehavior === "returnNull") {
        return null;
      }
      const newToken = await refreshAndGetToken();
      if (!newToken) {
        throw new Error("Session expired. Please sign in again.");
      }
      const retryHeaders: Record<string, string> = {};
      retryHeaders["Authorization"] = `Bearer ${newToken}`;
      const retryRes = await fetch(url, { headers: retryHeaders });
      await throwIfResNotOk(retryRes);
      return await retryRes.json();
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
