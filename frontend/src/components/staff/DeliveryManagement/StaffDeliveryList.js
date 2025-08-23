import React, { useState, useEffect } from 'react';
import { deliveryAPI, userAPI } from '../../../services/api';
import StatusBadge from '../../common/StatusBadge';
import LoadingSpinner from '../../common/LoadingSpinner';
import { formatDate } from '../../../utils/helpers';
import { DELIVERY_STATUS } from '../../../utils/constants';
import { Modal, Button } from 'react-bootstrap';

const StaffDeliveryList = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deliveryPersonnel, setDeliveryPersonnel] = useState([]);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [showDeliveryDetails, setShowDeliveryDetails] = useState(false);

  useEffect(() => {
    fetchDeliveries();
    fetchDeliveryPersonnel();
  }, []);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const response = await deliveryAPI.getAll();
      
      let deliveriesData = [];
      if (response.data && Array.isArray(response.data)) {
        deliveriesData = response.data;
      } else if (response.data && response.data.deliveries) {
        deliveriesData = response.data.deliveries;
      }
      
      setDeliveries(deliveriesData);
    } catch (error) {
      console.error('Failed to fetch deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveryPersonnel = async () => {
    try {
      const response = await userAPI.getByRole('delivery');
      
      let personnelData = [];
      if (Array.isArray(response.data)) {
        personnelData = response.data;
      } else if (response.data && response.data.users) {
        personnelData = response.data.users;
      }
      
      setDeliveryPersonnel(personnelData);
    } catch (error) {
      console.error('Failed to fetch delivery personnel:', error);
    }
  };

  const getDeliveryPersonName = (deliveryPersonId) => {
    if (!deliveryPersonId) return 'Unknown';
    
    const deliveryPerson = deliveryPersonnel.find(
      p => (p.id && p.id.toString() === deliveryPersonId.toString()) || 
           (p._id && p._id.toString() === deliveryPersonId.toString())
    );
    return deliveryPerson ? (deliveryPerson.name || deliveryPerson.email) : 'Unknown';
  };

  const viewDeliveryDetails = (delivery) => {
    setSelectedDelivery(delivery);
    setShowDeliveryDetails(true);
  };

  const handleUpdateDeliveryStatus = async (deliveryId, newStatus) => {
    try {
      await deliveryAPI.updateStatus(deliveryId, newStatus);
      fetchDeliveries();
    } catch (error) {
      console.error('Failed to update delivery status:', error);
    }
  };

  // Filter deliveries based on search term and status
  const filteredDeliveries = deliveries.filter(delivery => {
    if (!delivery) return false;
    
    const deliveryId = (delivery.id || delivery._id || '').toString();
    const customerName = delivery.customerName || '';
    const status = delivery.status || '';
    const deliveryPersonName = getDeliveryPersonName(delivery.deliveryPerson) || '';
    
    const matchesSearch = 
      !searchTerm || 
      deliveryId.includes(searchTerm) ||
      customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deliveryPersonName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <LoadingSpinner text="Loading deliveries..." />;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Delivery Management</h2>
        <button 
          className="btn btn-outline-primary"
          onClick={fetchDeliveries}
        >
          <i className="bi bi-arrow-clockwise me-2"></i>
          Refresh Deliveries
        </button>
      </div>

      {/* Search and Filter */}
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="input-group">
            <span className="input-group-text">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search by delivery ID, customer name, or delivery person"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="col-md-6">
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            {Object.entries(DELIVERY_STATUS).map(([key, value]) => (
              <option key={key} value={key.toLowerCase()}>
                {value}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Deliveries Table */}
      {filteredDeliveries.length === 0 ? (
        <div className="alert alert-info">
          No deliveries found matching your criteria
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover">
            <thead className="table-light">
              <tr>
                <th>ID</th>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Delivery Person</th>
                <th>Status</th>
                <th>Assigned Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeliveries.map((delivery) => (
                <tr key={delivery.id || delivery._id}>
                  <td>#{(delivery.id || delivery._id)?.toString().substring(0, 6)}</td>
                  <td>#{delivery.order ? (typeof delivery.order === 'string' ? delivery.order.substring(0, 6) : delivery.order.toString().substring(0, 6)) : 'N/A'}</td>
                  <td>{delivery.customerName}</td>
                  <td>{getDeliveryPersonName(delivery.deliveryPerson)}</td>
                  <td>
                    <StatusBadge status={delivery.status} />
                  </td>
                  <td>{formatDate(delivery.createdAt)}</td>
                  <td>
                    <div className="btn-group btn-group-sm">
                      <button
                        className="btn btn-outline-primary"
                        onClick={() => viewDeliveryDetails(delivery)}
                      >
                        <i className="bi bi-eye me-1"></i> View
                      </button>
                      
                      {delivery.status === 'assigned' && (
                        <button
                          className="btn btn-outline-info"
                          onClick={() => handleUpdateDeliveryStatus(delivery.id || delivery._id, 'picked_up')}
                        >
                          <i className="bi bi-box-seam me-1"></i> Mark Picked Up
                        </button>
                      )}
                      
                      {delivery.status === 'picked_up' && (
                        <button
                          className="btn btn-outline-warning"
                          onClick={() => handleUpdateDeliveryStatus(delivery.id || delivery._id, 'in_transit')}
                        >
                          <i className="bi bi-truck me-1"></i> Mark In Transit
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delivery Details Modal */}
      <Modal 
        show={showDeliveryDetails} 
        onHide={() => setShowDeliveryDetails(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Delivery Details #{selectedDelivery ? ((selectedDelivery.id || selectedDelivery._id)?.toString().substring(0, 6)) : ''}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedDelivery && (
            <div>
              <div className="row mb-4">
                <div className="col-md-6">
                  <h6>Delivery Information</h6>
                  <p className="mb-1">
                    <strong>Status:</strong> <StatusBadge status={selectedDelivery.status} />
                  </p>
                  <p className="mb-1">
                    <strong>Assigned Date:</strong> {formatDate(selectedDelivery.createdAt)}
                  </p>
                  <p className="mb-1">
                    <strong>Delivery Person:</strong> {getDeliveryPersonName(selectedDelivery.deliveryPerson)}
                  </p>
                  <p className="mb-0">
                    <strong>Order ID:</strong> #{selectedDelivery.order ? (typeof selectedDelivery.order === 'string' ? selectedDelivery.order.substring(0, 6) : selectedDelivery.order.toString().substring(0, 6)) : 'N/A'}
                  </p>
                </div>
                <div className="col-md-6">
                  <h6>Customer Information</h6>
                  <p className="mb-1">
                    <strong>Name:</strong> {selectedDelivery.customerName}
                  </p>
                  <p className="mb-0">
                    <strong>Phone:</strong> {selectedDelivery.contactPhone || 'N/A'}
                  </p>
                </div>
              </div>

              <h6>Delivery Address</h6>
              <p className="mb-4">
                {selectedDelivery.address?.street}, {selectedDelivery.address?.city}, 
                {selectedDelivery.address?.state} {selectedDelivery.address?.zip}
              </p>

              {selectedDelivery.items && (
                <>
                  <h6>Items</h6>
                  <div className="table-responsive">
                    <table className="table table-sm table-bordered">
                      <thead className="table-light">
                        <tr>
                          <th>Item</th>
                          <th>Quantity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedDelivery.items.map((item, index) => (
                          <tr key={index}>
                            <td>{item.name}</td>
                            <td>{item.quantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {selectedDelivery.status === 'delivered' && (
                <div className="alert alert-success mt-3">
                  <i className="bi bi-check-circle me-2"></i>
                  This delivery has been completed successfully.
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeliveryDetails(false)}>
            Close
          </Button>
          
          {selectedDelivery?.status === 'assigned' && (
            <Button 
              variant="primary"
              onClick={() => {
                handleUpdateDeliveryStatus(selectedDelivery.id || selectedDelivery._id, 'picked_up');
                setShowDeliveryDetails(false);
              }}
            >
              Mark as Picked Up
            </Button>
          )}
          
          {selectedDelivery?.status === 'picked_up' && (
            <Button 
              variant="warning"
              onClick={() => {
                handleUpdateDeliveryStatus(selectedDelivery.id || selectedDelivery._id, 'in_transit');
                setShowDeliveryDetails(false);
              }}
            >
              Mark as In Transit
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default StaffDeliveryList;
