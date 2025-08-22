import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from '../../../utils/toast';
import LoadingBlock from '../../../components/common/LoadingBlock';

const OrderCreate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [orderItems, setOrderItems] = useState([{ productId: '', quantity: 1, price: 0 }]);
  
  const [formData, setFormData] = useState({
    customerId: '',
    orderDate: new Date().toISOString().split('T')[0],
    deliveryDate: '',
    notes: '',
    paymentMethod: 'credit-card',
    shippingAddress: '',
  });
  
  // Fetch customers and products data
  useEffect(() => {
    Promise.all([
      // Simulate API calls
      new Promise(resolve => setTimeout(() => {
        resolve([
          { id: 'CUST001', name: 'John Doe', email: 'john@example.com' },
          { id: 'CUST002', name: 'Jane Smith', email: 'jane@example.com' },
          { id: 'CUST003', name: 'Bob Johnson', email: 'bob@example.com' },
        ]);
      }, 500)),
      new Promise(resolve => setTimeout(() => {
        resolve([
          { id: 'PROD001', name: 'Laptop', price: 999.99, stock: 15 },
          { id: 'PROD002', name: 'Smartphone', price: 599.99, stock: 25 },
          { id: 'PROD003', name: 'Headphones', price: 149.99, stock: 50 },
          { id: 'PROD004', name: 'Monitor', price: 349.99, stock: 10 },
          { id: 'PROD005', name: 'Keyboard', price: 79.99, stock: 30 },
        ]);
      }, 700)),
    ])
    .then(([customersData, productsData]) => {
      setCustomers(customersData);
      setProducts(productsData);
      setLoadingInitial(false);
    })
    .catch(error => {
      console.error('Error fetching data:', error);
      toast.error('Error loading data');
      setLoadingInitial(false);
    });
  }, []);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleCustomerSelect = (e) => {
    const customerId = e.target.value;
    setFormData(prev => ({ ...prev, customerId }));
    
    if (customerId) {
      // For demonstration, we could pre-fill shipping address based on customer
      const selectedCustomer = customers.find(c => c.id === customerId);
      if (selectedCustomer) {
        setFormData(prev => ({ 
          ...prev, 
          shippingAddress: `123 Main St, Customer City, 12345` 
        }));
      }
    }
  };
  
  const handleProductChange = (index, field, value) => {
    const updatedItems = [...orderItems];
    updatedItems[index][field] = value;
    
    // If product changed, update price
    if (field === 'productId' && value) {
      const product = products.find(p => p.id === value);
      if (product) {
        updatedItems[index].price = product.price;
      }
    }
    
    setOrderItems(updatedItems);
  };
  
  const addOrderItem = () => {
    setOrderItems([...orderItems, { productId: '', quantity: 1, price: 0 }]);
  };
  
  const removeOrderItem = (index) => {
    const updatedItems = orderItems.filter((_, i) => i !== index);
    setOrderItems(updatedItems);
  };
  
  const calculateTotal = () => {
    return orderItems.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0).toFixed(2);
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Validate form
    if (!formData.customerId) {
      toast.error('Please select a customer');
      setLoading(false);
      return;
    }
    
    if (orderItems.some(item => !item.productId)) {
      toast.error('Please select all products');
      setLoading(false);
      return;
    }
    
    // Create order object
    const order = {
      ...formData,
      items: orderItems,
      total: calculateTotal(),
      status: 'new',
      createdAt: new Date().toISOString()
    };
    
    // Simulate API call
    setTimeout(() => {
      console.log('Submitting order:', order);
      toast.success('Order created successfully!');
      setLoading(false);
      navigate('/admin/orders');
    }, 1500);
  };
}
export default OrderCreate;
