import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from '../../../utils/toast';
import DataTable from '../../../components/common/DataTable';
import SearchInput from '../../../components/common/SearchInput';
import ConfirmDialog from '../../../components/common/ConfirmDialog';

const StaffList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [staffList, setStaffList] = useState([
    {
      id: '1',
      name: 'John Doe',
      email: 'john.doe@example.com',
      role: 'Manager',
      department: 'Warehouse',
      status: 'active',
      joinedDate: '2024-05-15'
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      role: 'Supervisor',
      department: 'Inventory',
      status: 'active',
      joinedDate: '2024-06-10'
    },
    {
      id: '3',
      name: 'Mike Johnson',
      email: 'mike.johnson@example.com',
      role: 'Associate',
      department: 'Packaging',
      status: 'active',
      joinedDate: '2024-07-22'
    },
    {
      id: '4',
      name: 'Sarah Williams',
      email: 'sarah.williams@example.com',
      role: 'Associate',
      department: 'Customer Service',
      status: 'inactive',
      joinedDate: '2024-03-05'
    },
    {
      id: '5',
      name: 'Robert Brown',
      email: 'robert.brown@example.com',
      role: 'Manager',
      department: 'Shipping',
      status: 'active',
      joinedDate: '2024-01-18'
    }
  ]);
  
  const [search, setSearch] = useState('');
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  
  const handleSearch = (term) => {
    setSearch(term);
  };
  
  const handleCreate = () => {
    // Navigate to staff creation form or open modal
    toast.info('Staff creation form would open here');
  };
  
  const handleEdit = (id) => {
    // Navigate to staff edit form
    toast.info(`Edit staff member with ID: ${id}`);
  };
  
  const handleDelete = (staff) => {
    setSelectedStaff(staff);
    setShowDeleteConfirm(true);
  };
  
  const confirmDelete = () => {
    // Delete staff logic
    const updatedList = staffList.filter(staff => staff.id !== selectedStaff.id);
    setStaffList(updatedList);
    toast.success(`Staff member ${selectedStaff.name} has been deleted`);
    setShowDeleteConfirm(false);
  };
  
  const handleStatusChange = (staff, status) => {
    setSelectedStaff(staff);
    setNewStatus(status);
    setShowStatusConfirm(true);
  };
  
  const confirmStatusChange = () => {
    // Update staff status
    const updatedList = staffList.map(staff => {
      if (staff.id === selectedStaff.id) {
        return { ...staff, status: newStatus };
      }
      return staff;
    });
    
    setStaffList(updatedList);
    toast.success(`${selectedStaff.name}'s status changed to ${newStatus}`);
    setShowStatusConfirm(false);
  };
  
  // Filter staff based on search term
  const filteredStaff = staffList.filter(staff => {
    if (!search) return true;
    
    const searchLower = search.toLowerCase();
    return (
      staff.name.toLowerCase().includes(searchLower) ||
      staff.email.toLowerCase().includes(searchLower) ||
      staff.role.toLowerCase().includes(searchLower) ||
      staff.department.toLowerCase().includes(searchLower)
    );
  });
  
  const columns = [
    {
      header: 'Name',
      accessorKey: 'name',
    },
    {
      header: 'Email',
      accessorKey: 'email',
    },
    {
      header: 'Role',
      accessorKey: 'role',
    },
    {
      header: 'Department',
      accessorKey: 'department',
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
      header: 'Joined Date',
      accessorKey: 'joinedDate',
      cell: (row) => new Date(row.row.original.joinedDate).toLocaleDateString()
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (row) => {
        const staff = row.row.original;
        return (
          <div className="btn-group">
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={() => handleEdit(staff.id)}
              title="Edit"
            >
              <i className="bi bi-pencil"></i>
            </button>
            {staff.status === 'active' ? (
              <button
                className="btn btn-sm btn-outline-warning"
                onClick={() => handleStatusChange(staff, 'inactive')}
                title="Deactivate"
              >
                <i className="bi bi-x-circle"></i>
              </button>
            ) : (
              <button
                className="btn btn-sm btn-outline-success"
                onClick={() => handleStatusChange(staff, 'active')}
                title="Activate"
              >
                <i className="bi bi-check-circle"></i>
              </button>
            )}
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={() => handleDelete(staff)}
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
    <div className="staff-list-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Staff Management</h1>
        <button 
          className="btn btn-primary" 
          onClick={handleCreate}
        >
          <i className="bi bi-person-plus me-1"></i>
          Add New Staff
        </button>
      </div>
      
      <div className="card">
        <div className="card-body">
          <div className="row mb-4">
            <div className="col-md-6">
              <SearchInput 
                placeholder="Search by name, email, role or department..." 
                onSearch={handleSearch}
              />
            </div>
            <div className="col-md-6">
              <div className="float-end">
                <div className="btn-group">
                  <button className="btn btn-outline-secondary">
                    <i className="bi bi-funnel me-1"></i>
                    Filter
                  </button>
                  <button className="btn btn-outline-secondary">
                    <i className="bi bi-download me-1"></i>
                    Export
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <DataTable
            columns={columns}
            data={filteredStaff}
            pagination
            emptyMessage="No staff members found"
            loading={loading}
          />
        </div>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        show={showDeleteConfirm}
        title="Confirm Deletion"
        message={`Are you sure you want to delete ${selectedStaff?.name}? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
      
      {/* Status Change Confirmation Dialog */}
      <ConfirmDialog
        show={showStatusConfirm}
        title="Confirm Status Change"
        message={`Are you sure you want to change ${selectedStaff?.name}'s status to ${newStatus}?`}
        confirmLabel={newStatus === 'active' ? 'Activate' : 'Deactivate'}
        confirmVariant={newStatus === 'active' ? 'success' : 'warning'}
        onConfirm={confirmStatusChange}
        onCancel={() => setShowStatusConfirm(false)}
      />
    </div>
  );
};

export default StaffList;
