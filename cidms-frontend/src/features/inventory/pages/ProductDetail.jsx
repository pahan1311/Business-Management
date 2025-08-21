import { useParams } from 'react-router-dom';
import LoadingBlock from '../../../components/common/LoadingBlock';

const ProductDetail = () => {
  const { id } = useParams();
  
  return (
    <div>
      <h1>Product Detail - {id}</h1>
      <p>Product detail page implementation coming soon...</p>
    </div>
  );
};

export default ProductDetail;
