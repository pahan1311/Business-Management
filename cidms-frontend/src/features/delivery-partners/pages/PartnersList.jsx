import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from '../../../utils/toast';
import DataTable from '../../../components/common/DataTable';
import SearchInput from '../../../components/common/SearchInput';
import ConfirmDialog from '../../../components/common/ConfirmDialog';

const PartnersList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [partners, setPartners] = useState([
    {
      id: 'DP-001',
      name: 'SpeedyShip Logistics',
      contactPerson: 'Michael Brown',
      email: 'contact@speedyship.com',
      phone: '(555) 123-4567',
      address: '123 Delivery Ave, Logistics City',
      activeDrivers: 15,
      status: 'active',
      areasCovered: ['North Zone', 'Central Zone'],
      contractStart: '2024-02-15',
      contractEnd: '2026-02-15'
    },
    {
      id: 'DP-002',
      name: 'FastTrack Delivery',
      contactPerson: 'Sarah Johnson',
      email: 'info@fasttrack.com',
      phone: '(555) 987-6543',
      address: '456 Express Blvd, Transit Town',
      activeDrivers: 8,
      status: 'active',
      areasCovered: ['South Zone', 'East Zone'],
      contractStart: '2024-01-10',
      contractEnd: '2025-12-31'
    },
    {
      id: 'DP-003',
      name: 'Urban Couriers Inc.',
      contactPerson: 'David Wilson',
      email: 'support@urbancouriers.com',
      phone: '(555) 456-7890',
      address: '789 Dispatch Road, Metro City',
      activeDrivers: 12,
      status: 'active',
      areasCovered: ['West Zone', 'Downtown'],
      contractStart: '2024-03-22',
      contractEnd: '2026-03-22'
    },
    {
      id: 'DP-004',
      name: 'Express Delivery Solutions',
      contactPerson: 'Jennifer Adams',
      email: 'info@expressdelivery.com',
      phone: '(555) 234-5678',
      address: '321 Quick Lane, Speedville',
      activeDrivers: 0,
      status: 'inactive',
      areasCovered: ['Suburban Areas'],
      contractStart: '2023-05-01',
      contractEnd: '2025-04-30'
    }
  ]);
  
  const [search, setSearch] = useState('');
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  
  const handleSearch = (term) => {
    setSearch(term);
  };
  
  const handleCreate = () => {
    // Navigate to partner creation form
    toast.info('Partner creation form would open here');
  };
  
  const handleEdit = (id) => {
    // Navigate to partner edit form
    toast.info(`Edit delivery partner with ID: ${id}`);
  };
  
  const handleDelete = (partner) => {
    setSelectedPartner(partner);
    setShowDeleteConfirm(true);
  };
  
  const confirmDelete = () => {
    // Delete partner logic
    const updatedList = partners.filter(partner => partner.id !== selectedPartner.id);
    setPartners(updatedList);
    toast.success(`Delivery partner ${selectedPartner.name} has been deleted`);
    setShowDeleteConfirm(false);
  };
  
  const handleStatusChange = (partner, status) => {
    setSelectedPartner(partner);
    setNewStatus(status);
    setShowStatusConfirm(true);
  };
  
  const confirmStatusChange = () => {
    // Update partner status
    const updatedList = partners.map(partner => {
      if (partner.id === selectedPartner.id) {
        return { ...partner, status: newStatus };
      }
      return partner;
    });
    
    setPartners(updatedList);
    toast.success(`${selectedPartner.name}'s status changed to ${newStatus}`);
    setShowStatusConfirm(false);
  };
  
  const handleViewDrivers = (partnerId) => {
    // Navigate to drivers list filtered by this partner
    toast.info(`View drivers for partner ID: ${partnerId}`);
  };
  
  // Filter partners based on search term
  const filteredPartners = partners.filter(partner => {
    if (!search) return true;
    
    const searchLower = search.toLowerCase();
    return (
      partner.name.toLowerCase().includes(searchLower) ||
      partner.contactPerson.toLowerCase().includes(searchLower) ||
      partner.email.toLowerCase().includes(searchLower) ||
      partner.id.toLowerCase().includes(searchLower)
    );
  });
  
  const columns = [
    {
      header: 'ID',
      accessorKey: 'id',
    },
    {
      header: 'Company',
      accessorKey: 'name',
    },
    {
      header: 'Contact Person',
      accessorKey: 'contactPerson',
    },
    {
      header: 'Email',
      accessorKey: 'email',
    },
    {
      header: 'Active Drivers',
      accessorKey: 'activeDrivers',
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (row) => (
        <span className={`badge bg-${row.row.original.status === 'active' ? 'success' : 'secondary'}`}>
          {row.row.original.status}
        </span>
      )
    },
    {
      header: 'Contract Ends',
      accessorKey: 'contractEnd',
      cell: (row) => new Date(row.row.original.contractEnd).toLocaleDateString()
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (row) => {
        const partner = row.row.original;
        return (
          <div className="btn-group">
            <button
              className="btn btn-sm btn-outline-info"
              onClick={() => handleViewDrivers(partner.id)}
              title="View Drivers"
            >
              <i className="bi bi-people"></i>
            </button>
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={() => handleEdit(partner.id)}
              title="Edit"
            >
              <i className="bi bi-pencil"></i>
            </button>
            {partner.status === 'active' ? (
              <button
                className="btn btn-sm btn-outline-warning"
                onClick={() => handleStatusChange(partner, 'inactive')}
                title="Deactivate"
              >
                <i className="bi bi-x-circle"></i>
              </button>
            ) : (
              <button
                className="btn btn-sm btn-outline-success"
                onClick={() => handleStatusChange(partner, 'active')}
                title="Activate"
              >
                <i className="bi bi-check-circle"></i>
              </button>
            )}
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={() => handleDelete(partner)}
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
    <div className="partners-list-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Delivery Partners Management</h1>
        <button 
          className="btn btn-primary" 
          onClick={handleCreate}
        >
          <i className="bi bi-building-add me-1"></i>
          Add New Partner
        </button>
      </div>
      
      <div className="card mb-4">
        <div className="card-body">
          <div className="row">
            <div className="col-md-3">
              <div className="card bg-light h-100">
                <div className="card-body text-center">
                  <h3>{partners.length}</h3>
                  <p className="mb-0">Total Partners</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-success text-white h-100">
                <div className="card-body text-center">
                  <h3>{partners.filter(p => p.status === 'active').length}</h3>
                  <p className="mb-0">Active Partners</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-secondary text-white h-100">
                <div className="card-body text-center">
                  <h3>{partners.filter(p => p.status === 'inactive').length}</h3>
                  <p className="mb-0">Inactive Partners</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-primary text-white h-100">
                <div className="card-body text-center">
                  <h3>{partners.reduce((acc, curr) => acc + curr.activeDrivers, 0)}</h3>
                  <p className="mb-0">Total Drivers</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="card">
        <div className="card-body">
          <div className="row mb-4">
            <div className="col-md-6">
              <SearchInput 
                placeholder="Search by company, contact or ID..." 
                onSearch={handleSearch}
              />
            </div>
            <div className="col-md-6">
              <div className="float-end">
                <div className="btn-group">
                  <button className="btn btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown">
                    <i className="bi bi-funnel me-1"></i>
                    Filter
                  </button>
                  <ul className="dropdown-menu">
                    <li><a className="dropdown-item" href="#">All Partners</a></li>
                    <li><a className="dropdown-item" href="#">Active Only</a></li>
                    <li><a className="dropdown-item" href="#">Inactive Only</a></li>
                    <li><hr className="dropdown-divider" /></li>
                    <li><a className="dropdown-item" href="#">Expiring Soon</a></li>
                  </ul>
                </div>
                <button className="btn btn-outline-secondary ms-2">
                  <i className="bi bi-download me-1"></i>
                  Export
                </button>
              </div>
            </div>
          </div>
          
          <DataTable
            columns={columns}
            data={filteredPartners}
            pagination
            emptyMessage="No delivery partners found"
            loading={loading}
          />
        </div>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        show={showDeleteConfirm}
        title="Confirm Deletion"
        message={`Are you sure you want to delete ${selectedPartner?.name}? All associated drivers will also be unassigned.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
      
      {/* Status Change Confirmation Dialog */}
      <ConfirmDialog
        show={showStatusConfirm}
        title="Confirm Status Change"
        message={`Are you sure you want to change ${selectedPartner?.name}'s status to ${newStatus}? ${newStatus === 'inactive' ? 'This will make all their drivers unavailable for new deliveries.' : ''}`}
        confirmLabel={newStatus === 'active' ? 'Activate' : 'Deactivate'}
        confirmVariant={newStatus === 'active' ? 'success' : 'warning'}
        onConfirm={confirmStatusChange}
        onCancel={() => setShowStatusConfirm(false)}
      />
    </div>
  );
};

export default PartnersList;
