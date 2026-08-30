import React from 'react';
import type { Customer, OrderResponseDto } from '../services/api';
import { ShoppingBag, Users, DollarSign, Activity, ChevronRight, PlusCircle } from 'lucide-react';

interface DashboardHomeProps {
  orders: OrderResponseDto[];
  customers: Customer[];
  onNavigate: (tab: string) => void;
  onCreateOrderClick: () => void;
  onCreateCustomerClick: () => void;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({
  orders,
  customers,
  onNavigate,
  onCreateOrderClick,
  onCreateCustomerClick
}) => {
  // Calculations
  const totalOrders = orders.length;
  const totalCustomers = customers.length;
  const totalRevenue = orders
    .filter(o => o.status !== 'Rejected')
    .reduce((sum, o) => sum + o.totalAmount, 0);
  
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Status counts
  const statusCounts = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get status color CSS class names
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

  // Recent 5 orders
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
    .slice(0, 5);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Dashboard Overview</h1>
        <p style={{ color: 'var(--text-muted)' }}>Real-time statistics and summary of operations</p>
      </div>

      {/* Metrics Grid */}
      <div className="metrics-grid">
        <div className="glass-card metric-card">
          <div className="metric-info">
            <span className="metric-label">Total Revenue</span>
            <span className="metric-value">${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="metric-icon-box success">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-info">
            <span className="metric-label">Total Orders</span>
            <span className="metric-value">{totalOrders}</span>
          </div>
          <div className="metric-icon-box primary">
            <ShoppingBag size={24} />
          </div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-info">
            <span className="metric-label">Active Customers</span>
            <span className="metric-value">{totalCustomers}</span>
          </div>
          <div className="metric-icon-box secondary">
            <Users size={24} />
          </div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-info">
            <span className="metric-label">Avg. Order Value</span>
            <span className="metric-value">${avgOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="metric-icon-box info">
            <Activity size={24} />
          </div>
        </div>
      </div>

      {/* Split Dashboard Row */}
      <div className="dashboard-row">
        {/* Left Side: Recent Activity */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3>Recent Orders</h3>
            <button 
              className="btn btn-secondary" 
              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
              onClick={() => onNavigate('orders')}
            >
              View All <ChevronRight size={16} />
            </button>
          </div>
          
          {recentOrders.length === 0 ? (
            <div className="empty-state">
              <ShoppingBag size={48} className="empty-icon" />
              <p>No orders registered yet</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer ID</th>
                    <th>Date</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map(order => (
                    <tr key={order.id}>
                      <td style={{ fontWeight: 600 }}>#ORD-{order.id}</td>
                      <td>
                        Customer #{order.customerId}
                      </td>
                      <td>{new Date(order.orderDate).toLocaleDateString()}</td>
                      <td style={{ fontWeight: 600 }}>${order.totalAmount.toFixed(2)}</td>
                      <td>
                        <span className={getStatusBadgeClass(order.status)}>
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

        {/* Right Side: Quick Actions & Status Distribution */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Quick Actions */}
          <div className="glass-card">
            <h3 style={{ marginBottom: '1.25rem' }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button 
                className="btn btn-primary" 
                style={{ width: '100%', justifyContent: 'flex-start' }}
                onClick={onCreateOrderClick}
              >
                <PlusCircle size={18} /> Create New Order
              </button>
              <button 
                className="btn btn-secondary" 
                style={{ width: '100%', justifyContent: 'flex-start' }}
                onClick={onCreateCustomerClick}
              >
                <PlusCircle size={18} /> Register Customer
              </button>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="glass-card">
            <h3 style={{ marginBottom: '1.25rem' }}>Order Statuses</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {(['Pending', 'InventoryChecking', 'Confirmed', 'Completed', 'Rejected'] as const).map(status => {
                const count = statusCounts[status] || 0;
                const percentage = totalOrders > 0 ? (count / totalOrders) * 100 : 0;
                
                let barColor = 'var(--primary)';
                if (status === 'Completed') barColor = 'var(--color-completed)';
                if (status === 'Pending') barColor = 'var(--color-pending)';
                if (status === 'Rejected') barColor = 'var(--color-rejected)';
                if (status === 'InventoryChecking') barColor = 'var(--color-checking)';
                if (status === 'Confirmed') barColor = 'var(--color-confirmed)';

                return (
                  <div key={status} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: 500 }}>{status}</span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {count} ({Math.round(percentage)}%)
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${percentage}%`, height: '100%', background: barColor, borderRadius: '3px' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
