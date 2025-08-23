# Google Drive PDF Upload Setup Instructions

## Overview
This implementation adds PDF generation and Google Drive upload functionality to your delivery management system. When users click the PDF button, the system will:

1. Generate a comprehensive PDF report with delivery details
2. Upload the PDF to your specified Google Drive folder
3. Generate a QR code that links to the uploaded PDF
4. Display the QR code for easy access

## Setup Requirements

### 1. Google Cloud Project Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Drive API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Drive API"
   - Click "Enable"

### 2. Create Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the API key and save it
4. Click "Create Credentials" > "OAuth 2.0 Client ID"
5. Configure the OAuth consent screen if prompted
6. Choose "Web application" as the application type
7. Add your domain to "Authorized JavaScript origins":
   - For development: `http://localhost:3000`
   - For production: your actual domain
8. Copy the Client ID and save it

### 3. Configure Environment Variables

Update your `frontend/.env` file with the credentials:

```properties
# Google Drive API Configuration
REACT_APP_GOOGLE_API_KEY=your_actual_api_key_here
REACT_APP_GOOGLE_CLIENT_ID=your_actual_client_id_here
```

Replace `your_actual_api_key_here` and `your_actual_client_id_here` with the actual values from Google Cloud Console.

### 4. Google Drive Folder Setup

The system is configured to upload PDFs to this folder:
https://drive.google.com/drive/folders/1DsmXWAtDtrZ4_aUvpaxXBENjO30tcHol?usp=sharing

Make sure:
1. The folder exists and is accessible
2. You have write permissions to the folder
3. The folder is either public or shared with the users who will upload PDFs

## How It Works

### PDF Generation
- Uses jsPDF library to create professional PDF reports
- Includes delivery information, customer details, order items, and timeline
- Automatically formatted with proper headers and styling

### Google Drive Integration
- Authenticates users with Google OAuth 2.0
- Uploads PDF files to the specified Drive folder
- Makes files publicly accessible with shareable links
- Generates QR codes that point to the uploaded PDF

### QR Code Generation
- Creates QR codes that link directly to the Google Drive file
- QR codes can be scanned to instantly access the PDF report
- Includes backup local download if upload fails

## Usage Instructions

1. Navigate to the Order Management > Deliveries tab
2. Find the delivery you want to generate a report for
3. Click the PDF icon button (📄) in the Actions column
4. The system will:
   - Generate a comprehensive PDF report
   - Show an authentication popup for Google Drive (first time only)
   - Upload the PDF to Google Drive
   - Display a QR code for accessing the file
5. Share the QR code with delivery personnel or customers

## Demo Mode

Currently, the system includes a demo mode that:
- Generates PDFs successfully
- Simulates the Google Drive upload process
- Shows what the final implementation will look like
- Downloads PDFs locally as a fallback

To enable real Google Drive uploads, uncomment the real implementation in `deliveryPDFManager.js`.

## Troubleshooting

### Authentication Issues
- Make sure your domain is added to authorized origins
- Check that API key and Client ID are correctly set
- Verify that Google Drive API is enabled

### Upload Failures
- Check folder permissions
- Verify folder ID is correct
- Ensure internet connectivity

### PDF Generation Issues
- Check browser console for errors
- Verify all required data is available
- Try with different delivery records

## Security Notes

- API keys should never be committed to version control
- Use environment variables for all credentials
- Consider implementing server-side upload for production
- Regularly rotate API keys and credentials

## File Structure

```
frontend/src/services/
├── pdfService.js           # PDF generation logic
├── googleDriveService.js   # Google Drive API integration
└── deliveryPDFManager.js   # Main orchestrator service
```

## Testing

1. Test PDF generation with various delivery types
2. Verify Google Drive authentication flow
3. Test QR code generation and scanning
4. Confirm file permissions and sharing
5. Test fallback behavior when offline

## Production Deployment

For production deployment:
1. Set up proper domain credentials
2. Configure HTTPS for secure authentication
3. Implement proper error handling and logging
4. Consider server-side PDF generation for better security
5. Set up monitoring for API quota usage
