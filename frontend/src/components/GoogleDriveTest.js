import React, { useState } from 'react';
import GoogleDriveService from '../services/googleDriveService';

const GoogleDriveTest = () => {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [driveService] = useState(() => new GoogleDriveService());

  const updateStatus = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    setStatus(prev => `${prev}\n[${timestamp}] ${icon} ${message}`);
  };

  const testAuthentication = async () => {
    setLoading(true);
    updateStatus('Testing Google Drive authentication...');
    
    try {
      const result = await driveService.authenticate();
      if (result) {
        updateStatus('Authentication successful!', 'success');
      } else {
        updateStatus('Authentication failed', 'error');
      }
    } catch (error) {
      updateStatus(`Authentication error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const testFileUpload = async () => {
    setLoading(true);
    updateStatus('Testing file upload to Google Drive...');
    
    try {
      // Create a test PDF blob
      const testContent = `Test PDF Content - Generated at ${new Date().toISOString()}`;
      const testBlob = new Blob([testContent], { type: 'application/pdf' });
      const fileName = `test-upload-${Date.now()}.pdf`;
      
      updateStatus(`Creating test file: ${fileName}`);
      updateStatus(`File size: ${testBlob.size} bytes`);
      
      const result = await driveService.uploadFile(testBlob, fileName, 'Test User');
      
      if (result.success) {
        updateStatus('File upload successful!', 'success');
        updateStatus(`File ID: ${result.fileId}`);
        updateStatus(`File URL: ${result.fileUrl}`);
      } else {
        updateStatus(`Upload failed: ${result.error}`, 'error');
      }
    } catch (error) {
      updateStatus(`Upload error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const testCompleteWorkflow = async () => {
    setLoading(true);
    updateStatus('Testing complete workflow (Auth + Upload)...');
    
    try {
      // Step 1: Authenticate
      updateStatus('Step 1: Authenticating...');
      const authResult = await driveService.authenticate();
      
      if (!authResult) {
        updateStatus('Authentication failed - cannot proceed', 'error');
        return;
      }
      
      updateStatus('Authentication successful', 'success');
      
      // Step 2: Upload test file
      updateStatus('Step 2: Uploading test file...');
      const testContent = `Complete Workflow Test\nGenerated: ${new Date().toISOString()}\nFolder: 1DsmXWAtDtrZ4_aUvpaxXBENjO30tcHol`;
      const testBlob = new Blob([testContent], { type: 'application/pdf' });
      const fileName = `workflow-test-${Date.now()}.pdf`;
      
      const uploadResult = await driveService.uploadFile(testBlob, fileName, 'Workflow Test User');
      
      if (uploadResult.success) {
        updateStatus('Complete workflow successful!', 'success');
        updateStatus(`✅ File uploaded: ${uploadResult.fileName}`);
        updateStatus(`✅ File ID: ${uploadResult.fileId}`);
        updateStatus(`✅ Shareable URL: ${uploadResult.fileUrl}`);
        updateStatus('🎉 QR codes can now use this URL!', 'success');
      } else {
        updateStatus(`Workflow failed at upload: ${uploadResult.error}`, 'error');
      }
      
    } catch (error) {
      updateStatus(`Workflow error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const clearStatus = () => {
    setStatus('');
  };

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-md-8">
          <h3>🧪 Google Drive Integration Test</h3>
          <p className="text-muted">Test the Google Drive authentication and file upload functionality</p>
          
          <div className="mb-3">
            <div className="btn-group me-2" role="group">
              <button 
                className="btn btn-primary" 
                onClick={testAuthentication}
                disabled={loading}
              >
                {loading ? '🔄 Testing...' : '🔐 Test Auth'}
              </button>
              
              <button 
                className="btn btn-secondary" 
                onClick={testFileUpload}
                disabled={loading}
              >
                {loading ? '🔄 Uploading...' : '📤 Test Upload'}
              </button>
              
              <button 
                className="btn btn-success" 
                onClick={testCompleteWorkflow}
                disabled={loading}
              >
                {loading ? '🔄 Testing...' : '🚀 Full Test'}
              </button>
            </div>
            
            <button 
              className="btn btn-outline-danger btn-sm" 
              onClick={clearStatus}
            >
              🗑️ Clear Log
            </button>
          </div>

          <div className="alert alert-info">
            <h6>📋 Test Information:</h6>
            <ul className="mb-0">
              <li><strong>Target Folder:</strong> 1DsmXWAtDtrZ4_aUvpaxXBENjO30tcHol</li>
              <li><strong>Authentication:</strong> Google OAuth 2.0 with popup</li>
              <li><strong>Upload Method:</strong> Google Drive API v3</li>
              <li><strong>File Sharing:</strong> Public read access</li>
            </ul>
          </div>

          {status && (
            <div className="mt-3">
              <h6>📊 Test Results:</h6>
              <pre className="bg-light p-3 border rounded" style={{ 
                maxHeight: '400px', 
                overflow: 'auto',
                fontSize: '0.9em',
                fontFamily: 'monospace'
              }}>
                {status}
              </pre>
            </div>
          )}
        </div>
        
        <div className="col-md-4">
          <div className="card">
            <div className="card-header">
              <h6>🔧 Troubleshooting</h6>
            </div>
            <div className="card-body">
              <h6>Common Issues:</h6>
              <ul className="small">
                <li><strong>403 Access Denied:</strong> Check OAuth redirect URIs in Google Cloud Console</li>
                <li><strong>Auth Popup Blocked:</strong> Allow popups for this site</li>
                <li><strong>Upload Failed:</strong> Verify folder permissions and API key</li>
                <li><strong>File Not Found:</strong> Check folder ID and sharing settings</li>
              </ul>
              
              <h6 className="mt-3">Expected Redirect URIs:</h6>
              <code className="small">
                http://localhost:3000<br/>
                storagerelay://http/localhost:3000
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleDriveTest;
