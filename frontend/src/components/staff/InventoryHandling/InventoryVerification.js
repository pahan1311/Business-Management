import React, { useState, useEffect } from 'react';
import { apiService } from '../../../services/api';
import StatusBadge from '../../common/StatusBadge';
import { formatDate } from '../../../utils/helpers';

const InventoryVerification = () => {
  const [verificationData, setVerificationData] = useState([]);
  const [currentItem, setCurrentItem] = useState(null);
  const [verificationMode, setVerificationMode] = useState('manual'); // manual, barcode
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [discrepancies, setDiscrepancies] = useState([]);

  const [countForm, setCountForm] = useState({
    productId: '',
    expectedCount: 0,
    actualCount: 0,
    location: '',
    verifiedBy: '',
    notes: ''
  });

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    setLoading(true);
    try {
      const response = await apiService.get('/inventory/verification-list');
      setVerificationData(response.data);
    } catch (error) {
      console.error('Failed to fetch inventory data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScanProduct = async (barcode) => {
    try {
      setScanning(true);
      const response = await apiService.get(`/inventory/product/barcode/${barcode}`);
      const product = response.data;
      
      if (product) {
        setCurrentItem(product);
        setCountForm(prev => ({
          ...prev,
          productId: product.id,
          expectedCount: product.systemCount || 0
        }));
      } else {
        alert('Product not found');
      }
    } catch (error) {
      console.error('Failed to scan product:', error);
      alert('Failed to scan product');
    } finally {
      setScanning(false);
    }
  };

  const handleManualSearch = (searchValue) => {
    setSearchTerm(searchValue);
    const filtered = verificationData.filter(item =>
      item.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchValue.toLowerCase())
    );
    
    if (filtered.length === 1) {
      setCurrentItem(filtered[0]);
      setCountForm(prev => ({
        ...prev,
        productId: filtered[0].id,
        expectedCount: filtered[0].systemCount || 0
      }));
    }
  };

  const handleCountSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentItem) {
      alert('Please select a product first');
      return;
    }

    try {
      const verificationEntry = {
        ...countForm,
        productName: currentItem.name,
        productSku: currentItem.sku,
        timestamp: new Date().toISOString(),
        discrepancy: countForm.actualCount - countForm.expectedCount,
        status: countForm.actualCount === countForm.expectedCount ? 'verified' : 'discrepancy'
      };

      await apiService.post('/inventory/verification', verificationEntry);

      // Add to discrepancies if there's a difference
      if (verificationEntry.discrepancy !== 0) {
        setDiscrepancies(prev => [...prev, verificationEntry]);
      }

      // Update the verification data
      setVerificationData(prev => 
        prev.map(item => 
          item.id === currentItem.id 
            ? { ...item, verified: true, actualCount: countForm.actualCount }
            : item
        )
      );

      // Reset form
      setCurrentItem(null);
      setCountForm({
        productId: '',
        expectedCount: 0,
        actualCount: 0,
        location: '',
        verifiedBy: '',
        notes: ''
      });
      setSearchTerm('');

      alert('Verification recorded successfully!');
    } catch (error) {
      console.error('Failed to submit verification:', error);
      alert('Failed to submit verification');
    }
  };

  const getVerificationStats = () => {
    const total = verificationData.length;
    const verified = verificationData.filter(item => item.verified).length;
    const discrepancyCount = discrepancies.length;
    
    return {
      total,
      verified,
      remaining: total - verified,
      discrepancies: discrepancyCount,
      accuracy: total > 0 ? ((verified - discrepancyCount) / total * 100).toFixed(1) : 0
    };
  };

  const stats = getVerificationStats();

  return (
    <div className="container-fluid">
      {/* Header with Stats */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4>Inventory Verification</h4>
            <div className="btn-group">
              <button
                className={`btn ${verificationMode === 'manual' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setVerificationMode('manual')}
              >
                <i className="bi bi-keyboard me-2"></i>
                Manual
              </button>
              <button
                className={`btn ${verificationMode === 'barcode' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setVerificationMode('barcode')}
              >
                <i className="bi bi-qr-code-scan me-2"></i>
                Barcode
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="row">
            <div className="col-md-2">
              <div className="card text-center">
                <div className="card-body">
                  <h3 className="text-primary">{stats.total}</h3>
                  <small className="text-muted">Total Items</small>
                </div>
              </div>
            </div>
            <div className="col-md-2">
              <div className="card text-center">
                <div className="card-body">
                  <h3 className="text-success">{stats.verified}</h3>
                  <small className="text-muted">Verified</small>
                </div>
              </div>
            </div>
            <div className="col-md-2">
              <div className="card text-center">
                <div className="card-body">
                  <h3 className="text-warning">{stats.remaining}</h3>
                  <small className="text-muted">Remaining</small>
                </div>
              </div>
            </div>
            <div className="col-md-2">
              <div className="card text-center">
                <div className="card-body">
                  <h3 className="text-danger">{stats.discrepancies}</h3>
                  <small className="text-muted">Discrepancies</small>
                </div>
              </div>
            </div>
            <div className="col-md-2">
              <div className="card text-center">
                <div className="card-body">
                  <h3 className="text-info">{stats.accuracy}%</h3>
                  <small className="text-muted">Accuracy</small>
                </div>
              </div>
            </div>
            <div className="col-md-2">
              <div className="card text-center">
                <div className="card-body">
                  <div className="progress" style={{ height: '30px' }}>
                    <div 
                      className="progress-bar bg-success" 
                      style={{ width: `${(stats.verified / stats.total) * 100}%` }}
                    >
                      {Math.round((stats.verified / stats.total) * 100)}%
                    </div>
                  </div>
                  <small className="text-muted">Progress</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Verification Form */}
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                {verificationMode === 'manual' ? 'Manual Verification' : 'Barcode Verification'}
              </h5>
            </div>
            
            <div className="card-body">
              {/* Search/Scan Section */}
              {verificationMode === 'manual' ? (
                <div className="mb-4">
                  <label htmlFor="searchTerm" className="form-label">Search Product</label>
                  <input
                    type="text"
                    id="searchTerm"
                    className="form-control"
                    value={searchTerm}
                    onChange={(e) => handleManualSearch(e.target.value)}
                    placeholder="Search by product name or SKU..."
                  />
                </div>
              ) : (
                <div className="mb-4 text-center">
                  <button
                    className={`btn btn-lg ${scanning ? 'btn-warning' : 'btn-primary'}`}
                    onClick={() => handleScanProduct('dummy-barcode')}
                    disabled={scanning}
                  >
                    {scanning ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Scanning...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-qr-code-scan me-2"></i>
                        Scan Barcode
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Current Item Display */}
              {currentItem && (
                <div className="alert alert-info mb-4">
                  <div className="row">
                    <div className="col-md-8">
                      <h6>{currentItem.name}</h6>
                      <p className="mb-1"><strong>SKU:</strong> {currentItem.sku}</p>
                      <p className="mb-1"><strong>Category:</strong> {currentItem.category}</p>
                      <p className="mb-0"><strong>Expected Count:</strong> {currentItem.systemCount || 0} units</p>
                    </div>
                    <div className="col-md-4 text-end">
                      {currentItem.image && (
                        <img 
                          src={currentItem.image} 
                          alt={currentItem.name} 
                          className="img-thumbnail" 
                          style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Count Form */}
              {currentItem && (
                <form onSubmit={handleCountSubmit}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="actualCount" className="form-label">
                        Actual Count <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        id="actualCount"
                        name="actualCount"
                        className="form-control"
                        value={countForm.actualCount}
                        onChange={(e) => setCountForm(prev => ({
                          ...prev,
                          actualCount: parseInt(e.target.value) || 0
                        }))}
                        min="0"
                        required
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label htmlFor="location" className="form-label">Location</label>
                      <select
                        id="location"
                        name="location"
                        className="form-select"
                        value={countForm.location}
                        onChange={(e) => setCountForm(prev => ({
                          ...prev,
                          location: e.target.value
                        }))}
                      >
                        <option value="">Select location</option>
                        <option value="warehouse">Warehouse</option>
                        <option value="store">Store</option>
                        <option value="kitchen">Kitchen</option>
                        <option value="storage">Storage Room</option>
                        <option value="freezer">Freezer</option>
                        <option value="display">Display Area</option>
                      </select>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label htmlFor="verifiedBy" className="form-label">Verified By</label>
                      <input
                        type="text"
                        id="verifiedBy"
                        name="verifiedBy"
                        className="form-control"
                        value={countForm.verifiedBy}
                        onChange={(e) => setCountForm(prev => ({
                          ...prev,
                          verifiedBy: e.target.value
                        }))}
                        placeholder="Enter your name"
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Discrepancy</label>
                      <div className={`form-control-plaintext fw-bold ${
                        countForm.actualCount - countForm.expectedCount === 0 ? 'text-success' :
                        countForm.actualCount - countForm.expectedCount > 0 ? 'text-info' : 'text-danger'
                      }`}>
                        {countForm.actualCount - countForm.expectedCount > 0 ? '+' : ''}
                        {countForm.actualCount - countForm.expectedCount} units
                      </div>
                    </div>

                    <div className="col-12 mb-3">
                      <label htmlFor="notes" className="form-label">Notes</label>
                      <textarea
                        id="notes"
                        name="notes"
                        className="form-control"
                        rows="2"
                        value={countForm.notes}
                        onChange={(e) => setCountForm(prev => ({
                          ...prev,
                          notes: e.target.value
                        }))}
                        placeholder="Any additional notes about the count..."
                      />
                    </div>
                  </div>

                  <div className="d-flex justify-content-end">
                    <button
                      type="button"
                      className="btn btn-secondary me-2"
                      onClick={() => {
                        setCurrentItem(null);
                        setCountForm({
                          productId: '',
                          expectedCount: 0,
                          actualCount: 0,
                          location: '',
                          verifiedBy: '',
                          notes: ''
                        });
                        setSearchTerm('');
                      }}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      <i className="bi bi-check-lg me-2"></i>
                      Submit Verification
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Discrepancies Panel */}
        <div className="col-md-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-exclamation-triangle me-2"></i>
                Discrepancies ({discrepancies.length})
              </h5>
            </div>
            
            <div className="card-body">
              {discrepancies.length === 0 ? (
                <p className="text-muted text-center">No discrepancies found</p>
              ) : (
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {discrepancies.map((item, index) => (
                    <div key={index} className="border-bottom pb-2 mb-2">
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <h6 className="mb-1">{item.productName}</h6>
                          <p className="mb-1 text-muted small">SKU: {item.productSku}</p>
                          <div className="d-flex justify-content-between">
                            <span className="small">Expected: {item.expectedCount}</span>
                            <span className="small">Actual: {item.actualCount}</span>
                          </div>
                        </div>
                        <StatusBadge 
                          status={item.discrepancy > 0 ? 'overage' : 'shortage'} 
                          className="ms-2"
                        />
                      </div>
                      <div className={`text-end fw-bold ${item.discrepancy > 0 ? 'text-info' : 'text-danger'}`}>
                        {item.discrepancy > 0 ? '+' : ''}{item.discrepancy}
                      </div>
                      {item.notes && (
                        <small className="text-muted">{item.notes}</small>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card mt-3">
            <div className="card-header">
              <h6 className="mb-0">Quick Actions</h6>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                <button 
                  className="btn btn-outline-primary btn-sm"
                  onClick={fetchInventoryData}
                >
                  <i className="bi bi-arrow-clockwise me-2"></i>
                  Refresh Data
                </button>
                <button 
                  className="btn btn-outline-success btn-sm"
                  onClick={() => window.print()}
                >
                  <i className="bi bi-printer me-2"></i>
                  Print Report
                </button>
                <button 
                  className="btn btn-outline-info btn-sm"
                  onClick={() => {
                    const csvData = discrepancies.map(item => 
                      `${item.productName},${item.productSku},${item.expectedCount},${item.actualCount},${item.discrepancy}`
                    ).join('\n');
                    const blob = new Blob([csvData], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `discrepancies-${new Date().toISOString().split('T')[0]}.csv`;
                    a.click();
                  }}
                >
                  <i className="bi bi-download me-2"></i>
                  Export CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryVerification;
