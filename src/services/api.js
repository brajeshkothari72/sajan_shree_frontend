// services/api.js
const API_BASE_URL = `${(import.meta.env.VITE_API_URL || "https://backend.sajanshreegarments.in")}/api`;

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem("token");
    const isFormData = options && options.body instanceof FormData;
    const baseHeaders = isFormData
      ? { ...options.headers }
      : { "Content-Type": "application/json", ...options.headers };
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
    const config = { ...options, headers: { ...baseHeaders, ...authHeaders } };

    const response = await fetch(url, config);
    if (!response.ok) {
      let errorPayload;
      try {
        errorPayload = await response.json();
      } catch (_) {
        // ignore parse error
      }
      
      // Handle authentication errors specifically
      if (response.status === 401) {
        // Clear invalid token and redirect to login
        localStorage.removeItem("token");
        window.location.href = "/login";
        throw new Error("Authentication required. Please login again.");
      }
      
      const message = errorPayload?.message || response.statusText || "Unknown error";
      const error = new Error(`API Error: ${message}`);
      error.status = response.status;
      error.payload = errorPayload;
      throw error;
    }
    return response.json();
  }

  // Orders
  getOrders() {
    return this.request("/orders");
  }

  getOrder(id) {
    return this.request(`/orders/${id}`);
  }

  createOrder(data) {
    const isFormData = data instanceof FormData;
    return this.request("/orders", {
      method: "POST",
      body: isFormData ? data : JSON.stringify(data),
    });
  }

  updateOrder(id, data) {
    const isFormData = data instanceof FormData;
    return this.request(`/orders/${id}`, {
      method: "PUT",
      body: isFormData ? data : JSON.stringify(data),
    });
  }

  deleteOrder(id) {
    return this.request(`/orders/${id}`, {
      method: "DELETE",
    });
  }

  // Manually (re)send the WhatsApp order confirmation.
  // options: { force?: boolean, phone?: string, consent?: boolean }
  sendOrderWhatsApp(id, options = {}) {
    return this.request(`/orders/${id}/whatsapp`, {
      method: "POST",
      body: JSON.stringify(options),
    });
  }

  // Products
  getProducts() {
    return this.request("/products");
  }

  // Product configurations used by the order form (sizes + detail-field options)
  getProductConfigs() {
    return this.request("/products");
  }

  addProductOption(productName, detailKey, option) {
    return this.request(`/products/${encodeURIComponent(productName)}/options`, {
      method: "PATCH",
      body: JSON.stringify({ detailKey, option }),
    });
  }

  addProductSize(productName, size) {
    return this.request(`/products/${encodeURIComponent(productName)}/sizes`, {
      method: "PATCH",
      body: JSON.stringify({ size }),
    });
  }

  getProduct(id) {
    return this.request(`/products/${id}`);
  }

  createProduct(data) {
    return this.request("/products", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  updateProduct(id, data) {
    return this.request(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  deleteProduct(id) {
    return this.request(`/products/${id}`, {
      method: "DELETE",
    });
  }

  // Customers
  getCustomers(search) {
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    return this.request(`/customers${query}`);
  }

  getCustomer(id) {
    return this.request(`/customers/${id}`);
  }

  getCustomerOrders(id) {
    return this.request(`/customers/${id}/orders`);
  }

  createCustomer(data) {
    return this.request("/customers", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  updateCustomer(id, data) {
    return this.request(`/customers/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  deleteCustomer(id) {
    return this.request(`/customers/${id}`, {
      method: "DELETE",
    });
  }

  // User Authentication
  login(data) {
    return this.request("/users/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  register(data) {
    return this.request("/users/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Add more API methods as needed...
}

export default new ApiService();
