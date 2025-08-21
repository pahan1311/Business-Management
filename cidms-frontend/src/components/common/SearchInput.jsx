import { useState } from 'react';
import { useDebounce } from '../../hooks/useDebounce';

const SearchInput = ({ 
  placeholder = "Search...", 
  onSearch = () => {}, 
  delay = 500,
  className = "",
  ...props 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, delay);

  // Call onSearch when debounced search term changes
  React.useEffect(() => {
    onSearch(debouncedSearchTerm);
  }, [debouncedSearchTerm, onSearch]);

  const handleClear = () => {
    setSearchTerm('');
  };

  return (
    <div className={`search-input ${className}`}>
      <i className="bi bi-search"></i>
      <input
        type="text"
        className="form-control"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        {...props}
      />
      {searchTerm && (
        <button
          type="button"
          className="btn btn-link position-absolute end-0 top-50 translate-middle-y pe-3"
          onClick={handleClear}
          style={{ zIndex: 6 }}
        >
          <i className="bi bi-x-circle"></i>
        </button>
      )}
    </div>
  );
};

export default SearchInput;
