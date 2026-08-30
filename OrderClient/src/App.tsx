import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import type { Customer, OrderResponseDto } from './services/api';
import { Auth } from './pages/Auth';
import { DashboardHome } from './pages/DashboardHome';
import { CustomersPage } from './pages/CustomersPage';
import { OrdersPage } from './pages/OrdersPage';
import { LayoutDashboard, Users, ShoppingBag, LogOut, Menu, X, ShieldAlert, Sparkles } from 'lucide-react';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export const App: React.FC = () => {
  // Authentication State
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [username, setUsername] = useState<string | null>(localStorage.getItem('username'));
  const [email, setEmail] = useState<string | null>(localStorage.getItem('email'));

  // Application Data State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<OrderResponseDto[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Navigation & Shell UI
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [createOrderTrigger, setCreateOrderTrigger] = useState(false);
  const [createCustomerTrigger, setCreateCustomerTrigger] = useState(false);

  // Toast System
  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Auth Operations
  const handleAuthSuccess = (newToken: string, newUsername: string, newEmail: string) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('username', newUsername);
    localStorage.setItem('email', newEmail);
    setToken(newToken);
    setUsername(newUsername);
    setEmail(newEmail);
    showToast('Signed in successfully!', 'success');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    setToken(null);
    setUsername(null);
    setEmail(null);
    setCustomers([]);
    setOrders([]);
    setActiveTab('dashboard');
    showToast('Logged out successfully', 'info');
  };

  // Load Data
  const loadDashboardData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [allCustomers, allOrders] = await Promise.all([
        api.customers.getAll(),
        api.orders.getAll()
      ]);
      setCustomers(allCustomers);
      setOrders(allOrders);
    } catch (error: any) {
      if (error.message.includes('401') || error.message.toLowerCase().includes('unauthorized')) {
        handleLogout();
        showToast('Session expired, please login again.', 'error');
      } else {
        showToast(error.message || 'Failed to fetch dashboard data', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadDashboardData();
    }
  }, [token]);

  // Navigate Helper
  const navigateTo = (tab: string) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
  };

  // Quick Action triggers
  const triggerCreateOrder = () => {
    setCreateOrderTrigger(true);
    navigateTo('orders');
  };

  const triggerCreateCustomer = () => {
    setCreateCustomerTrigger(true);
    navigateTo('customers');
  };

  return (
    <>
      {/* Toast Notification HUD */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast ${toast.type} animate-scale-in`}>
            {toast.type === 'success' && <Sparkles size={18} style={{ color: 'var(--color-completed)' }} />}
            {toast.type === 'error' && <ShieldAlert size={18} style={{ color: 'var(--color-rejected)' }} />}
            {toast.type === 'info' && <Sparkles size={18} style={{ color: 'var(--color-checking)' }} />}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      {!token ? (
        <Auth onAuthSuccess={handleAuthSuccess} showToast={showToast} />
      ) : (
        <div className="app-shell">
          
          {/* Mobile Hamburg Header */}
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: '60px',
            background: 'rgba(11, 14, 30, 0.9)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 1.5rem',
            zIndex: 90,
          }} className="show-mobile-only">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div className="brand-logo" style={{ width: '32px', height: '32px', borderRadius: '8px', fontSize: '0.85rem' }}>OF</div>
              <span style={{ fontWeight: 700, fontSize: '1rem' }}>Order Flow</span>
            </div>
            <button className="btn-icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>

          {/* Sidebar Drawer */}
          <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
            <div className="brand">
              <div className="brand-logo">OF</div>
              <h2 className="brand-name">Order Flow</h2>
            </div>

            <ul className="nav-links">
              <li 
                className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => navigateTo('dashboard')}
              >
                <LayoutDashboard size={20} /> Overview
              </li>
              <li 
                className={`nav-item ${activeTab === 'customers' ? 'active' : ''}`}
                onClick={() => navigateTo('customers')}
              >
                <Users size={20} /> Customers
              </li>
              <li 
                className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}
                onClick={() => navigateTo('orders')}
              >
                <ShoppingBag size={20} /> Orders
              </li>
            </ul>

            <div className="sidebar-footer">
              <div className="user-profile">
                <div className="avatar">
                  {username ? username.charAt(0) : 'A'}
                </div>
                <div className="user-details">
                  <span className="user-name">{username || 'Admin'}</span>
                  <span className="user-role" style={{ fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }} title={email || 'Administrator'}>
                    {email || 'Administrator'}
                  </span>
                </div>
              </div>
              <button className="btn-icon" onClick={handleLogout} title="Sign Out">
                <LogOut size={18} />
              </button>
            </div>
          </div>

          {/* Main Panel */}
          <div className="main-content" style={{ marginTop: window.innerWidth <= 1024 ? '60px' : '0' }}>
            {loading && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(7, 9, 19, 0.4)',
                backdropFilter: 'blur(3px)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div className="spinner spinner-lg" />
              </div>
            )}

            {/* View Selector */}
            {activeTab === 'dashboard' && (
              <DashboardHome 
                orders={orders} 
                customers={customers} 
                onNavigate={navigateTo}
                onCreateOrderClick={triggerCreateOrder}
                onCreateCustomerClick={triggerCreateCustomer}
              />
            )}
            
            {activeTab === 'customers' && (
              <CustomersPage 
                customers={customers} 
                onRefresh={loadDashboardData} 
                showToast={showToast}
                openCreateModalDirectly={createCustomerTrigger}
                onModalClosed={() => setCreateCustomerTrigger(false)}
              />
            )}

            {activeTab === 'orders' && (
              <OrdersPage 
                orders={orders} 
                customers={customers} 
                onRefresh={loadDashboardData} 
                showToast={showToast}
                openCreateModalDirectly={createOrderTrigger}
                onModalClosed={() => setCreateOrderTrigger(false)}
              />
            )}
          </div>

        </div>
      )}
    </>
  );
};

export default App;
