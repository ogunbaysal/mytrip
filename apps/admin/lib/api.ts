const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include", // Important for passing auth cookies
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "An error occurred" }));
    throw new Error(
      error.message || `API request failed with status ${response.status}`,
    );
  }

  return response.json();
}

export const api = {
  approvals: {
    places: {
      async list(params?: { status?: string }) {
        const queryParams = new URLSearchParams();
        if (params?.status) queryParams.set("status", params.status);
        const query = queryParams.toString();
        return apiFetch<{ places: any[] }>(
          `/api/admin/approvals/places${query ? `?${query}` : ""}`,
        );
      },
      async approve(id: string, reason?: string) {
        return apiFetch<{ success: boolean; message: string }>(
          `/api/admin/approvals/places/${id}/approve`,
          {
            method: "POST",
            body: JSON.stringify({ reason }),
          },
        );
      },
      async reject(id: string, reason: string) {
        return apiFetch<{ success: boolean; message: string }>(
          `/api/admin/approvals/places/${id}/reject`,
          {
            method: "POST",
            body: JSON.stringify({ reason }),
          },
        );
      },
    },
    business: {
      async list(params?: { status?: string }) {
        const queryParams = new URLSearchParams();
        if (params?.status) queryParams.set("status", params.status);
        const query = queryParams.toString();
        return apiFetch<{ registrations: any[] }>(
          `/api/admin/approvals/business${query ? `?${query}` : ""}`,
        );
      },
      async approve(id: string, reason?: string) {
        return apiFetch<{ success: boolean; message: string }>(
          `/api/admin/approvals/business/${id}/approve`,
          {
            method: "POST",
            body: JSON.stringify({ reason }),
          },
        );
      },
      async reject(id: string, reason: string) {
        return apiFetch<{ success: boolean; message: string }>(
          `/api/admin/approvals/business/${id}/reject`,
          {
            method: "POST",
            body: JSON.stringify({ reason }),
          },
        );
      },
    },
  },
};
