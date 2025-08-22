import React, { useState, useEffect } from 'react';
import { apiService } from '../../../services/api';
import StatusBadge from '../../common/StatusBadge';
import { formatDate, formatTime } from '../../../utils/helpers';

const OrderPrepStatus = ({ orderId }) => {
  const [order, setOrder] = useState(null);
  const [prepSteps, setPrepSteps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
      fetchPrepSteps();
    }
  }, [orderId]);

  useEffect(() => {
    if (order?.preparationStatus === 'preparing' && !timer) {
      startTimer();
    } else if (order?.preparationStatus !== 'preparing' && timer) {
      stopTimer();
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [order?.preparationStatus]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    try {
      const response = await apiService.get(`/orders/${orderId}`);
      setOrder(response.data);
    } catch (error) {
      console.error('Failed to fetch order details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrepSteps = async () => {
    try {
      const response = await apiService.get(`/orders/${orderId}/preparation-steps`);
      setPrepSteps(response.data);
    } catch (error) {
      console.error('Failed to fetch preparation steps:', error);
    }
  };

  const startTimer = () => {
    const startTime = new Date(order.preparationStartedAt || new Date());
    const interval = setInterval(() => {
      const now = new Date();
      const elapsed = Math.floor((now - startTime) / 1000);
      setElapsedTime(elapsed);
    }, 1000);
    setTimer(interval);
  };

  const stopTimer = () => {
    if (timer) {
      clearInterval(timer);
      setTimer(null);
    }
  };

  const formatElapsedTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStepComplete = async (stepId) => {
    try {
      await apiService.put(`/orders/${orderId}/preparation-steps/${stepId}`, {
        completed: true,
        completedAt: new Date().toISOString()
      });

      setPrepSteps(prev =>
        prev.map(step =>
          step.id === stepId
            ? { ...step, completed: true, completedAt: new Date().toISOString() }
            : step
        )
      );

      // Check if all steps are completed
      const updatedSteps = prepSteps.map(step =>
        step.id === stepId ? { ...step, completed: true } : step
      );
      
      const allCompleted = updatedSteps.every(step => step.completed);
      if (allCompleted) {
        await handleOrderComplete();
      }
    } catch (error) {
      console.error('Failed to complete step:', error);
      alert('Failed to complete step');
    }
  };

  const handleOrderComplete = async () => {
    try {
      await apiService.put(`/orders/${orderId}/preparation-status`, {
        status: 'ready',
        completedAt: new Date().toISOString()
      });

      setOrder(prev => ({
        ...prev,
        preparationStatus: 'ready',
        preparationCompletedAt: new Date().toISOString()
      }));

      stopTimer();
      alert('Order preparation completed!');
    } catch (error) {
      console.error('Failed to complete order:', error);
      alert('Failed to complete order');
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      await apiService.put(`/orders/${orderId}/preparation-status`, {
        status: newStatus,
        timestamp: new Date().toISOString()
      });

      setOrder(prev => ({
        ...prev,
        preparationStatus: newStatus
      }));

      if (newStatus === 'preparing') {
        setOrder(prev => ({
          ...prev,
          preparationStartedAt: new Date().toISOString()
        }));
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update status');
    }
  };

  const getProgressPercentage = () => {
    if (prepSteps.length === 0) return 0;
    const completedSteps = prepSteps.filter(step => step.completed).length;
    return (completedSteps / prepSteps.length) * 100;
  };

  const getEstimatedTimeRemaining = () => {
    const remainingSteps = prepSteps.filter(step => !step.completed);
    const totalEstimatedTime = remainingSteps.reduce((total, step) => total + (step.estimatedMinutes || 0), 0);
    return totalEstimatedTime;
  };

  const isOverdue = () => {
    if (!order?.requiredBy) return false;
    return new Date(order.requiredBy) < new Date() && order.preparationStatus !== 'ready';
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <i className="bi bi-search display-1 text-muted"></i>
          <h5 className="mt-3">Order not found</h5>
          <p className="text-muted">Please select an order to view its preparation status.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Order Header */}
      <div className="card mb-4">
        <div className="card-header">
          <div className="row align-items-center">
            <div className="col-md-8">
              <h5 className="mb-0">Order #{order.orderNumber}</h5>
              <small className="text-muted">Customer: {order.customer?.name}</small>
            </div>
            <div className="col-md-4 text-end">
              <StatusBadge status={order.preparationStatus} className="mb-2" />
              <br />
              <span className={`badge bg-${isOverdue() ? 'danger' : 'info'}`}>
                Due: {formatDate(order.requiredBy)}
              </span>
            </div>
          </div>
        </div>

        <div className="card-body">
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="fw-bold">Preparation Progress</span>
              <span className="text-muted">{Math.round(getProgressPercentage())}% Complete</span>
            </div>
            <div className="progress" style={{ height: '12px' }}>
              <div
                className={`progress-bar ${order.preparationStatus === 'ready' ? 'bg-success' : 'bg-info'}`}
                style={{ width: `${getProgressPercentage()}%` }}
              ></div>
            </div>
          </div>

          {/* Timer and Status */}
          <div className="row">
            <div className="col-md-3">
              <div className="text-center">
                <div className="display-6 fw-bold text-primary">
                  {formatElapsedTime(elapsedTime)}
                </div>
                <small className="text-muted">Elapsed Time</small>
              </div>
            </div>
            <div className="col-md-3">
              <div className="text-center">
                <div className="display-6 fw-bold text-warning">
                  {getEstimatedTimeRemaining()}
                </div>
                <small className="text-muted">Minutes Remaining</small>
              </div>
            </div>
            <div className="col-md-3">
              <div className="text-center">
                <div className="display-6 fw-bold text-success">
                  {prepSteps.filter(step => step.completed).length}
                </div>
                <small className="text-muted">Steps Completed</small>
              </div>
            </div>
            <div className="col-md-3">
              <div className="text-center">
                <div className="display-6 fw-bold text-info">
                  {prepSteps.length}
                </div>
                <small className="text-muted">Total Steps</small>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="d-flex justify-content-center mt-4 gap-2">
            {order.preparationStatus === 'pending' && (
              <button
                className="btn btn-primary"
                onClick={() => handleStatusUpdate('preparing')}
              >
                <i className="bi bi-play-fill me-2"></i>
                Start Preparation
              </button>
            )}
            {order.preparationStatus === 'preparing' && (
              <button
                className="btn btn-warning"
                onClick={() => handleStatusUpdate('pending')}
              >
                <i className="bi bi-pause-fill me-2"></i>
                Pause
              </button>
            )}
            {order.preparationStatus === 'preparing' && getProgressPercentage() === 100 && (
              <button
                className="btn btn-success"
                onClick={handleOrderComplete}
              >
                <i className="bi bi-check-lg me-2"></i>
                Mark as Ready
              </button>
            )}
            {order.preparationStatus === 'ready' && (
              <button
                className="btn btn-info"
                onClick={() => handleStatusUpdate('preparing')}
              >
                <i className="bi bi-arrow-clockwise me-2"></i>
                Reopen
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Preparation Steps */}
      <div className="row">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h6 className="mb-0">Preparation Steps</h6>
            </div>
            <div className="card-body">
              {prepSteps.length === 0 ? (
                <p className="text-muted text-center">No preparation steps defined for this order.</p>
              ) : (
                <div className="preparation-steps">
                  {prepSteps.map((step, index) => (
                    <div
                      key={step.id}
                      className={`d-flex align-items-start mb-3 p-3 border rounded ${
                        step.completed ? 'bg-light border-success' : ''
                      }`}
                    >
                      <div className="flex-shrink-0 me-3">
                        <div
                          className={`rounded-circle d-flex align-items-center justify-content-center ${
                            step.completed ? 'bg-success text-white' : 'bg-secondary text-white'
                          }`}
                          style={{ width: '40px', height: '40px' }}
                        >
                          {step.completed ? (
                            <i className="bi bi-check-lg"></i>
                          ) : (
                            <span>{index + 1}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex-grow-1">
                        <h6 className={step.completed ? 'text-decoration-line-through text-muted' : ''}>
                          {step.title}
                        </h6>
                        <p className={`mb-2 ${step.completed ? 'text-muted' : ''}`}>
                          {step.description}
                        </p>

                        <div className="d-flex justify-content-between align-items-center">
                          <div className="small text-muted">
                            {step.estimatedMinutes && (
                              <span className="me-3">
                                <i className="bi bi-clock me-1"></i>
                                {step.estimatedMinutes} min
                              </span>
                            )}
                            {step.category && (
                              <span className="me-3">
                                <i className="bi bi-tag me-1"></i>
                                {step.category}
                              </span>
                            )}
                            {step.assignedTo && (
                              <span>
                                <i className="bi bi-person me-1"></i>
                                {step.assignedTo}
                              </span>
                            )}
                          </div>

                          {!step.completed && order.preparationStatus === 'preparing' && (
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handleStepComplete(step.id)}
                            >
                              <i className="bi bi-check-lg me-1"></i>
                              Complete
                            </button>
                          )}
                        </div>

                        {step.completed && step.completedAt && (
                          <div className="small text-success mt-2">
                            <i className="bi bi-check-circle me-1"></i>
                            Completed at {formatTime(step.completedAt)}
                          </div>
                        )}

                        {step.notes && (
                          <div className="mt-2 p-2 bg-light rounded small">
                            <strong>Notes:</strong> {step.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Order Details Sidebar */}
        <div className="col-md-4">
          <div className="card mb-3">
            <div className="card-header">
              <h6 className="mb-0">Order Details</h6>
            </div>
            <div className="card-body">
              <div className="mb-2">
                <strong>Customer:</strong><br />
                {order.customer?.name}<br />
                {order.customer?.phone}<br />
                {order.customer?.email}
              </div>
              <div className="mb-2">
                <strong>Order Date:</strong> {formatDate(order.orderDate)}
              </div>
              <div className="mb-2">
                <strong>Required By:</strong> 
                <span className={isOverdue() ? 'text-danger fw-bold' : ''}>
                  {formatDate(order.requiredBy)}
                </span>
              </div>
              <div className="mb-2">
                <strong>Priority:</strong> 
                <span className={`badge bg-${
                  order.priority === 'urgent' ? 'danger' : 
                  order.priority === 'high' ? 'warning' : 'info'
                } ms-2`}>
                  {order.priority?.toUpperCase()}
                </span>
              </div>
              <div>
                <strong>Total:</strong> ${order.total?.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="card mb-3">
            <div className="card-header">
              <h6 className="mb-0">Order Items</h6>
            </div>
            <div className="card-body">
              {order.items?.map((item, index) => (
                <div key={index} className="d-flex justify-content-between align-items-center border-bottom py-2">
                  <div>
                    <div className="fw-bold">{item.name}</div>
                    <small className="text-muted">×{item.quantity}</small>
                  </div>
                  <div className="text-end">
                    <div>${(item.quantity * item.unitPrice).toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {order.specialInstructions && (
            <div className="card">
              <div className="card-header">
                <h6 className="mb-0">Special Instructions</h6>
              </div>
              <div className="card-body">
                <div className="bg-warning bg-opacity-10 p-3 rounded">
                  <i className="bi bi-exclamation-triangle text-warning me-2"></i>
                  {order.specialInstructions}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderPrepStatus;
