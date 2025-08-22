import React from 'react';
import Button from './Button';

const Modal = ({ 
  show, 
  onHide, 
  title, 
  children, 
  size = 'lg',
  showFooter = true,
  onSave,
  onCancel,
  saveText = 'Save',
  cancelText = 'Cancel',
  saveVariant = 'primary',
  loading = false
}) => {
  if (!show) return null;

  const handleSave = () => {
    if (onSave) onSave();
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    if (onHide) onHide();
  };

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className={`modal-dialog modal-${size}`}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={handleCancel}
              disabled={loading}
            ></button>
          </div>
          
          <div className="modal-body">
            {children}
          </div>
          
          {showFooter && (
            <div className="modal-footer">
              <Button 
                variant="secondary" 
                onClick={handleCancel}
                disabled={loading}
              >
                {cancelText}
              </Button>
              {onSave && (
                <Button 
                  variant={saveVariant} 
                  onClick={handleSave}
                  loading={loading}
                >
                  {saveText}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
