(() => {
  "use strict";

  const configuredBaseUrl = String(window.LUMINA_API_URL || "").replace(/\/$/, "");
  const localApiOrigin = `${window.location.protocol}//${window.location.hostname || "localhost"}:3000`;
  const apiBaseUrl =
    configuredBaseUrl ||
    (window.location.port === "3000" ? "/api" : `${localApiOrigin}/api`);
  const tokenKey = "luminaAccessToken";

  class ApiError extends Error {
    constructor(message, { status = 0, code = "NETWORK_ERROR", fields } = {}) {
      super(message);
      this.name = "ApiError";
      this.status = status;
      this.code = code;
      this.fields = fields;
    }
  }

  const getToken = () => window.localStorage.getItem(tokenKey);
  const setToken = (token) => window.localStorage.setItem(tokenKey, token);
  const clearToken = () => window.localStorage.removeItem(tokenKey);

  async function request(path, { method = "GET", body, auth = false } = {}) {
    const headers = { Accept: "application/json" };
    const token = getToken();

    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (auth) {
      if (!token) {
        throw new ApiError("Faça login para continuar.", {
          status: 401,
          code: "AUTH_REQUIRED",
        });
      }
      headers.Authorization = `Bearer ${token}`;
    }

    let response;
    try {
      response = await fetch(`${apiBaseUrl}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch {
      throw new ApiError(
        "Não foi possível conectar à API. Confirme se o backend está em execução.",
      );
    }

    const payload = response.status === 204 ? null : await response.json().catch(() => null);

    if (!response.ok) {
      const apiError = payload?.error;
      if (response.status === 401) clearToken();
      throw new ApiError(apiError?.message || "A solicitação não pôde ser concluída.", {
        status: response.status,
        code: apiError?.code || "API_ERROR",
        fields: apiError?.fields,
      });
    }

    return payload;
  }

  function queryString(params = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.set(key, value);
      }
    });
    const value = searchParams.toString();
    return value ? `?${value}` : "";
  }

  window.luminaApi = {
    baseUrl: apiBaseUrl,
    ApiError,
    auth: {
      isAuthenticated: () => Boolean(getToken()),
      getToken,
      logout: clearToken,
      async login(credentials) {
        const payload = await request("/auth/login", { method: "POST", body: credentials });
        setToken(payload.token);
        return payload.data;
      },
      async register(account) {
        const payload = await request("/auth/register", { method: "POST", body: account });
        setToken(payload.token);
        return payload.data;
      },
      async me() {
        return (await request("/auth/me", { auth: true })).data;
      },
      async update(profile) {
        return (await request("/auth/me", { method: "PUT", body: profile, auth: true })).data;
      },
    },
    categories: {
      async list() {
        return (await request("/categories")).data;
      },
      async create(name) {
        return (await request("/categories", { method: "POST", body: { name }, auth: true })).data;
      },
    },
    products: {
      async list(params) {
        return request(`/products${queryString(params)}`);
      },
      async bestSellers(limit = 4) {
        return request(`/products/best-sellers${queryString({ limit })}`);
      },
      async get(id) {
        return (await request(`/products/${encodeURIComponent(id)}`)).data;
      },
      async mine() {
        return (await request("/products/mine", { auth: true })).data;
      },
      async create(product) {
        return (await request("/products", { method: "POST", body: product, auth: true })).data;
      },
      async update(id, product) {
        return (
          await request(`/products/${encodeURIComponent(id)}`, {
            method: "PUT",
            body: product,
            auth: true,
          })
        ).data;
      },
      async remove(id) {
        return request(`/products/${encodeURIComponent(id)}`, {
          method: "DELETE",
          auth: true,
        });
      },
    },
  };
})();
