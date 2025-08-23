class GoogleDriveService {
  constructor() {
    this.accessToken = null;
    this.folderId = '1DsmXWAtDtrZ4_aUvpaxXBENjO30tcHol'; // Your provided Google Drive folder ID
  }

  // Initialize Google API client
  async initializeClient() {
    return new Promise((resolve, reject) => {
      // Check if Google API is loaded
      if (!window.gapi) {
        reject(new Error('Google API not loaded. Make sure to include the Google API script in your HTML.'));
        return;
      }

      window.gapi.load('client:auth2', async () => {
        try {
          await window.gapi.client.init({
            apiKey: process.env.REACT_APP_GOOGLE_API_KEY,
            clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID,
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
            scope: 'https://www.googleapis.com/auth/drive.file'
          });
          
          console.log('✅ Google API client initialized successfully');
          resolve();
        } catch (error) {
          console.error('❌ Google API initialization failed:', error);
          reject(error);
        }
      });
    });
  }

  // Authenticate user
  async authenticate() {
    try {
      const authInstance = window.gapi.auth2.getAuthInstance();
      
      // Check if user is already signed in
      if (authInstance.isSignedIn.get()) {
        const user = authInstance.currentUser.get();
        this.accessToken = user.getAuthResponse().access_token;
        console.log('✅ User already authenticated');
        return true;
      }
      
      // Sign in user
      console.log('🔐 Requesting user authentication...');
      const user = await authInstance.signIn();
      this.accessToken = user.getAuthResponse().access_token;
      console.log('✅ User authenticated successfully');
      return true;
    } catch (error) {
      console.error('❌ Authentication failed:', error);
      return false;
    }
  }

  // Upload file to Google Drive
  async uploadFile(fileBlob, fileName, mimeType = 'application/pdf') {
    try {
      // If no access token, try to authenticate
      if (!this.accessToken) {
        const authenticated = await this.authenticate();
        if (!authenticated) {
          throw new Error('Authentication failed');
        }
      }

      const boundary = '-------314159265358979323846';
      const delimiter = "\r\n--" + boundary + "\r\n";
      const close_delim = "\r\n--" + boundary + "--";

      const metadata = {
        'name': fileName,
        'parents': [this.folderId]
      };

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: ' + mimeType + '\r\n\r\n';

      const request = new XMLHttpRequest();
      
      return new Promise((resolve, reject) => {
        request.onload = function() {
          if (request.status === 200) {
            const response = JSON.parse(request.responseText);
            resolve(response);
          } else {
            reject(new Error(`Upload failed: ${request.statusText}`));
          }
        };

        request.onerror = function() {
          reject(new Error('Network error during upload'));
        };

        request.open('POST', 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart');
        request.setRequestHeader('Authorization', 'Bearer ' + this.accessToken);
        request.setRequestHeader('Content-Type', 'multipart/related; boundary="' + boundary + '"');

        // Convert blob to array buffer
        const reader = new FileReader();
        reader.onload = function() {
          const arrayBuffer = reader.result;
          const uint8Array = new Uint8Array(arrayBuffer);
          const binaryString = String.fromCharCode.apply(null, uint8Array);
          
          const requestBody = multipartRequestBody + binaryString + close_delim;
          request.send(requestBody);
        };
        reader.readAsArrayBuffer(fileBlob);
      });

    } catch (error) {
      console.error('Error uploading file to Google Drive:', error);
      throw error;
    }
  }

  // Alternative upload method using fetch API
  async uploadFileWithFetch(fileBlob, fileName, mimeType = 'application/pdf') {
    try {
      if (!this.accessToken) {
        throw new Error('No access token available');
      }

      console.log(`📋 Creating file metadata for: ${fileName}`);
      
      // First, create metadata
      const metadata = {
        name: fileName,
        parents: [this.folderId]
      };

      // Create the file on Google Drive
      const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(metadata)
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        throw new Error(`Failed to create file: ${createResponse.status} ${createResponse.statusText} - ${errorText}`);
      }

      const fileData = await createResponse.json();
      const fileId = fileData.id;
      
      console.log(`📄 File created with ID: ${fileId}`);
      console.log(`📤 Uploading file content (${(fileBlob.size / 1024).toFixed(2)} KB)...`);

      // Upload the actual content
      const uploadResponse = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': mimeType
        },
        body: fileBlob
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Failed to upload file content: ${uploadResponse.status} ${uploadResponse.statusText} - ${errorText}`);
      }

      console.log('✅ File content uploaded successfully');
      return fileData;
    } catch (error) {
      console.error('❌ Error uploading file with fetch:', error);
      throw error;
    }
  }

  // Get shareable link for uploaded file
  async getShareableLink(fileId) {
    try {
      console.log(`🔗 Creating shareable link for file: ${fileId}`);
      
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
        // Continue anyway, file might still be accessible
      } else {
        console.log('✅ File made publicly accessible');
      }

      // Return the direct file access link
      const directLink = `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
      console.log(`🔗 Generated shareable link: ${directLink}`);
      
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
}

export default GoogleDriveService;
