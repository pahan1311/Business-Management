import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from '../../../utils/toast';
import DataTable from '../../../components/common/DataTable';
import SearchInput from '../../../components/common/SearchInput';
import StatusBadge from '../../../components/common/StatusBadge';
import ConfirmDialog from '../../../components/common/ConfirmDialog';

const InquiriesList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [inquiries, setInquiries] = useState([
    {
      id: 'INQ-2025-001',
      subject: 'Order Delivery Issue',
      customer: {
        id: 'CUST-001',
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '(555) 123-4567'
      },
      status: 'open',
      priority: 'high',
      type: 'complaint',
      orderNumber: 'ORD-2025-122',
      createdAt: '2025-08-15T09:23:45',
      assignedTo: null,
      lastUpdated: '2025-08-15T09:23:45'
    },
    {
      id: 'INQ-2025-002',
      subject: 'Product Information Request',
      customer: {
        id: 'CUST-002',
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        phone: '(555) 987-6543'
      },
      status: 'in-progress',
      priority: 'normal',
      type: 'information',
      orderNumber: null,
      createdAt: '2025-08-16T14:12:33',
      assignedTo: 'Staff Member 1',
      lastUpdated: '2025-08-17T10:45:12'
    },
    {
      id: 'INQ-2025-003',
      subject: 'Refund Request',
      customer: {
        id: 'CUST-003',
        name: 'Mike Johnson',
        email: 'mike.johnson@example.com',
        phone: '(555) 246-8135'
      },
      status: 'resolved',
      priority: 'high',
      type: 'refund',
      orderNumber: 'ORD-2025-098',
      createdAt: '2025-08-10T11:05:22',
      assignedTo: 'Staff Member 2',
      lastUpdated: '2025-08-19T16:30:45'
    },
    {
      id: 'INQ-2025-004',
      subject: 'Website Technical Issue',
      customer: {
        id: 'CUST-004',
        name: 'Sarah Williams',
        email: 'sarah.williams@example.com',
        phone: '(555) 753-9510'
      },
      status: 'open',
      priority: 'low',
      type: 'technical',
      orderNumber: null,
      createdAt: '2025-08-18T08:45:10',
      assignedTo: null,
      lastUpdated: '2025-08-18T08:45:10'
    },
    {
      id: 'INQ-2025-005',
      subject: 'Bulk Order Inquiry',
      customer: {
        id: 'CUST-005',
        name: 'Robert Brown',
        email: 'robert.brown@example.com',
        phone: '(555) 321-7890'
      },
      status: 'in-progress',
      priority: 'normal',
      type: 'quote',
      orderNumber: null,
      createdAt: '2025-08-19T15:22:18',
      assignedTo: 'Staff Member 3',
      lastUpdated: '2025-08-20T09:15:33'
    }
  ]);
  
  const [search, setSearch] = useState('');
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const handleSearch = (term) => {
    setSearch(term);
  };
  
  const handleViewInquiry = (id) => {
    // Navigate to inquiry detail view
    toast.info(`View inquiry details for ID: ${id}`);
  };
  
  const handleAssign = (id) => {
    // Open assign dialog/form
    toast.info(`Assign inquiry ID: ${id} to staff member`);
  };
  
  const handleReply = (id) => {
    // Navigate to reply form
    toast.info(`Reply to inquiry ID: ${id}`);
  };
  
  const handleDelete = (inquiry) => {
    setSelectedInquiry(inquiry);
    setShowDeleteConfirm(true);
  };
  
  const confirmDelete = () => {
    // Delete inquiry logic
    const updatedList = inquiries.filter(inquiry => inquiry.id !== selectedInquiry.id);
    setInquiries(updatedList);
    toast.success(`Inquiry ${selectedInquiry.id} has been deleted`);
    setShowDeleteConfirm(false);
  };
  
  const handleStatusUpdate = (id, newStatus) => {
    // Update inquiry status
    const updatedInquiries = inquiries.map(inquiry => {
      if (inquiry.id === id) {
        return { 
          ...inquiry, 
          status: newStatus,
          lastUpdated: new Date().toISOString()
        };
      }
      return inquiry;
    });
    
    setInquiries(updatedInquiries);
    toast.success(`Inquiry ${id} status updated to ${newStatus}`);
  };
  
  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
  };
  
  const handleTypeFilterChange = (type) => {
    setTypeFilter(type);
  };
  
  const handlePriorityFilterChange = (priority) => {
    setPriorityFilter(priority);
  };
  
  // Filter inquiries based on filters and search term
  const filteredInquiries = inquiries.filter(inquiry => {
    let matches = true;
    
    // Apply status filter
    if (statusFilter !== 'all') {
      matches = matches && inquiry.status === statusFilter;
    }
    
    // Apply type filter
    if (typeFilter !== 'all') {
      matches = matches && inquiry.type === typeFilter;
    }
    
    // Apply priority filter
    if (priorityFilter !== 'all') {
      matches = matches && inquiry.priority === priorityFilter;
    }
    
    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      const matchesSearch = 
        inquiry.id.toLowerCase().includes(searchLower) ||
        inquiry.subject.toLowerCase().includes(searchLower) ||
        inquiry.customer.name.toLowerCase().includes(searchLower) ||
        inquiry.customer.email.toLowerCase().includes(searchLower) ||
        (inquiry.orderNumber && inquiry.orderNumber.toLowerCase().includes(searchLower));
      
      matches = matches && matchesSearch;
    }
    
    return matches;
  });
  
  const columns = [
    {
      header: 'ID',
      accessorKey: 'id',
      size: 150
    },
    {
      header: 'Subject',
      accessorKey: 'subject'
    },
    {
      header: 'Customer',
      accessorKey: 'customer.name',
      cell: (row) => (
        <div>
          <div>{row.row.original.customer.name}</div>
          <small className="text-muted">{row.row.original.customer.email}</small>
        </div>
      )
    },
    {
      header: 'Type',
      accessorKey: 'type',
      cell: (row) => {
        const type = row.row.original.type;
        const typeConfig = {
          'complaint': { color: 'danger', icon: 'exclamation-circle' },
          'information': { color: 'info', icon: 'info-circle' },
          'refund': { color: 'warning', icon: 'currency-dollar' },
          'technical': { color: 'secondary', icon: 'gear' },
          'quote': { color: 'primary', icon: 'chat-quote' }
        };
        
        return (
          <span className={`badge bg-${typeConfig[type]?.color || 'secondary'}`}>
            <i className={`bi bi-${typeConfig[type]?.icon || 'question-circle'} me-1`}></i>
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </span>
        );
      }
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (row) => {
        const status = row.row.original.status;
        return <StatusBadge status={status} type="inquiry" />;
      }
    },
    {
      header: 'Priority',
      accessorKey: 'priority',
      cell: (row) => {
        const priority = row.row.original.priority;
        const priorityConfig = {
          'high': 'danger',
          'normal': 'primary',
          'low': 'secondary'
        };
        
        return (
          <span className={`badge bg-${priorityConfig[priority] || 'secondary'}`}>
            {priority.charAt(0).toUpperCase() + priority.slice(1)}
          </span>
        );
      }
    },
    {
      header: 'Created',
      accessorKey: 'createdAt',
      cell: (row) => new Date(row.row.original.createdAt).toLocaleString()
    },
    {
      header: 'Assigned To',
      accessorKey: 'assignedTo',
      cell: (row) => row.row.original.assignedTo || <span className="text-muted">Unassigned</span>
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (row) => {
        const inquiry = row.row.original;
        return (
          <div className="btn-group">
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={() => handleViewInquiry(inquiry.id)}
              title="View Details"
            >
              <i className="bi bi-eye"></i>
            </button>
            
            <button
              className="btn btn-sm btn-outline-info"
              onClick={() => handleReply(inquiry.id)}
              title="Reply"
            >
              <i className="bi bi-reply"></i>
            </button>
            
            {!inquiry.assignedTo && (
              <button
                className="btn btn-sm btn-outline-success"
                onClick={() => handleAssign(inquiry.id)}
                title="Assign"
              >
                <i className="bi bi-person-plus"></i>
              </button>
            )}
            
            {inquiry.status === 'open' && (
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={() => handleStatusUpdate(inquiry.id, 'in-progress')}
                title="Mark In Progress"
              >
                <i className="bi bi-hourglass-split"></i>
              </button>
            )}
            
            {(inquiry.status === 'open' || inquiry.status === 'in-progress') && (
              <button
                className="btn btn-sm btn-outline-success"
                onClick={() => handleStatusUpdate(inquiry.id, 'resolved')}
                title="Mark Resolved"
              >
                <i className="bi bi-check-circle"></i>
              </button>
            )}
            
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={() => handleDelete(inquiry)}
              title="Delete"
            >
              <i className="bi bi-trash"></i>
            </button>
          </div>
        );
      }
    }
  ];
  
  return (
    <div className="inquiries-list-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Inquiries Management</h1>
      </div>
      
      {/* Stats Summary */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row">
            <div className="col-md-3">
              <div className="card bg-light h-100">
                <div className="card-body text-center">
                  <h3>{inquiries.length}</h3>
                  <p className="mb-0">Total Inquiries</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-danger text-white h-100">
                <div className="card-body text-center">
                  <h3>{inquiries.filter(i => i.status === 'open').length}</h3>
                  <p className="mb-0">Open</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-primary text-white h-100">
                <div className="card-body text-center">
                  <h3>{inquiries.filter(i => i.status === 'in-progress').length}</h3>
                  <p className="mb-0">In Progress</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-success text-white h-100">
                <div className="card-body text-center">
                  <h3>{inquiries.filter(i => i.status === 'resolved').length}</h3>
                  <p className="mb-0">Resolved</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="card">
        <div className="card-body">
          <div className="row mb-4">
            <div className="col-md-5">
              <SearchInput 
                placeholder="Search by ID, subject, customer..." 
                onSearch={handleSearch}
              />
            </div>
            <div className="col-md-7">
              <div className="d-flex justify-content-end gap-2">
                <div className="btn-group">
                  <button 
                    className="btn btn-outline-secondary dropdown-toggle" 
                    type="button"
                    data-bs-toggle="dropdown"
                  >
                    <i className="bi bi-funnel me-1"></i>
                    Status: {statusFilter === 'all' ? 'All' : statusFilter}
                  </button>
                  <ul className="dropdown-menu">
                    <li><button className="dropdown-item" onClick={() => handleStatusFilterChange('all')}>All</button></li>
                    <li><button className="dropdown-item" onClick={() => handleStatusFilterChange('open')}>Open</button></li>
                    <li><button className="dropdown-item" onClick={() => handleStatusFilterChange('in-progress')}>In Progress</button></li>
                    <li><button className="dropdown-item" onClick={() => handleStatusFilterChange('resolved')}>Resolved</button></li>
                  </ul>
                </div>
                
                <div className="btn-group">
                  <button 
                    className="btn btn-outline-secondary dropdown-toggle" 
                    type="button"
                    data-bs-toggle="dropdown"
                  >
                    <i className="bi bi-tag me-1"></i>
                    Type: {typeFilter === 'all' ? 'All' : typeFilter}
                  </button>
                  <ul className="dropdown-menu">
                    <li><button className="dropdown-item" onClick={() => handleTypeFilterChange('all')}>All Types</button></li>
                    <li><button className="dropdown-item" onClick={() => handleTypeFilterChange('complaint')}>Complaint</button></li>
                    <li><button className="dropdown-item" onClick={() => handleTypeFilterChange('information')}>Information</button></li>
                    <li><button className="dropdown-item" onClick={() => handleTypeFilterChange('refund')}>Refund</button></li>
                    <li><button className="dropdown-item" onClick={() => handleTypeFilterChange('technical')}>Technical</button></li>
                    <li><button className="dropdown-item" onClick={() => handleTypeFilterChange('quote')}>Quote</button></li>
                  </ul>
                </div>
                
                <div className="btn-group">
                  <button 
                    className="btn btn-outline-secondary dropdown-toggle" 
                    type="button"
                    data-bs-toggle="dropdown"
                  >
                    <i className="bi bi-flag me-1"></i>
                    Priority: {priorityFilter === 'all' ? 'All' : priorityFilter}
                  </button>
                  <ul className="dropdown-menu">
                    <li><button className="dropdown-item" onClick={() => handlePriorityFilterChange('all')}>All Priorities</button></li>
                    <li><button className="dropdown-item" onClick={() => handlePriorityFilterChange('high')}>High</button></li>
                    <li><button className="dropdown-item" onClick={() => handlePriorityFilterChange('normal')}>Normal</button></li>
                    <li><button className="dropdown-item" onClick={() => handlePriorityFilterChange('low')}>Low</button></li>
                  </ul>
                </div>
                
                <button className="btn btn-outline-secondary">
                  <i className="bi bi-download me-1"></i>
                  Export
                </button>
              </div>
            </div>
          </div>
          
          <DataTable
            columns={columns}
            data={filteredInquiries}
            pagination
            emptyMessage="No inquiries found matching the criteria"
            loading={loading}
          />
        </div>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        show={showDeleteConfirm}
        title="Confirm Deletion"
        message={`Are you sure you want to delete inquiry ${selectedInquiry?.id}? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
};

export default InquiriesList;
