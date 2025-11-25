'use client';

/**
 * Laboratory Management Page - Full CRUD with real data
 * Create, manage, and track laboratory orders and test results
 */

import { useEffect, useState, useMemo } from 'react';
import LabOrderModal from '@/components/laboratory/LabOrderModal';
import { getLabOrders, deleteLabOrder, LabOrderDetails, getStatusBadgeColor, getPriorityBadgeColor } from '@/lib/api/laboratory';

export default function LaboratoryPage() {
  const [orders, setOrders] = useState<LabOrderDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<LabOrderDetails | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Fetch lab orders on mount
  useEffect(() => {
    const loadOrders = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await getLabOrders();
        setOrders(response.results);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load lab orders';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();
  }, []);

  // Filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch =
        searchTerm === '' ||
        order.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === '' || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  const statuses = useMemo(() => {
    return [...new Set(orders.map(o => o.status))].sort();
  }, [orders]);

  const completedCount = useMemo(() => {
    return orders.filter(o => o.status === 'completed').length;
  }, [orders]);

  const pendingCount = useMemo(() => {
    return orders.filter(o => o.status === 'pending').length;
  }, [orders]);

  const handleAddClick = () => {
    setSelectedOrder(undefined);
    setModalOpen(true);
  };

  const handleEditClick = (order: LabOrderDetails) => {
    setSelectedOrder(order);
    setModalOpen(true);
  };

  const handleDeleteClick = async (order: LabOrderDetails) => {
    if (!confirm(`Are you sure you want to delete lab order ${order.id}?`)) {
      return;
    }

    try {
      await deleteLabOrder(order.id);
      setOrders(orders.filter(o => o.id !== order.id));
    } catch (err) {
      alert('Failed to delete lab order: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleModalSuccess = (order: LabOrderDetails) => {
    if (selectedOrder) {
      // Update existing order
      setOrders(orders.map(o => (o.id === order.id ? order : o)));
    } else {
      // Add new order
      setOrders([...orders, order]);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Laboratory</h1>
            <p className="text-gray-600 mt-1">Manage laboratory orders and test results</p>
          </div>
          <button
            onClick={handleAddClick}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
            </svg>
            New Order
          </button>
        </div>

        {/* Search and Filter */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                id="search"
                placeholder="Search by patient, doctor, or order ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                {statuses.map(status => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-gray-600">Loading laboratory orders...</div>
          </div>
        ) : (
          <>
            {/* Lab Orders Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
              {filteredOrders.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-gray-500">No laboratory orders found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Order ID</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Patient</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Doctor</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Test Type</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Priority</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Order Date</th>
                        <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((order) => (
                        <tr key={order.id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-mono text-gray-600">{order.id}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{order.patientName}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{order.doctorName}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {order.testType.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(order.status)}`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('-', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getPriorityBadgeColor(order.priority)}`}>
                              {order.priority.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{formatDate(order.orderDate)}</td>
                          <td className="px-6 py-4 text-sm text-right">
                            <button
                              onClick={() => handleEditClick(order)}
                              className="text-blue-600 hover:text-blue-700 mr-4 font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteClick(order)}
                              className="text-red-600 hover:text-red-700 font-medium"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <p className="text-gray-600 text-sm">Total Orders</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{orders.length}</p>
              </div>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <p className="text-gray-600 text-sm">Pending</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">{pendingCount}</p>
              </div>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <p className="text-gray-600 text-sm">Completed</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{completedCount}</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Lab Order Modal */}
      <LabOrderModal
        isOpen={modalOpen}
        order={selectedOrder}
        onClose={() => setModalOpen(false)}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
