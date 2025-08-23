class GoogleDriveService {
  constructor() {
    this.accessToken = null;
    this.folderId = '1DsmXWAtDtrZ4_aUvpaxXBENjO30tcHol'; // Your provided Google Drive folder ID
    this.isInitialized = false;
  }

  // Initialize Google API client with proper OAuth setup
  async initializeClient() {
    return new Promise((resolve, reject) => {
      // Wait for gapi to load
      const checkGapiLoaded = () => {
        if (window.gapi) {
          window.gapi.load('client:auth2', async () => {
            try {
              await window.gapi.client.init({
                apiKey: process.env.REACT_APP_GOOGLE_API_KEY,
                clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID,
                discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
                scope: 'https://www.googleapis.com/auth/drive.file'
              });
              
              this.isInitialized = true;
              console.log('✅ Google API client initialized successfully');
              console.log('📋 API Key:', process.env.REACT_APP_GOOGLE_API_KEY ? 'Present' : 'Missing');
              console.log('🔑 Client ID:', process.env.REACT_APP_GOOGLE_CLIENT_ID ? 'Present' : 'Missing');
              resolve();
            } catch (error) {
              console.error('❌ Google API initialization failed:', error);
              reject(error);
            }
          });
        } else {
          setTimeout(checkGapiLoaded, 100);
        }
      };
      checkGapiLoaded();
    });
  }

  // Authenticate user with proper error handling
  async authenticate() {
    try {
      if (!this.isInitialized) {
        await this.initializeClient();
      }

      const authInstance = window.gapi.auth2.getAuthInstance();
      
      if (!authInstance) {
        throw new Error('Google Auth instance not available');
      }
      
      // Check if user is already signed in
      if (authInstance.isSignedIn.get()) {
        const user = authInstance.currentUser.get();
        const authResponse = user.getAuthResponse();
        
        if (authResponse && authResponse.access_token) {
          this.accessToken = authResponse.access_token;
          console.log('✅ User already authenticated');
          return true;
        }
      }
      
      // Sign in user with explicit scope request
      console.log('🔐 Requesting user authentication...');
      try {
        const user = await authInstance.signIn({
          scope: 'https://www.googleapis.com/auth/drive.file',
          prompt: 'consent'
        });
        
        const authResponse = user.getAuthResponse();
        if (authResponse && authResponse.access_token) {
          this.accessToken = authResponse.access_token;
          console.log('✅ User authenticated successfully');
          console.log('🔑 Access token obtained:', !!this.accessToken);
          return true;
        } else {
          throw new Error('No access token received');
        }
      } catch (authError) {
        console.error('❌ Authentication error:', authError);
        
        // Try alternative authentication method
        return await this.alternativeAuth();
      }
    } catch (error) {
      console.error('❌ Authentication failed:', error);
      return false;
    }
  }

  // Alternative authentication method using popup
  async alternativeAuth() {
    try {
      console.log('🔄 Trying alternative authentication...');
      
      // Create a manual OAuth URL
      const params = new URLSearchParams({
        client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
        redirect_uri: window.location.origin,
        response_type: 'token',
        scope: 'https://www.googleapis.com/auth/drive.file',
        include_granted_scopes: 'true',
        state: 'drive_auth'
      });
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
      
      // Open popup for authentication
      const popup = window.open(
        authUrl,
        'google-auth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );
      
      return new Promise((resolve, reject) => {
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            
            // Check if we got token from URL fragment
            const urlParams = new URLSearchParams(window.location.hash.substring(1));
            const accessToken = urlParams.get('access_token');
            
            if (accessToken) {
              this.accessToken = accessToken;
              console.log('✅ Alternative authentication successful');
              resolve(true);
            } else {
              console.log('❌ Alternative authentication failed');
              resolve(false);
            }
          }
        }, 1000);
        
        // Timeout after 5 minutes
        setTimeout(() => {
          clearInterval(checkClosed);
          if (!popup.closed) {
            popup.close();
          }
          reject(new Error('Authentication timeout'));
        }, 300000);
      });
    } catch (error) {
      console.error('❌ Alternative authentication failed:', error);
      return false;
    }
  }

  // Upload file using Google Drive API v3 with new authentication
  async uploadFileWithFetch(fileBlob, fileName, mimeType = 'application/pdf') {
    try {
      if (!this.accessToken) {
        throw new Error('No access token available. Please authenticate first.');
      }

      console.log(`📋 Creating file metadata for: ${fileName}`);
      console.log(`📁 Target folder ID: ${this.folderId}`);
      console.log(`📄 File size: ${(fileBlob.size / 1024).toFixed(2)} KB`);
      
      // Use multipart upload to upload file with metadata in one request
      const boundary = '-------314159265358979323846';
      const delimiter = "\r\n--" + boundary + "\r\n";
      const close_delim = "\r\n--" + boundary + "--";

      const metadata = {
        name: fileName,
        parents: [this.folderId]
      };

      // Convert blob to base64
      const base64Data = await this.blobToBase64(fileBlob);
      const base64Content = base64Data.split(',')[1]; // Remove data:application/pdf;base64, prefix

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        `Content-Type: ${mimeType}\r\n` +
        'Content-Transfer-Encoding: base64\r\n\r\n' +
        base64Content +
        close_delim;

      console.log('🔧 Uploading file to Google Drive...');
      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': `multipart/related; boundary="${boundary}"`
        },
        body: multipartRequestBody
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Upload failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Failed to upload file: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const fileData = await response.json();
      console.log('✅ File uploaded successfully:', fileData);
      return fileData;
    } catch (error) {
      console.error('❌ Error uploading file:', error);
      throw error;
    }
  }

  // Helper method to convert blob to base64
  blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Get shareable link for uploaded file
  async getShareableLink(fileId) {
    try {
      console.log(`🔗 Creating shareable link for file: ${fileId}`);
      
      if (!this.accessToken) {
        throw new Error('No access token available');
      }
      
      // Make file public
      const permissionResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          role: 'reader',
          type: 'anyone'
        })
      });

      if (!permissionResponse.ok) {
        const errorText = await permissionResponse.text();
        console.warn(`⚠️ Failed to make file public: ${permissionResponse.status} - ${errorText}`);
        // Continue anyway, file might still be accessible to authenticated users
      } else {
        console.log('✅ File made publicly accessible');
      }

      // Return the direct file access link
      const directLink = `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
      console.log(`🔗 Generated shareable link: ${directLink}`);
      
      // Verify the link works by trying to get file metadata
      try {
        const metadataResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=name,id,webViewLink,webContentLink`, {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        });
        
        if (metadataResponse.ok) {
          const metadata = await metadataResponse.json();
          console.log('✅ File metadata verified:', metadata);
          return metadata.webViewLink || directLink;
        }
      } catch (metadataError) {
        console.warn('⚠️ Could not verify file metadata:', metadataError);
      }
      
      return directLink;
    } catch (error) {
      console.error('❌ Error creating shareable link:', error);
      // Return a basic link even if permission setting fails
      return `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
    }
  }

  // Complete upload process with shareable link
  async uploadAndShare(fileBlob, fileName) {
    try {
      // Ensure authentication first
      if (!this.accessToken) {
        const authenticated = await this.authenticate();
        if (!authenticated) {
          throw new Error('Authentication failed');
        }
      }

      const fileData = await this.uploadFileWithFetch(fileBlob, fileName);
      const shareableLink = await this.getShareableLink(fileData.id);
      
      return {
        fileId: fileData.id,
        fileName: fileData.name,
        shareableLink: shareableLink
      };
    } catch (error) {
      console.error('Error in complete upload process:', error);
      throw error;
    }
  }

  // Test method to verify connection
  async testConnection() {
    try {
      await this.initializeClient();
      const authenticated = await this.authenticate();
      
      if (!authenticated) {
        return { success: false, error: 'Authentication failed' };
      }

      // Test by creating a simple file
      const testContent = 'Test file for Google Drive connection';
      const testBlob = new Blob([testContent], { type: 'text/plain' });
      const result = await this.uploadAndShare(testBlob, `test_${Date.now()}.txt`);
      
      return {
        success: true,
        fileId: result.fileId,
        shareableLink: result.shareableLink
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default GoogleDriveService;
