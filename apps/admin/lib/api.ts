const API_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://api.tatildesen.com";

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
  upload: {
    async single(
      file: File,
      usage:
        | "place_image"
        | "business_document"
        | "blog_hero"
        | "blog_featured"
        | "blog_content"
        | "other" = "other",
    ): Promise<{ url: string; fileId: string }> {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("usage", usage);
      const response = await fetch(`${API_URL}/api/admin/upload`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ error: "Upload failed" }));
        throw new Error(error.error || "Upload failed");
      }
      return response.json();
    },
    async multiple(
      files: File[],
      usage:
        | "place_image"
        | "business_document"
        | "blog_hero"
        | "blog_featured"
        | "blog_content"
        | "other" = "other",
    ): Promise<{ urls: string[]; fileIds: string[]; errors?: string[] }> {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      formData.append("usage", usage);
      const response = await fetch(`${API_URL}/api/admin/upload/multiple`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ error: "Upload failed" }));
        throw new Error(error.error || "Upload failed");
      }
      return response.json();
    },
  },
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
