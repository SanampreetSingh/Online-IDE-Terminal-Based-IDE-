import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import AuthPage from './pages/AuthPage';
import IDEWorkspace from './components/IDEWorkspace';
import { fetchMe } from './api/authApi';
import { setCredentials, setLoading } from './store/slices/authSlice';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useSelector((state) => state.auth);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-cyan-400 font-mono">
        ⚡ Loading Cloud IDE Session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetchMe();
        if (res.user) {
          dispatch(setCredentials({ user: res.user }));
        }
      } catch (err) {
        dispatch(setLoading(false));
      }
    };
    checkAuth();
  }, [dispatch]);

  return (
    <Router>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/workspace"
          element={
            <ProtectedRoute>
              <IDEWorkspace />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/workspace" replace />} />
      </Routes>
    </Router>
  );
}

export default App;