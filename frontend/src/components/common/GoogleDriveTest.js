import React, { useState } from 'react';
import DeliveryPDFManager from '../../services/deliveryPDFManager';

const GoogleDriveTest = () => {
  const [testResult, setTestResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const testGoogleDrive = async () => {
    setIsLoading(true);
    setTestResult(null);
    
    try {
      const googleDriveService = new (await import('../../services/googleDriveService')).default();
      const result = await googleDriveService.testConnection();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        error: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testPDFGeneration = async () => {
    setIsLoading(true);
    setTestResult(null);
    
    try {
      const pdfManager = new DeliveryPDFManager();
      
      // Test data
      const testOrderData = {
        _id: 'test123',
        orderNumber: 'TEST-001',
        customer: {
          name: 'Test Customer',
          email: 'test@example.com',
          phone: '123-456-7890'
        },
        items: [
          {
            name: 'Test Product',
            quantity: 2,
            price: 25.00
          }
        ],
        totalAmount: 50.00,
        status: 'confirmed',
        createdAt: new Date().toISOString()
      };

      const testAssignedPerson = {
        name: 'Test Delivery Person',
        phone: '987-654-3210',
        email: 'delivery@example.com'
      };

      const result = await pdfManager.createOrderPDFWithQR(testOrderData, testAssignedPerson);
      setTestResult(result);
      
    } catch (error) {
      setTestResult({
        success: false,
        error: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h5>Google Drive Test</h5>
      </div>
      <div className="card-body">
        <div className="mb-3">
          <button 
            className="btn btn-primary me-2" 
            onClick={testGoogleDrive}
            disabled={isLoading}
          >
            {isLoading ? 'Testing...' : 'Test Google Drive Connection'}
          </button>
          <button 
            className="btn btn-success" 
            onClick={testPDFGeneration}
            disabled={isLoading}
          >
            {isLoading ? 'Generating...' : 'Test PDF Generation & Upload'}
          </button>
        </div>

        {testResult && (
          <div className={`alert ${testResult.success ? 'alert-success' : 'alert-danger'}`}>
            <h6>Test Result:</h6>
            <pre>{JSON.stringify(testResult, null, 2)}</pre>
            
            {testResult.success && testResult.shareableLink && (
              <div className="mt-3">
                <a 
                  href={testResult.shareableLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-link"
                >
                  🔗 Open Google Drive Link
                </a>
              </div>
            )}
          </div>
        )}

        <div className="mt-3">
          <h6>Environment Check:</h6>
          <ul>
            <li>API Key: {process.env.REACT_APP_GOOGLE_API_KEY ? '✅ Present' : '❌ Missing'}</li>
            <li>Client ID: {process.env.REACT_APP_GOOGLE_CLIENT_ID ? '✅ Present' : '❌ Missing'}</li>
            <li>Google API Loaded: {window.gapi ? '✅ Yes' : '❌ No'}</li>
            <li>Google Identity Services: {window.google ? '✅ Yes' : '❌ No'}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default GoogleDriveTest;
