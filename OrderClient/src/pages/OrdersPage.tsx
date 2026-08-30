import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { OrderResponseDto, Customer, OrderStatus, CreateOrderItemDto } from '../services/api';
import { Search, ShoppingBag, PlusCircle, X, Trash2, Edit, RefreshCw, Calendar, User, Package, Check, AlertCircle, ArrowLeft } from 'lucide-react';

interface OrdersPageProps {
  orders: OrderResponseDto[];
  customers: Customer[];
  onRefresh: () => Promise<void>;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  openCreateModalDirectly?: boolean;
  onModalClosed?: () => void;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({
  orders,
  customers,
  onRefresh,
  showToast,
  openCreateModalDirectly = false,
  onModalClosed
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Views
  const [selectedOrder, setSelectedOrder] = useState<OrderResponseDto | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);

  // Create Order Wizard State
  const [selectedCustomerId, setSelectedCustomerId] = useState<number>(0);
  const [orderItems, setOrderItems] = useState<{
    productId: number;
    quantity: number;
    unitPrice: number;
    stockChecked?: boolean;
    stockAvailable?: boolean;
    stockMessage?: string;
  }[]>([
    { productId: 101, quantity: 1, unitPrice: 15.0 }
  ]);

  // Open creation modal directly from homepage actions
  useEffect(() => {
    if (openCreateModalDirectly) {
      setIsCreateModalOpen(true);
      if (customers.length > 0 && customers[0].id) {
        setSelectedCustomerId(customers[0].id);
      }
    }
  }, [openCreateModalDirectly, customers]);

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    if (onModalClosed) onModalClosed();
  };

  // Helper: Get Customer Name by ID
  const getCustomerName = (id: number) => {
    const customer = customers.find(c => c.id === id);
    return customer ? customer.name : `Customer #${id}`;
  };

  // Helper: Status badge
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Pending': return 'badge pending';
      case 'InventoryChecking': return 'badge checking';
      case 'Confirmed': return 'badge confirmed';
      case 'Completed': return 'badge completed';
      case 'Rejected': return 'badge rejected';
      default: return 'badge';
    }
  };

  // Order Details Action: Update Status
  const handleUpdateStatus = async (status: OrderStatus) => {
    if (!selectedOrder) return;
    setLoadingAction(true);
    try {
      await api.orders.updateStatus(selectedOrder.id, status);
      showToast(`Order status updated to ${status}!`, 'success');
      
      // Update selected order view local state
      setSelectedOrder(prev => prev ? { ...prev, status } : null);
      
      await onRefresh();
    } catch (error: any) {
      showToast(error.message || 'Failed to update order status', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  // Order Details Action: Remove single item from order
  const handleRemoveItem = async (itemId: number) => {
    if (!selectedOrder) return;
    if (selectedOrder.items.length <= 1) {
      showToast('Cannot remove the last item. Delete the entire order instead.', 'error');
      return;
    }
    
    setLoadingAction(true);
    try {
      await api.orders.removeItem(selectedOrder.id, itemId);
      showToast('Item removed from order successfully!', 'success');
      
      // Fetch fresh order details to update layout
      const updatedOrder = await api.orders.getById(selectedOrder.id);
      setSelectedOrder(updatedOrder);
      
      await onRefresh();
    } catch (error: any) {
      showToast(error.message || 'Failed to remove item', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  // Order Details Action: Cancel / Delete entire order
  const handleDeleteOrder = async () => {
    if (!selectedOrder) return;
    if (!window.confirm('Are you sure you want to permanently delete this order?')) return;
    
    setLoadingAction(true);
    try {
      await api.orders.delete(selectedOrder.id);
      showToast('Order deleted successfully!', 'success');
      setSelectedOrder(null);
      await onRefresh();
    } catch (error: any) {
      showToast(error.message || 'Failed to delete order', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  // Wizard Action: Add item row
  const addOrderItemRow = () => {
    setOrderItems(prev => [...prev, { productId: 101 + prev.length, quantity: 1, unitPrice: 10.0 }]);
  };

  // Wizard Action: Remove item row
  const removeOrderItemRow = (index: number) => {
    if (orderItems.length <= 1) return;
    setOrderItems(prev => prev.filter((_, i) => i !== index));
  };

  // Wizard Action: Update item row fields
  const updateOrderItemRow = (index: number, key: string, value: any) => {
    setOrderItems(prev => prev.map((item, i) => {
      if (i === index) {
        return { 
          ...item, 
          [key]: value,
          // Reset stock check when input changes
          ...(key === 'productId' || key === 'quantity' ? { stockChecked: false } : {})
        };
      }
      return item;
    }));
  };

  // Wizard Action: Check stock via Inventory Integration
  const handleCheckStock = async (index: number) => {
    const item = orderItems[index];
    if (!item.productId || !item.quantity) return;

    try {
      const response = await api.inventory.checkStock(item.productId, item.quantity);
      setOrderItems(prev => prev.map((it, i) => {
        if (i === index) {
          return {
            ...it,
            stockChecked: true,
            stockAvailable: response.isAvailable,
            stockMessage: response.message
          };
        }
        return it;
      }));
      if (response.isAvailable) {
        showToast(`Stock available for Product ${item.productId}!`, 'success');
      } else {
        showToast(`Product ${item.productId} is out of stock!`, 'error');
      }
    } catch (error: any) {
      showToast('Failed to check stock status', 'error');
    }
  };

  // Wizard Action: Submit create order
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      showToast('Please select a customer', 'error');
      return;
    }

    setLoadingCreate(true);
    try {
      const dtoItems: CreateOrderItemDto[] = orderItems.map(item => ({
        productId: Number(item.productId),
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice)
      }));

      await api.orders.create({
        customerId: Number(selectedCustomerId),
        items: dtoItems
      });

      showToast('Order created successfully!', 'success');
      await onRefresh();
      // Reset form
      setOrderItems([{ productId: 101, quantity: 1, unitPrice: 15.0 }]);
      handleCloseCreateModal();
    } catch (error: any) {
      showToast(error.message || 'Failed to create order', 'error');
    } finally {
      setLoadingCreate(false);
    }
  };

  // Filter & Search Orders
  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === 'All' || order.status === filterStatus;
    const matchesSearch = 
      order.id.toString().includes(searchTerm) || 
      order.customerId.toString().includes(searchTerm) ||
      getCustomerName(order.customerId).toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Calculate Order wizard dynamic grand total
  const wizardGrandTotal = orderItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  // If viewing Order Details
  if (selectedOrder) {
    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div>
          <button 
            className="btn btn-secondary" 
            style={{ padding: '0.5rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}
            onClick={() => setSelectedOrder(null)}
          >
            <ArrowLeft size={16} /> Back to Control Center
          </button>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.75rem' }}>Order Details: #ORD-{selectedOrder.id}</h2>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                className="btn btn-danger" 
                onClick={handleDeleteOrder}
                disabled={loadingAction}
              >
                <Trash2 size={16} /> Delete Order
              </button>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="dashboard-row">
          {/* Main Info Card */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
              <span className="badge checking" style={{ textTransform: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={14} /> Created on {new Date(selectedOrder.orderDate).toLocaleString()}
              </span>
              <span className={getStatusBadgeClass(selectedOrder.status)}>
                {selectedOrder.status}
              </span>
            </div>

            {/* Customer Information */}
            <div>
              <h4 style={{ marginBottom: '0.75rem', color: 'var(--text-muted)' }}>Customer Details</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <div className="avatar" style={{ width: '40px', height: '40px', fontSize: '1rem' }}>
                  {getCustomerName(selectedOrder.customerId).charAt(0)}
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{getCustomerName(selectedOrder.customerId)}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Customer ID: #{selectedOrder.customerId}</div>
                </div>
              </div>
            </div>

            {/* Ordered Items list */}
            <div>
              <h4 style={{ marginBottom: '0.75rem', color: 'var(--text-muted)' }}>Items in Order</h4>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Unit Price</th>
                      <th>Quantity</th>
                      <th>Total Price</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map(item => (
                      <tr key={item.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Package size={16} style={{ color: 'var(--primary)' }} />
                            <span>Product #{item.productId}</span>
                          </div>
                        </td>
                        <td>${item.unitPrice.toFixed(2)}</td>
                        <td>{item.quantity}</td>
                        <td style={{ fontWeight: 600 }}>${item.totalPrice.toFixed(2)}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button 
                            className="btn btn-icon danger" 
                            title="Remove item"
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={loadingAction}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total Section */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase' }}>Grand Total</span>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-completed)' }}>${selectedOrder.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Action sidebar panel */}
          <div className="glass-card" style={{ height: 'fit-content' }}>
            <h3 style={{ marginBottom: '1.25rem' }}>Status Control</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Change the progress status of this order:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {(['Pending', 'InventoryChecking', 'Confirmed', 'Completed', 'Rejected'] as const).map(status => {
                const isActive = selectedOrder.status === status;
                let activeBtnClass = 'btn-secondary';
                if (isActive) {
                  if (status === 'Completed') activeBtnClass = 'btn-primary'; // Uses emerald gradients locally if we styled, or standard primary
                  else if (status === 'Rejected') activeBtnClass = 'btn-danger';
                  else activeBtnClass = 'btn-primary';
                }
                return (
                  <button 
                    key={status}
                    className={`btn ${isActive ? activeBtnClass : 'btn-secondary'}`}
                    style={{ width: '100%', justifyContent: 'flex-start' }}
                    onClick={() => handleUpdateStatus(status)}
                    disabled={loadingAction}
                  >
                    {isActive && <Check size={16} />}
                    {status}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="action-header">
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Order Control Center</h1>
          <p style={{ color: 'var(--text-muted)' }}>Filter orders, track statuses, and fulfill new requests</p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => {
            setIsCreateModalOpen(true);
            if (customers.length > 0 && customers[0].id) {
              setSelectedCustomerId(customers[0].id);
            }
          }}
        >
          <PlusCircle size={18} /> Place New Order
        </button>
      </div>

      {/* Filter and Search Section */}
      <div className="glass-card" style={{ padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div className="search-input-wrapper" style={{ maxWidth: '350px' }}>
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by Order ID or Client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Tab Filter */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['All', 'Pending', 'InventoryChecking', 'Confirmed', 'Completed', 'Rejected'].map(status => (
            <button
              key={status}
              className={`btn btn-secondary ${filterStatus === status ? 'active' : ''}`}
              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', border: '1px solid var(--border)' }}
              onClick={() => setFilterStatus(status)}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Directory list */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        {filteredOrders.length === 0 ? (
          <div className="empty-state">
            <ShoppingBag size={48} className="empty-icon" />
            <p>No orders matched your current filters</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Client</th>
                  <th>Order Date</th>
                  <th>Items Count</th>
                  <th>Grand Total</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => (
                  <tr key={order.id}>
                    <td style={{ fontWeight: 600 }}>#ORD-{order.id}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <User size={14} style={{ color: 'var(--text-dim)' }} />
                        <span>{getCustomerName(order.customerId)}</span>
                      </div>
                    </td>
                    <td>{new Date(order.orderDate).toLocaleDateString()}</td>
                    <td>{order.items?.length || 0} items</td>
                    <td style={{ fontWeight: 600 }}>${order.totalAmount.toFixed(2)}</td>
                    <td>
                      <span className={getStatusBadgeClass(order.status)}>
                        {order.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                        onClick={() => setSelectedOrder(order)}
                      >
                        <Edit size={14} /> Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Order Modal Wizard */}
      {isCreateModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content animate-scale-in" style={{ maxWidth: '750px' }}>
            <div className="modal-header">
              <h3>Place New Order</h3>
              <button className="btn-icon" onClick={handleCloseCreateModal}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateOrder}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {/* Select Customer */}
                <div className="form-group">
                  <label htmlFor="customerSelect">Select Ordering Customer</label>
                  <select
                    id="customerSelect"
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
                    required
                  >
                    <option value="" disabled>-- Choose a Client --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Items Section */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <label style={{ fontWeight: 600 }}>Order Items</label>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                      onClick={addOrderItemRow}
                    >
                      + Add Item Row
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {orderItems.map((item, index) => (
                      <div key={index} className="order-item-form-row">
                        {/* Product ID */}
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label style={{ fontSize: '0.75rem' }}>Product ID</label>
                          <input
                            type="number"
                            value={item.productId}
                            onChange={(e) => updateOrderItemRow(index, 'productId', Number(e.target.value))}
                            min="1"
                            required
                          />
                        </div>

                        {/* Quantity */}
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label style={{ fontSize: '0.75rem' }}>Quantity</label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateOrderItemRow(index, 'quantity', Number(e.target.value))}
                            min="1"
                            required
                          />
                        </div>

                        {/* Unit Price */}
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label style={{ fontSize: '0.75rem' }}>Unit Price ($)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => updateOrderItemRow(index, 'unitPrice', Number(e.target.value))}
                            min="0"
                            required
                          />
                        </div>

                        {/* Subtotal View */}
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <span style={{ fontSize: '0.75rem' }}>Subtotal</span>
                          <span style={{ fontWeight: 600, color: '#fff' }}>
                            ${(item.quantity * item.unitPrice).toFixed(2)}
                          </span>
                        </div>

                        {/* Actions: Stock check & Delete */}
                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}
                            onClick={() => handleCheckStock(index)}
                            title="Verify Stock"
                          >
                            <RefreshCw size={14} />
                          </button>
                          
                          <button
                            type="button"
                            className="btn btn-icon danger"
                            onClick={() => removeOrderItemRow(index)}
                            disabled={orderItems.length <= 1}
                            title="Delete Row"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        {/* Optional Stock availability indicator */}
                        {item.stockChecked && (
                          <div style={{ gridColumn: '1 / -1', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '-0.5rem' }}>
                            {item.stockAvailable ? (
                              <span style={{ color: 'var(--color-completed)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Check size={12} /> {item.stockMessage || 'Stock available'}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--color-rejected)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <AlertCircle size={12} /> {item.stockMessage || 'Unavailable'}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Grand Total Footer */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600 }}>Grand Total:</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-completed)' }}>
                    ${wizardGrandTotal.toFixed(2)}
                  </span>
                </div>

              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseCreateModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loadingCreate}>
                  {loadingCreate ? <div className="spinner" /> : 'Create Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
