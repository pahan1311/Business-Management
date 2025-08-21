import LoginForm from '../components/LoginForm';

const LoginPage = () => {
  return (
    <div className="container-fluid vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12">
            <div className="text-center mb-4">
              <h1 className="display-6 fw-bold text-primary">CIDMS</h1>
              <p className="lead text-muted">Customer Inventory Delivery Management System</p>
            </div>
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
