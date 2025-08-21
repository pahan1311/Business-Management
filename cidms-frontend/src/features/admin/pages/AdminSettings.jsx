import { useState, useEffect } from 'react';
import { useSnackbar } from 'notistack';
import LoadingBlock from '../../../components/common/LoadingBlock';
import PasswordChangeForm from '../../../components/common/PasswordChangeForm';

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    general: {
      siteName: 'CIDMS',
      siteDescription: 'Customer Inventory Delivery Management System',
      contactEmail: 'admin@cidms.com',
      contactPhone: '+1-234-567-8900',
      timezone: 'America/New_York',
      currency: 'USD',
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      orderStatusUpdates: true,
      lowStockAlerts: true,
      deliveryUpdates: true,
      inquiryNotifications: true,
      systemMaintenanceAlerts: true,
    },
    business: {
      businessName: 'CIDMS Corporation',
      businessAddress: '123 Business St, City, State 12345',
      taxRate: 8.5,
      deliveryRadius: 25,
      minimumOrderAmount: 50.00,
      freeDeliveryThreshold: 100.00,
    },
    security: {
      passwordMinLength: 8,
      requireTwoFactor: false,
      sessionTimeout: 60,
      maxLoginAttempts: 5,
      lockoutDuration: 30,
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState({});

  const { enqueueSnackbar } = useSnackbar();

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would fetch from the API
      // const response = await fetch('/api/settings');
      // const data = await response.json();
      // setSettings(data);
      
      // For now, using mock data
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    } catch (error) {
      enqueueSnackbar('Failed to load settings', { variant: 'error' });
      setIsLoading(false);
    }
  };

  const saveSection = async (section) => {
    setIsSaving(prev => ({ ...prev, [section]: true }));
    
    try {
      // In a real app, this would save to the API
      // await fetch(`/api/settings/${section}`, {
      //   method: 'PUT',
      //   body: JSON.stringify(settings[section])
      // });
      
      // Mock save
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      enqueueSnackbar(`${section.charAt(0).toUpperCase() + section.slice(1)} settings saved successfully`, { 
        variant: 'success' 
      });
    } catch (error) {
      enqueueSnackbar(`Failed to save ${section} settings`, { variant: 'error' });
    } finally {
      setIsSaving(prev => ({ ...prev, [section]: false }));
    }
  };

  const updateSetting = (section, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const handlePasswordChange = async (passwordData) => {
    try {
      // In a real app, this would call the password change API
      // await fetch('/api/auth/change-password', {
      //   method: 'POST',
      //   body: JSON.stringify(passwordData)
      // });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      enqueueSnackbar('Password changed successfully', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Failed to change password', { variant: 'error' });
      throw error;
    }
  };

  if (isLoading) return <LoadingBlock text="Loading settings..." />;

  const tabs = [
    { id: 'general', label: 'General', icon: 'gear' },
    { id: 'notifications', label: 'Notifications', icon: 'bell' },
    { id: 'business', label: 'Business', icon: 'building' },
    { id: 'security', label: 'Security', icon: 'shield-check' },
    { id: 'password', label: 'Change Password', icon: 'key' },
  ];

  return (
    <div className="admin-settings">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Settings</h1>
        <button className="btn btn-outline-secondary" onClick={loadSettings}>
          <i className="bi bi-arrow-clockwise me-2"></i>
          Refresh
        </button>
      </div>

      <div className="row">
        {/* Navigation Tabs */}
        <div className="col-md-3">
          <div className="nav flex-column nav-pills" role="tablist">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`nav-link ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                type="button"
              >
                <i className={`bi bi-${tab.icon} me-2`}></i>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Settings Content */}
        <div className="col-md-9">
          <div className="tab-content">
            
            {/* General Settings */}
            {activeTab === 'general' && (
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">General Settings</h5>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="form-floating">
                        <input
                          type="text"
                          className="form-control"
                          id="siteName"
                          value={settings.general.siteName}
                          onChange={(e) => updateSetting('general', 'siteName', e.target.value)}
                        />
                        <label htmlFor="siteName">Site Name</label>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-floating">
                        <input
                          type="email"
                          className="form-control"
                          id="contactEmail"
                          value={settings.general.contactEmail}
                          onChange={(e) => updateSetting('general', 'contactEmail', e.target.value)}
                        />
                        <label htmlFor="contactEmail">Contact Email</label>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-floating">
                        <input
                          type="tel"
                          className="form-control"
                          id="contactPhone"
                          value={settings.general.contactPhone}
                          onChange={(e) => updateSetting('general', 'contactPhone', e.target.value)}
                        />
                        <label htmlFor="contactPhone">Contact Phone</label>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-floating">
                        <select
                          className="form-select"
                          id="timezone"
                          value={settings.general.timezone}
                          onChange={(e) => updateSetting('general', 'timezone', e.target.value)}
                        >
                          <option value="America/New_York">Eastern Time</option>
                          <option value="America/Chicago">Central Time</option>
                          <option value="America/Denver">Mountain Time</option>
                          <option value="America/Los_Angeles">Pacific Time</option>
                        </select>
                        <label htmlFor="timezone">Timezone</label>
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="form-floating">
                        <textarea
                          className="form-control"
                          id="siteDescription"
                          style={{ height: '100px' }}
                          value={settings.general.siteDescription}
                          onChange={(e) => updateSetting('general', 'siteDescription', e.target.value)}
                        />
                        <label htmlFor="siteDescription">Site Description</label>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <button
                      className="btn btn-primary"
                      onClick={() => saveSection('general')}
                      disabled={isSaving.general}
                    >
                      {isSaving.general ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Saving...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check-circle me-2"></i>
                          Save General Settings
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Settings */}
            {activeTab === 'notifications' && (
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">Notification Settings</h5>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    {Object.entries(settings.notifications).map(([key, value]) => (
                      <div key={key} className="col-12">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={key}
                            checked={value}
                            onChange={(e) => updateSetting('notifications', key, e.target.checked)}
                          />
                          <label className="form-check-label" htmlFor={key}>
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3">
                    <button
                      className="btn btn-primary"
                      onClick={() => saveSection('notifications')}
                      disabled={isSaving.notifications}
                    >
                      {isSaving.notifications ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Saving...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check-circle me-2"></i>
                          Save Notification Settings
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Business Settings */}
            {activeTab === 'business' && (
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">Business Settings</h5>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="form-floating">
                        <input
                          type="text"
                          className="form-control"
                          id="businessName"
                          value={settings.business.businessName}
                          onChange={(e) => updateSetting('business', 'businessName', e.target.value)}
                        />
                        <label htmlFor="businessName">Business Name</label>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-floating">
                        <input
                          type="number"
                          className="form-control"
                          id="taxRate"
                          step="0.01"
                          value={settings.business.taxRate}
                          onChange={(e) => updateSetting('business', 'taxRate', parseFloat(e.target.value))}
                        />
                        <label htmlFor="taxRate">Tax Rate (%)</label>
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="form-floating">
                        <textarea
                          className="form-control"
                          id="businessAddress"
                          style={{ height: '80px' }}
                          value={settings.business.businessAddress}
                          onChange={(e) => updateSetting('business', 'businessAddress', e.target.value)}
                        />
                        <label htmlFor="businessAddress">Business Address</label>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-floating">
                        <input
                          type="number"
                          className="form-control"
                          id="deliveryRadius"
                          value={settings.business.deliveryRadius}
                          onChange={(e) => updateSetting('business', 'deliveryRadius', parseInt(e.target.value))}
                        />
                        <label htmlFor="deliveryRadius">Delivery Radius (miles)</label>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-floating">
                        <input
                          type="number"
                          className="form-control"
                          id="minimumOrderAmount"
                          step="0.01"
                          value={settings.business.minimumOrderAmount}
                          onChange={(e) => updateSetting('business', 'minimumOrderAmount', parseFloat(e.target.value))}
                        />
                        <label htmlFor="minimumOrderAmount">Minimum Order ($)</label>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-floating">
                        <input
                          type="number"
                          className="form-control"
                          id="freeDeliveryThreshold"
                          step="0.01"
                          value={settings.business.freeDeliveryThreshold}
                          onChange={(e) => updateSetting('business', 'freeDeliveryThreshold', parseFloat(e.target.value))}
                        />
                        <label htmlFor="freeDeliveryThreshold">Free Delivery Threshold ($)</label>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <button
                      className="btn btn-primary"
                      onClick={() => saveSection('business')}
                      disabled={isSaving.business}
                    >
                      {isSaving.business ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Saving...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check-circle me-2"></i>
                          Save Business Settings
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">Security Settings</h5>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="form-floating">
                        <input
                          type="number"
                          className="form-control"
                          id="passwordMinLength"
                          min="6"
                          max="20"
                          value={settings.security.passwordMinLength}
                          onChange={(e) => updateSetting('security', 'passwordMinLength', parseInt(e.target.value))}
                        />
                        <label htmlFor="passwordMinLength">Minimum Password Length</label>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-floating">
                        <input
                          type="number"
                          className="form-control"
                          id="sessionTimeout"
                          min="15"
                          max="480"
                          value={settings.security.sessionTimeout}
                          onChange={(e) => updateSetting('security', 'sessionTimeout', parseInt(e.target.value))}
                        />
                        <label htmlFor="sessionTimeout">Session Timeout (minutes)</label>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-floating">
                        <input
                          type="number"
                          className="form-control"
                          id="maxLoginAttempts"
                          min="3"
                          max="10"
                          value={settings.security.maxLoginAttempts}
                          onChange={(e) => updateSetting('security', 'maxLoginAttempts', parseInt(e.target.value))}
                        />
                        <label htmlFor="maxLoginAttempts">Max Login Attempts</label>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-floating">
                        <input
                          type="number"
                          className="form-control"
                          id="lockoutDuration"
                          min="5"
                          max="120"
                          value={settings.security.lockoutDuration}
                          onChange={(e) => updateSetting('security', 'lockoutDuration', parseInt(e.target.value))}
                        />
                        <label htmlFor="lockoutDuration">Lockout Duration (minutes)</label>
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="requireTwoFactor"
                          checked={settings.security.requireTwoFactor}
                          onChange={(e) => updateSetting('security', 'requireTwoFactor', e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="requireTwoFactor">
                          Require Two-Factor Authentication
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <button
                      className="btn btn-primary"
                      onClick={() => saveSection('security')}
                      disabled={isSaving.security}
                    >
                      {isSaving.security ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Saving...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check-circle me-2"></i>
                          Save Security Settings
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Password Change */}
            {activeTab === 'password' && (
              <PasswordChangeForm
                onSubmit={handlePasswordChange}
                onCancel={() => setActiveTab('general')}
              />
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
