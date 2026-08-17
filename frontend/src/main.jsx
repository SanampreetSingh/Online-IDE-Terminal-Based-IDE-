import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'sonner';
import { UserProvider } from './context/UserContext.jsx';
import store from './store';
import './index.css';
import App from './App.jsx';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <UserProvider>
        <GoogleOAuthProvider clientId={googleClientId}>
          <App />
          <Toaster position="top-right" theme="dark" richColors closeButton />
        </GoogleOAuthProvider>
      </UserProvider>
    </Provider>
  </StrictMode>
);
