import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from '../../../utils/toast';
import LoadingBlock from '../../../components/common/LoadingBlock';
import StatusBadge from '../../../components/common/StatusBadge';
import DataTable from '../../../components/common/DataTable';
import { Chart } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const DeliveryDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [deliveryStats, setDeliveryStats] = useState({
    today: 0,
    completed: 0,
    pending: 0,
    delayed: 0
  });
  const [todayDeliveries, setTodayDeliveries] = useState([]);
  const [performanceData, setPerformanceData] = useState({
    labels: [],
    datasets: []
  });

  // Load mock data
  useEffect(() => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      const mockTodayDeliveries = [
        {
          id: 'DEL-2025-001',
          orderNumber: 'ORD-2025-122',
          customer: 'John Doe',
          address: '123 Main St, Cityville',
          scheduledTime: '14:30',
          status: 'assigned',
          priority: 'normal'
        },
        {
          id: 'DEL-2025-002',
          orderNumber: 'ORD-2025-135',
          customer: 'Jane Smith',
          address: '456 Oak Ave, Townburg',
          scheduledTime: '16:00',
          status: 'picked-up',
          priority: 'high'
        },
        {
          id: 'DEL-2025-005',
          orderNumber: 'ORD-2025-159',
          customer: 'Mike Wilson',
          address: '789 Elm St, Villagetown',
          scheduledTime: '10:15',
          status: 'delivered',
          priority: 'normal'
        }
      ];

      const mockStats = {
        today: 8,
        completed: 3,
        pending: 4,
        delayed: 1
      };

      // Mock performance data for charts
      const mockPerformanceData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
          {
            label: 'Deliveries',
            data: [5, 7, 4, 6, 8, 3, 8],
            backgroundColor: 'rgba(53, 162, 235, 0.5)',
            borderColor: 'rgb(53, 162, 235)',
            borderWidth: 1
          }
        ]
      };

      setTodayDeliveries(mockTodayDeliveries);
      setDeliveryStats(mockStats);
      setPerformanceData(mockPerformanceData);
      setLoading(false);
    }, 1200);
  }, []);

  const handleViewDelivery = (id) => {
    navigate(`/delivery/deliveries/${id}`);
  };

  const handleViewAssigned = () => {
    navigate('/delivery/assigned');
  };

  const handleScanQR = () => {
    navigate('/delivery/scan');
  };

  const handleReportIssue = (id) => {
    navigate('/delivery/issue-report', { state: { deliveryId: id } });
  };

  if (loading) {
    return <LoadingBlock text="Loading dashboard data..." />;
  }

  // Chart options
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Weekly Delivery Performance',
      },
    },
  };

  // Donut chart data for delivery status
  const statusChartData = {
    labels: ['Completed', 'Pending', 'Delayed'],
    datasets: [
      {
        data: [deliveryStats.completed, deliveryStats.pending, deliveryStats.delayed],
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const deliveryColumns = [
    {
      header: 'Order #',
      accessorKey: 'orderNumber',
    },
    {
      header: 'Customer',
      accessorKey: 'customer',
    },
    {
      header: 'Time',
      accessorKey: 'scheduledTime',
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
      header: '',
      cell: (row) => (
        <div className="btn-group">
          <button 
            className="btn btn-sm btn-outline-primary"
            onClick={() => handleViewDelivery(row.row.original.id)}
          >
            <i className="bi bi-eye"></i>
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="delivery-dashboard">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Delivery Dashboard</h1>
        <div className="btn-group">
          <button 
            className="btn btn-primary" 
            onClick={handleViewAssigned}
          >
            <i className="bi bi-truck me-1"></i>
            My Deliveries
          </button>
          <button 
            className="btn btn-success" 
            onClick={handleScanQR}
          >
            <i className="bi bi-qr-code-scan me-1"></i>
            Scan QR
          </button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <div className="card bg-primary text-white h-100">
            <div className="card-body">
              <h5 className="card-title">Today's Tasks</h5>
              <h2>{deliveryStats.today}</h2>
              <p>Deliveries scheduled for today</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-success text-white h-100">
            <div className="card-body">
              <h5 className="card-title">Completed</h5>
              <h2>{deliveryStats.completed}</h2>
              <p>Successfully delivered packages</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-info text-white h-100">
            <div className="card-body">
              <h5 className="card-title">Pending</h5>
              <h2>{deliveryStats.pending}</h2>
              <p>Deliveries waiting to be completed</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-warning text-white h-100">
            <div className="card-body">
              <h5 className="card-title">Delayed</h5>
              <h2>{deliveryStats.delayed}</h2>
              <p>Deliveries with reported issues</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Delivery Schedule & Charts */}
      <div className="row g-4">
        <div className="col-md-7">
          <div className="card h-100">
            <div className="card-header bg-light">
              <h5 className="mb-0">
                <i className="bi bi-calendar-check me-2"></i>
                Today's Delivery Schedule
              </h5>
            </div>
            <div className="card-body">
              <DataTable
                columns={deliveryColumns}
                data={todayDeliveries}
                pagination={false}
                searchable={false}
                emptyMessage="No deliveries scheduled for today"
              />
            </div>
            <div className="card-footer bg-light">
              <button
                className="btn btn-outline-primary"
                onClick={handleViewAssigned}
              >
                View All Assigned Deliveries
              </button>
            </div>
          </div>
        </div>
        
        <div className="col-md-5">
          <div className="card h-100">
            <div className="card-header bg-light">
              <h5 className="mb-0">
                <i className="bi bi-pie-chart me-2"></i>
                Delivery Status
              </h5>
            </div>
            <div className="card-body">
              <div style={{ height: '200px' }}>
                <Chart type="doughnut" data={statusChartData} options={{
                  maintainAspectRatio: false,
                  cutout: '70%',
                  plugins: {
                    legend: {
                      position: 'bottom'
                    }
                  }
                }} />
              </div>
            </div>
            <div className="card-footer bg-light text-center">
              <div className="row">
                <div className="col-4">
                  <small className="text-success d-block">Completed</small>
                  <strong>{deliveryStats.completed}</strong>
                </div>
                <div className="col-4">
                  <small className="text-primary d-block">Pending</small>
                  <strong>{deliveryStats.pending}</strong>
                </div>
                <div className="col-4">
                  <small className="text-warning d-block">Delayed</small>
                  <strong>{deliveryStats.delayed}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Weekly Performance Chart */}
        <div className="col-md-12">
          <div className="card">
            <div className="card-header bg-light">
              <h5 className="mb-0">
                <i className="bi bi-graph-up me-2"></i>
                Weekly Performance
              </h5>
            </div>
            <div className="card-body">
              <div style={{ height: '250px' }}>
                <Chart type="bar" data={performanceData} options={chartOptions} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryDashboard;
