import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DataTable from '../../../components/common/DataTable';
import LoadingBlock from '../../../components/common/LoadingBlock';
import ErrorState from '../../../components/common/ErrorState';
import StatusBadge from '../../../components/common/StatusBadge';
import OrderStatusStepper from '../../../components/common/OrderStatusStepper';

const CustomerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Mock orders data for demonstration
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockOrders = [
        {
          id: 'ORD-2025-001',
          date: '2025-08-15T14:30:00',
          items: 3,
          total: 249.99,
          status: 'delivered',
          deliveryId: 'DEL-2025-001'
        },
        {
          id: 'ORD-2025-002',
          date: '2025-08-18T10:15:00',
          items: 1,
          total: 149.50,
          status: 'processing',
          deliveryId: 'DEL-2025-002'
        },
        {
          id: 'ORD-2025-003',
          date: '2025-08-20T09:45:00',
          items: 5,
          total: 499.95,
          status: 'shipped',
          deliveryId: 'DEL-2025-003'
        }
      ];
      
      setOrders(mockOrders);
      setLoading(false);
    }, 800);
  }, []);
  
  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
  };
  
  const reorder = (order) => {
    // Simulate reordering functionality
    alert(`Reordering items from order ${order.id}`);
  };
  
  const columns = [
    {
      header: 'Order ID',
      accessorKey: 'id'
    },
    {
      header: 'Date',
      accessorKey: 'date',
      cell: (row) => new Date(row.row.original.date).toLocaleDateString()
    },
    {
      header: 'Items',
      accessorKey: 'items'
    },
    {
      header: 'Total',
      accessorKey: 'total',
      cell: (row) => `$${row.row.original.total.toFixed(2)}`
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (row) => <StatusBadge status={row.row.original.status} type="order" />
    },
    {
      id: 'actions',
      header: '',
      cell: (row) => (
        <div className="d-flex gap-2">
          <button 
            className="btn btn-sm btn-outline-primary"
            onClick={() => viewOrderDetails(row.row.original)}
          >
            <i className="bi bi-eye me-1"></i>
            Details
          </button>
          <button 
            className="btn btn-sm btn-outline-success"
            onClick={() => reorder(row.row.original)}
          >
            <i className="bi bi-arrow-repeat me-1"></i>
            Reorder
          </button>
        </div>
      )
    }
  ];
}
export default CustomerOrders;
