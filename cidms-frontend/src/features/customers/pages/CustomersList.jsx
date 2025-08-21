import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGetCustomersQuery, useDeleteCustomerMutation } from '../api';
import DataTable from '../../../components/common/DataTable';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import { formatDate, formatPhoneNumber } from '../../../utils/format';
import { useSnackbar } from 'notistack';

const CustomersList = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  
  const { data, isLoading, error, refetch } = useGetCustomersQuery({
    page,
    limit: 25,
    search,
  });

  const [deleteCustomer, { isLoading: isDeleting }] = useDeleteCustomerMutation();

  const columns = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (value) => formatPhoneNumber(value),
    },
    {
      key: 'totalOrders',
      label: 'Total Orders',
      render: (value) => value || 0,
    },
    {
      key: 'lastOrderAt',
      label: 'Last Order',
      render: (value) => value ? formatDate(value) : 'Never',
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, customer) => (
        <div className="btn-group" role="group">
          <Link
            to={`/admin/customers/${customer.id}`}
            className="btn btn-sm btn-outline-primary"
          >
            <i className="bi bi-eye"></i>
          </Link>
          <Link
            to={`/admin/customers/${customer.id}/edit`}
            className="btn btn-sm btn-outline-secondary"
          >
            <i className="bi bi-pencil"></i>
          </Link>
          <button
            className="btn btn-sm btn-outline-danger"
            onClick={() => setDeleteId(customer.id)}
          >
            <i className="bi bi-trash"></i>
          </button>
        </div>
      ),
    },
  ];

  const handleDelete = async () => {
    try {
      await deleteCustomer(deleteId).unwrap();
      enqueueSnackbar('Customer deleted successfully', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Failed to delete customer', { variant: 'error' });
    }
  };

  const handleRowClick = (customer) => {
    navigate(`/admin/customers/${customer.id}`);
  };

  const actions = (
    <Link to="/admin/customers/new" className="btn btn-primary">
      <i className="bi bi-plus-circle me-2"></i>
      Add Customer
    </Link>
  );

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">Customers</h1>
      </div>

      <DataTable
        data={data?.data || []}
        columns={columns}
        loading={isLoading}
        pagination={{
          currentPage: page,
          totalPages: data?.totalPages || 1,
          total: data?.total || 0,
        }}
        onPageChange={setPage}
        onSearch={setSearch}
        onRowClick={handleRowClick}
        searchable
        actions={actions}
      />

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Customer"
        message="Are you sure you want to delete this customer? This action cannot be undone."
        variant="danger"
      />
    </div>
  );
};

export default CustomersList;
