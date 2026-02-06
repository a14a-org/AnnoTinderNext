export type ApiResponse<T> =
  | { ok: true; data: T; status: number; error: undefined; errorData: undefined }
  | { ok: false; data: undefined; status: number; error: string; errorData: Record<string, unknown> | undefined };

interface FetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

export const apiFetch = async <T>(
  url: string,
  options: FetchOptions = {}
): Promise<ApiResponse<T>> => {
  try {
    const { body, ...restOptions } = options;

    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      ...restOptions,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return {
        ok: false,
        data: undefined,
        status: res.status,
        error: errorData.error || errorData.reason || `Request failed with status ${res.status}`,
        errorData,
      };
    }

    const data = await res.json();
    return { ok: true, data, status: res.status, error: undefined, errorData: undefined };
  } catch (err) {
    console.error("API Error:", err);
    return {
      ok: false,
      data: undefined,
      status: 0,
      error: err instanceof Error ? err.message : "Network error",
      errorData: undefined,
    };
  }
};

export const apiGet = <T>(url: string) => apiFetch<T>(url, { method: "GET" });

export const apiPost = <T>(url: string, body: unknown) =>
  apiFetch<T>(url, { method: "POST", body });

export const apiPut = <T>(url: string, body: unknown) =>
  apiFetch<T>(url, { method: "PUT", body });

export const apiDelete = <T>(url: string) =>
  apiFetch<T>(url, { method: "DELETE" });
