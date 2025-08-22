import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { SnackbarProvider } from 'notistack';
import { store } from './app/store';
import AppRoutes from './app/routes';
import { notistackRef } from './utils/toast';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './styles/globals.css';

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <SnackbarProvider 
          ref={notistackRef}
          maxSnack={3} 
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <AppRoutes />
        </SnackbarProvider>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
