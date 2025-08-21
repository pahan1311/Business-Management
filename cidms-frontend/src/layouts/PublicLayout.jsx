import { Outlet } from 'react-router-dom';

const PublicLayout = () => {
  return (
    <div className="container-fluid">
      <Outlet />
    </div>
  );
};

export default PublicLayout;
