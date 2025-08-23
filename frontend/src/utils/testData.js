// Test data for orders and delivery personnel
const orders = [
  {
    id: 'test123',
    customerName: 'John Doe',
    status: 'ready',
    total: 99.99,
    createdAt: new Date().toISOString(),
    shippingAddress: {
      street: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      zip: '90210'
    },
    items: [
      {
        name: 'Test Product 1',
        quantity: 2,
        price: 29.99
      },
      {
        name: 'Test Product 2',
        quantity: 1,
        price: 39.99
      }
    ]
  },
  {
    id: 'test456',
    customerName: 'Jane Smith',
    status: 'ready',
    total: 149.99,
    createdAt: new Date().toISOString(),
    shippingAddress: {
      street: '456 Oak Ave',
      city: 'Somewhere',
      state: 'NY',
      zip: '10001'
    },
    items: [
      {
        name: 'Premium Product',
        quantity: 1,
        price: 149.99
      }
    ]
  }
];

const deliveryPersonnel = [
  {
    id: 'delivery1',
    name: 'Mike Delivery',
    email: 'mike@delivery.com',
    phone: '123-456-7890'
  },
  {
    id: 'delivery2',
    name: 'Sarah Shipper',
    email: 'sarah@delivery.com',
    phone: '987-654-3210'
  }
];

// Mock API functions
const mockOrderAPI = {
  getAll: () => Promise.resolve({ data: orders }),
  update: (id, order) => Promise.resolve({ data: order }),
  updateStatus: (id, status) => Promise.resolve({ data: { id, status } })
};

const mockDeliveryAPI = {
  create: (delivery) => Promise.resolve({ 
    data: { 
      ...delivery, 
      _id: 'new-delivery-id-' + Math.random().toString(36).substring(7)
    } 
  })
};

const mockUserAPI = {
  getByRole: () => Promise.resolve({ data: deliveryPersonnel })
};

// Export mock data and API functions
export { orders, deliveryPersonnel, mockOrderAPI, mockDeliveryAPI, mockUserAPI };
