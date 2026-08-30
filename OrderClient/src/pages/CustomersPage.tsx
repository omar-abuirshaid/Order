import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Customer, OrderEntity } from '../services/api';
import { Search, UserPlus, Phone, Mail, Calendar, User, Eye, X, ArrowLeft, ShoppingBag } from 'lucide-react';

interface CustomersPageProps {
  customers: Customer[];
  onRefresh: () => Promise<void>;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  openCreateModalDirectly?: boolean;
  onModalClosed?: () => void;
}

export const CustomersPage: React.FC<CustomersPageProps> = ({
  customers,
  onRefresh,
  showToast,
  openCreateModalDirectly = false,
  onModalClosed
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<OrderEntity[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingCreate, setLoadingCreate] = useState(false);

  // Form State
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');

  // Handle opening modal directly (e.g. from Dashboard Quick Actions)
  useEffect(() => {
    if (openCreateModalDirectly) {
      setIsModalOpen(true);
    }
  }, [openCreateModalDirectly]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    if (onModalClosed) onModalClosed();
  };

  // Fetch orders when customer details are opened
  const handleViewDetails = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setLoadingOrders(true);
    try {
      if (customer.id) {
        const orders = await api.customers.getOrders(customer.id);
        setCustomerOrders(orders);
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to fetch customer orders', 'error');
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingCreate(true);
    try {
      await api.customers.create({
        name: newName,
        email: newEmail,
        phone: newPhone
      });
      showToast('Customer registered successfully!', 'success');
      await onRefresh();
      // Reset form
      setNewName('');
      setNewEmail('');
      setNewPhone('');
      handleCloseModal();
    } catch (error: any) {
      showToast(error.message || 'Failed to register customer', 'error');
    } finally {
      setLoadingCreate(false);
    }
  };

  // Filter customers
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  if (selectedCustomer) {
    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div>
          <button 
            className="btn btn-secondary" 
            style={{ padding: '0.5rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}
            onClick={() => setSelectedCustomer(null)}
          >
            <ArrowLeft size={16} /> Back to Directory
          </button>
          
          <h2 style={{ fontSize: '1.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="avatar" style={{ width: '48px', height: '48px', fontSize: '1.25rem' }}>
              {selectedCustomer.name.charAt(0)}
            </div>
            {selectedCustomer.name}
          </h2>
        </div>

        {/* Profile Card */}
        <div className="glass-card">
          <h3 style={{ marginBottom: '1.5rem' }}>Customer Profile</h3>
          <div className="profile-grid">
            <div className="profile-item">
              <span className="profile-label">Customer ID</span>
              <span className="profile-value">#CUST-{selectedCustomer.id}</span>
            </div>
            <div className="profile-item">
              <span className="profile-label">Email Address</span>
              <span className="profile-value" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mail size={16} style={{ color: 'var(--primary)' }} /> {selectedCustomer.email}
              </span>
            </div>
            <div className="profile-item">
              <span className="profile-label">Phone Number</span>
              <span className="profile-value" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Phone size={16} style={{ color: 'var(--primary)' }} /> {selectedCustomer.phone}
              </span>
            </div>
            <div className="profile-item">
              <span className="profile-label">Registration Date</span>
              <span className="profile-value" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={16} style={{ color: 'var(--primary)' }} /> 
                {selectedCustomer.createdDate ? new Date(selectedCustomer.createdDate).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Customer Orders */}
        <div className="glass-card">
          <h3 style={{ marginBottom: '1.5rem' }}>Order History ({customerOrders.length})</h3>
          
          {loadingOrders ? (
            <div className="loading-container">
              <div className="spinner spinner-lg" />
              <p>Fetching purchase history...</p>
            </div>
          ) : customerOrders.length === 0 ? (
            <div className="empty-state">
              <ShoppingBag size={48} className="empty-icon" />
              <p>No orders registered for this customer yet</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Date</th>
                    <th>Items</th>
                    <th>Total Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {customerOrders.map(order => (
                    <tr key={order.id}>
                      <td style={{ fontWeight: 600 }}>#ORD-{order.id}</td>
                      <td>{new Date(order.orderDate).toLocaleDateString()}</td>
                      <td>{order.orderItems?.length || 0} items</td>
                      <td style={{ fontWeight: 600 }}>${order.totalAmount.toFixed(2)}</td>
                      <td>
                        <span className={`badge ${order.status.toLowerCase()}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="action-header">
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Customer Directory</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage client profiles and view purchase histories</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <UserPlus size={18} /> Register Customer
        </button>
      </div>

      {/* Search Bar */}
      <div className="glass-card" style={{ padding: '1.25rem 2rem' }}>
        <div className="search-input-wrapper" style={{ maxWidth: '400px' }}>
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by name, email or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Directory Table */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        {filteredCustomers.length === 0 ? (
          <div className="empty-state">
            <User size={48} className="empty-icon" />
            <p>No customers found matching search filter</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Registration Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map(customer => (
                  <tr key={customer.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '0.85rem' }}>
                          {customer.name.charAt(0)}
                        </div>
                        <span style={{ fontWeight: 600 }}>{customer.name}</span>
                      </div>
                    </td>
                    <td>{customer.email}</td>
                    <td>{customer.phone}</td>
                    <td>{customer.createdDate ? new Date(customer.createdDate).toLocaleDateString() : 'N/A'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                        onClick={() => handleViewDetails(customer)}
                      >
                        <Eye size={14} /> Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Register Customer Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content animate-scale-in">
            <div className="modal-header">
              <h3>Register New Customer</h3>
              <button className="btn-icon" onClick={handleCloseModal}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateCustomer}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    id="name"
                    type="text"
                    placeholder="Enter customer name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    placeholder="customer@domain.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    id="phone"
                    type="text"
                    placeholder="+9627XXXXXXXX"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loadingCreate}>
                  {loadingCreate ? <div className="spinner" /> : 'Register Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
