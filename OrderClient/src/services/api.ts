const BASE_URL = 'https://localhost:7073/api';

// --- Type Definitions ---

export type OrderStatus = 'Pending' | 'InventoryChecking' | 'Confirmed' | 'Completed' | 'Rejected';

export interface Customer {
  id?: number;
  name: string;
  email: string;
  phone: string;
  createdDate?: string;
}

export interface OrderItem {
  id?: number;
  orderId?: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
}

export interface OrderEntity {
  id: number;
  userId: string;
  customerId?: number;
  orderDate: string;
  totalAmount: number;
  status: OrderStatus;
  orderItems: OrderItem[];
  customer?: Customer;
}

export interface CreateOrderItemDto {
  productId: number;
  quantity: number;
  unitPrice: number;
}

export interface CreateOrderDto {
  customerId: number;
  items: CreateOrderItemDto[];
}

export interface OrderItemResponseDto {
  id: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface OrderResponseDto {
  id: number;
  customerId: number;
  orderDate: string;
  totalAmount: number;
  status: OrderStatus;
  items: OrderItemResponseDto[];
}

export interface UserResponseDto {
  username: string;
  email: string;
  token: string;
}

export interface StockCheckResponse {
  productId: number;
  requestedQuantity: number;
  isAvailable: boolean;
  message: string;
}

// --- Helper for Headers ---

function getHeaders(contentType: string = 'application/json'): HeadersInit {
  const headers: Record<string, string> = {};
  
  if (contentType) {
    headers['Content-Type'] = contentType;
  }
  
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

// --- API Request Wrapper ---

async function request<T>(
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
  body?: any
): Promise<T> {
  const url = `${BASE_URL}/${path}`;
  const options: RequestInit = {
    method,
    headers: getHeaders(),
  };

  if (body !== undefined) {
    options.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    // Attempt to parse error message
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      if (typeof errorData === 'string') {
        errorMessage = errorData;
      } else if (errorData.errors) {
        // Validation errors (ModelState)
        errorMessage = Object.values(errorData.errors).flat().join('\n');
      } else if (errorData.message) {
        errorMessage = errorData.message;
      } else if (Array.isArray(errorData)) {
        // Identity errors array
        errorMessage = errorData.map(e => e.description || e.code).join('\n');
      }
    } catch {
      try {
        const text = await response.text();
        if (text) errorMessage = text;
      } catch {}
    }
    throw new Error(errorMessage);
  }

  // NoContent endpoints (204) or empty responses
  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

// --- API Endpoints ---

export const api = {
  // Account API
  account: {
    register: (dto: any) => request<UserResponseDto>('account/register', 'POST', dto),
    login: (dto: any) => request<UserResponseDto>('account/login', 'POST', dto),
  },

  // Customers API
  customers: {
    getAll: () => request<Customer[]>('customers'),
    getById: (id: number) => request<Customer>(`customers/${id}`),
    getOrders: (customerId: number) => request<OrderEntity[]>(`customers/${customerId}/orders`),
    create: (customer: Customer) => request<Customer>('customers', 'POST', customer),
  },

  // Orders API
  orders: {
    getAll: (status?: OrderStatus) => {
      const path = status ? `orders?status=${status}` : 'orders';
      return request<OrderResponseDto[]>(path);
    },
    getById: (id: number) => request<OrderResponseDto>(`orders/${id}`),
    create: (dto: CreateOrderDto) => request<OrderResponseDto>('orders', 'POST', dto),
    updateStatus: (id: number, status: OrderStatus) => {
      // Note: Endpoint expects HTTP PATCH and raw string in body representing the Enum value or string.
      // E.g. [FromBody] OrderStatus newStatus. So we stringify it.
      return request<void>(`orders/${id}/status`, 'PATCH', status);
    },
    removeItem: (orderId: number, itemId: number) => 
      request<void>(`orders/${orderId}/items/${itemId}`, 'DELETE'),
    delete: (id: number) => request<void>(`orders/${id}`, 'DELETE'),
  },

  // Inventory Integration API
  inventory: {
    checkStock: (productId: number, quantity: number) => 
      request<StockCheckResponse>(`inventoryintegration/check-stock/${productId}?quantity=${quantity}`),
  }
};
