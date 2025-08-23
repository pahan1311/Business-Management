import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { orders, deliveryPersonnel } from './testData';

// A utility component to test staff functionality for assigning delivery personnel
const StaffTestDeliveryAssignment = ({ show, onClose, onTestDelivery }) => {
  const testAssignDelivery = () => {
    // Get test data
    const testOrder = orders[0];
    const testDeliveryPerson = deliveryPersonnel[0];
    
    // Call the test callback with the test data
    onTestDelivery(testOrder, testDeliveryPerson);
    onClose();
  };
  
  return (
    <Modal show={show} onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>Test Delivery Assignment</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>This will test the delivery assignment functionality for staff users by:</p>
        <ol>
          <li>Using a test order (ID: {orders[0].id})</li>
          <li>Assigning a test delivery person (Name: {deliveryPersonnel[0].name})</li>
          <li>Simulating the API calls</li>
        </ol>
        <p>Click "Run Test" to start the test.</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={testAssignDelivery}>Run Test</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default StaffTestDeliveryAssignment;
