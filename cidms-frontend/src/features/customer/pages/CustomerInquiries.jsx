import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import DataTable from '../../../components/common/DataTable';
import LoadingBlock from '../../../components/common/LoadingBlock';
import ErrorState from '../../../components/common/ErrorState';
import StatusBadge from '../../../components/common/StatusBadge';
import toast from '../../../utils/toast';

const CustomerInquiries = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    type: 'product',
    description: '',
    orderId: '',
    productId: ''
  });
  
  const { user } = useSelector(state => state.auth);

  // Mock inquiries data for demonstration
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockInquiries = [
        { 
          id: 'INQ001',
          subject: 'Damaged Product',
          type: 'product',
          status: 'open',
          createdAt: '2025-08-15T10:30:00',
          lastUpdated: '2025-08-15T14:22:00',
          responses: 2
        },
        { 
          id: 'INQ002',
          subject: 'Delivery Delay',
          type: 'delivery',
          status: 'in-progress',
          createdAt: '2025-08-10T09:15:00',
          lastUpdated: '2025-08-21T11:45:00',
          responses: 3
        },
        { 
          id: 'INQ003',
          subject: 'Refund Request',
          type: 'order',
          status: 'resolved',
          createdAt: '2025-07-30T16:20:00',
          lastUpdated: '2025-08-05T13:10:00',
          responses: 4
        }
      ];
      setInquiries(mockInquiries);
      setLoading(false);
    }, 800);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const newInquiry = {
        id: `INQ${Math.floor(Math.random() * 1000)}`,
        ...formData,
        status: 'open',
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        responses: 0
      };
      
      setInquiries(prev => [newInquiry, ...prev]);
      setShowInquiryForm(false);
      setFormData({
        subject: '',
        type: 'product',
        description: '',
        orderId: '',
        productId: ''
      });
      setLoading(false);
      toast.success('Inquiry submitted successfully!');
    }, 1000);
  };

  const columns = [
    {
      header: 'ID',
      accessorKey: 'id'
    },
    {
      header: 'Subject',
      accessorKey: 'subject'
    },
    {
      header: 'Type',
      accessorKey: 'type',
      cell: (row) => {
        const inquiry = row.row.original;
        let icon, typeText;
        
        switch(inquiry.type) {
          case 'product':
            icon = 'box';
            typeText = 'Product';
            break;
          case 'delivery':
            icon = 'truck';
            typeText = 'Delivery';
            break;
          case 'order':
            icon = 'cart';
            typeText = 'Order';
            break;
          default:
            icon = 'question-circle';
            typeText = 'Other';
        }
        
        return (
          <span>
            <i className={`bi bi-${icon} me-1`}></i>
            {typeText}
          </span>
        );
      }
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (row) => <StatusBadge status={row.row.original.status} type="inquiry" />
    },
    {
      header: 'Date Created',
      accessorKey: 'createdAt',
      cell: (row) => new Date(row.row.original.createdAt).toLocaleDateString()
    },
    {
      header: 'Last Updated',
      accessorKey: 'lastUpdated',
      cell: (row) => new Date(row.row.original.lastUpdated).toLocaleDateString()
    },
    {
      header: 'Responses',
      accessorKey: 'responses'
    },
    {
      id: 'actions',
      header: '',
      cell: (row) => (
        <button 
          className="btn btn-sm btn-outline-primary"
          onClick={() => alert(`View Inquiry ${row.row.original.id}`)}
        >
          <i className="bi bi-eye me-1"></i>
          View
        </button>
      )
    }
  ];
  
  if (loading) return <LoadingBlock text="Loading inquiries..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="customer-inquiries">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>My Inquiries</h1>
        <button 
          className="btn btn-primary" 
          onClick={() => setShowInquiryForm(!showInquiryForm)}
        >
          {showInquiryForm ? 'Cancel' : 'New Inquiry'}
        </button>
      </div>
      
      {showInquiryForm && (
        <div className="card mb-4">
          <div className="card-header bg-light">
            <h5 className="mb-0">Submit New Inquiry</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row mb-3">
                <div className="col-md-6">
                  <label htmlFor="subject" className="form-label">Subject *</label>
                  <input
                    type="text"
                    className="form-control"
                    id="subject"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="type" className="form-label">Inquiry Type *</label>
                  <select 
                    className="form-select"
                    id="type"
                    name="type"
                    required
                    value={formData.type}
                    onChange={handleInputChange}
                  >
                    <option value="product">Product Related</option>
                    <option value="delivery">Delivery Related</option>
                    <option value="order">Order Related</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              
              <div className="row mb-3">
                <div className="col-md-6">
                  <label htmlFor="orderId" className="form-label">Order ID (if applicable)</label>
                  <input
                    type="text"
                    className="form-control"
                    id="orderId"
                    name="orderId"
                    value={formData.orderId}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="productId" className="form-label">Product ID (if applicable)</label>
                  <input
                    type="text"
                    className="form-control"
                    id="productId"
                    name="productId"
                    value={formData.productId}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div className="mb-3">
                <label htmlFor="description" className="form-label">Description *</label>
                <textarea
                  className="form-control"
                  id="description"
                  name="description"
                  rows="5"
                  required
                  value={formData.description}
                  onChange={handleInputChange}
                ></textarea>
              </div>
              
              <div className="d-flex justify-content-end">
                <button type="submit" className="btn btn-primary">
                  <i className="bi bi-send me-1"></i>
                  Submit Inquiry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <div className="card">
        <div className="card-body">
          <DataTable 
            columns={columns}
            data={inquiries}
            pagination
            searchable
            emptyMessage="No inquiries found"
          />
        </div>
      </div>
    </div>
  );
}
export default CustomerInquiries;
