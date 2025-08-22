import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from '../../../utils/toast';
import LoadingBlock from '../../../components/common/LoadingBlock';
import ErrorState from '../../../components/common/ErrorState';
import StatusBadge from '../../../components/common/StatusBadge';
import DataTable from '../../../components/common/DataTable';

const AssignedDeliveries = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [viewMode, setViewMode] = useState('all'); // 'all', 'today', 'scheduled'
  const [mapView, setMapView] = useState(false);
  
  // Mock data for demonstration
  useEffect(() => {
    // Simulate API call to fetch assigned deliveries
    setLoading(true);
    setTimeout(() => {
      try {
        const mockDeliveries = [
          {
            id: 'DEL-2025-001',
            orderNumber: 'ORD-2025-122',
            customer: {
              name: 'John Doe',
              address: '123 Main St, Cityville',
              phone: '(555) 123-4567'
            },
            scheduledDate: '2025-08-22T14:30:00',
            status: 'assigned',
            priority: 'normal',
            distance: 3.2,
            estimatedTime: 15
          },
          {
            id: 'DEL-2025-002',
            orderNumber: 'ORD-2025-135',
            customer: {
              name: 'Jane Smith',
              address: '456 Oak Ave, Townburg',
              phone: '(555) 987-6543'
            },
            scheduledDate: '2025-08-22T16:00:00',
            status: 'picked-up',
            priority: 'high',
            distance: 5.7,
            estimatedTime: 23
          },
          {
            id: 'DEL-2025-003',
            orderNumber: 'ORD-2025-140',
            customer: {
              name: 'Bob Johnson',
              address: '789 Pine Rd, Villagetown',
              phone: '(555) 246-8135'
            },
            scheduledDate: '2025-08-23T10:15:00',
            status: 'assigned',
            priority: 'normal',
            distance: 4.1,
            estimatedTime: 18
          },
          {
            id: 'DEL-2025-004',
            orderNumber: 'ORD-2025-147',
            customer: {
              name: 'Alice Williams',
              address: '234 Cedar Ln, Hamletville',
              phone: '(555) 753-9510'
            },
            scheduledDate: '2025-08-23T14:45:00',
            status: 'assigned',
            priority: 'low',
            distance: 2.8,
            estimatedTime: 12
          }
        ];
        
        setDeliveries(mockDeliveries);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching deliveries:', err);
        setError('Failed to load assigned deliveries. Please try again.');
        setLoading(false);
      }
    }, 1000);
  }, []);
  
  const handleStatusUpdate = (id, newStatus) => {
    setLoading(true);
    
    // Simulate API call to update delivery status
    setTimeout(() => {
      const updatedDeliveries = deliveries.map(delivery => {
        if (delivery.id === id) {
          return { ...delivery, status: newStatus };
        }
        return delivery;
      });
      
      setDeliveries(updatedDeliveries);
      setLoading(false);
      toast.success(`Delivery ${id} status updated to: ${newStatus}`);
    }, 800);
  };
  
  const handleViewDelivery = (id) => {
    navigate(`/delivery/deliveries/${id}`);
  };
  
  const handleScanDelivery = () => {
    navigate('/delivery/scan');
  };
  
  const handleReportIssue = (id) => {
    navigate('/delivery/issue-report', { state: { deliveryId: id } });
  };
  
  const filterDeliveries = () => {
    if (viewMode === 'today') {
      const today = new Date().toISOString().split('T')[0];
      return deliveries.filter(delivery => {
        const deliveryDate = new Date(delivery.scheduledDate).toISOString().split('T')[0];
        return deliveryDate === today;
      });
    } else if (viewMode === 'scheduled') {
      const today = new Date().toISOString().split('T')[0];
      return deliveries.filter(delivery => {
        const deliveryDate = new Date(delivery.scheduledDate).toISOString().split('T')[0];
        return deliveryDate > today;
      });
    }
    return deliveries;
  };
  
  const columns = [
    {
      header: 'ID',
      accessorKey: 'id'
    },
    {
      header: 'Order #',
      accessorKey: 'orderNumber'
    },
    {
      header: 'Customer',
      accessorKey: 'customer',
      cell: (row) => row.row.original.customer.name
    },
    {
      header: 'Address',
      accessorKey: 'address',
      cell: (row) => row.row.original.customer.address
    },
    {
      header: 'Date',
      accessorKey: 'scheduledDate',
      cell: (row) => new Date(row.row.original.scheduledDate).toLocaleDateString()
    },
    {
      header: 'Time',
      accessorKey: 'scheduledTime',
      cell: (row) => new Date(row.row.original.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (row) => <StatusBadge status={row.row.original.status} type="delivery" />
    },
    {
      header: 'Priority',
      accessorKey: 'priority',
      cell: (row) => {
        const priority = row.row.original.priority;
        if (priority === 'high') return <span className="badge bg-danger">High</span>;
        if (priority === 'normal') return <span className="badge bg-primary">Normal</span>;
        return <span className="badge bg-secondary">Low</span>;
      }
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (row) => {
        const delivery = row.row.original;
        return (
          <div className="d-flex flex-wrap gap-1">
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={() => handleViewDelivery(delivery.id)}
            >
              <i className="bi bi-eye"></i>
            </button>
            {delivery.status === 'assigned' && (
              <button
                className="btn btn-sm btn-outline-success"
                onClick={() => handleStatusUpdate(delivery.id, 'picked-up')}
              >
                <i className="bi bi-box-arrow-up"></i>
              </button>
            )}
            {delivery.status === 'picked-up' && (
              <button
                className="btn btn-sm btn-success"
                onClick={() => handleStatusUpdate(delivery.id, 'delivered')}
              >
                <i className="bi bi-check2"></i>
              </button>
            )}
            <button
              className="btn btn-sm btn-outline-warning"
              onClick={() => handleReportIssue(delivery.id)}
            >
              <i className="bi bi-flag"></i>
            </button>
          </div>
        );
      }
    }
  ];
  
  if (loading) return <LoadingBlock text="Loading assigned deliveries..." />;
  if (error) return <ErrorState message={error} />;
  
  const filteredDeliveries = filterDeliveries();
  
  return (
    <div className="assigned-deliveries-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Assigned Deliveries</h1>
        <div>
          <button 
            className="btn btn-primary me-2"
            onClick={handleScanDelivery}
          >
            <i className="bi bi-qr-code-scan me-1"></i>
            Scan QR Code
          </button>
          <div className="btn-group">
            <button 
              className={`btn ${mapView ? 'btn-outline-secondary' : 'btn-secondary'}`}
              onClick={() => setMapView(false)}
            >
              <i className="bi bi-list"></i>
            </button>
            <button 
              className={`btn ${mapView ? 'btn-secondary' : 'btn-outline-secondary'}`}
              onClick={() => setMapView(true)}
            >
              <i className="bi bi-map"></i>
            </button>
          </div>
        </div>
      </div>
      
      <div className="card mb-4">
        <div className="card-body">
          <div className="nav nav-pills mb-3">
            <button 
              className={`nav-link ${viewMode === 'all' ? 'active' : ''}`}
              onClick={() => setViewMode('all')}
            >
              All Deliveries
            </button>
            <button 
              className={`nav-link ${viewMode === 'today' ? 'active' : ''}`}
              onClick={() => setViewMode('today')}
            >
              Today's Deliveries
            </button>
            <button 
              className={`nav-link ${viewMode === 'scheduled' ? 'active' : ''}`}
              onClick={() => setViewMode('scheduled')}
            >
              Scheduled Deliveries
            </button>
          </div>
          
          {mapView ? (
            <div className="map-container" style={{ height: '500px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
              <div className="d-flex justify-content-center align-items-center h-100">
                <div className="text-center">
                  <i className="bi bi-map" style={{ fontSize: '3rem' }}></i>
                  <h5 className="mt-3">Delivery Route Map</h5>
                  <p>Interactive map with delivery locations would appear here.</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <h6 className="mb-3">
                {viewMode === 'today' ? "Today's Deliveries" : 
                 viewMode === 'scheduled' ? "Scheduled Deliveries" : 
                 "All Assigned Deliveries"}
                <span className="badge bg-secondary ms-2">{filteredDeliveries.length}</span>
              </h6>
              <DataTable
                columns={columns}
                data={filteredDeliveries}
                pagination
                searchable
                emptyMessage="No deliveries found"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignedDeliveries;
