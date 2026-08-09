import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Terminal, ArrowLeft } from 'lucide-react';

import SlidingPanel from '../components/auth/SlidingPanel';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import ForgotPasswordForm from '../components/auth/ForgotPasswordForm';

import { loginUser, registerUser, forgotPassword, googleLogin } from '../api/authApi';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../store/slices/authSlice';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const redirectTo = location.state?.from || '/workspace';

  const handleLogin = async (data) => {
    setSubmitting(true);
    try {
      const res = await loginUser(data);
      dispatch(setCredentials({ user: res.user, token: res.token }));
      toast.success(`Welcome back, ${res.user.name.split(' ')[0]}!`);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const message = err?.response?.data?.error || err?.message || 'Invalid email or password';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setSubmitting(true);
    try {
      const res = await googleLogin(credentialResponse.credential);
      dispatch(setCredentials({ user: res.user, token: res.token }));
      toast.success(`Welcome, ${res.user.name.split(' ')[0]}!`);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Google login failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (data) => {
    setSubmitting(true);
    try {
      const res = await registerUser(data);
      dispatch(setCredentials({ user: res.user, token: res.token }));
      toast.success(`Account created! Welcome, ${res.user.name.split(' ')[0]}.`);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const message = err?.response?.data?.error || err?.message || 'Registration failed';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async (data) => {
    setSubmitting(true);
    try {
      await forgotPassword(data);
      toast.success('Password changed successfully! Please log in with your new password.');
      setIsForgotPassword(false);
      setIsLogin(true);
    } catch (err) {
      const message = err?.response?.data?.error || err?.message || 'Password reset failure';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const formContent = (
    <AnimatePresence mode="wait">
      {isForgotPassword ? (
        <motion.div
          key="forgot"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
        >
          <h2 className="mb-1 text-2xl font-bold text-slate-50">Reset Password</h2>
          <p className="mb-6 text-xs text-slate-400">
            Request an OTP code to update your account password.
          </p>
          <ForgotPasswordForm
            onSubmit={handleForgotPassword}
            onBackToLogin={() => setIsForgotPassword(false)}
            submitting={submitting}
          />
        </motion.div>
      ) : (
        <motion.div
          key={isLogin ? 'login' : 'register'}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
        >
          <h2 className="mb-1 text-2xl font-bold text-slate-50">
            {isLogin ? 'Sign In' : 'Create Account'}
          </h2>
          <p className="mb-6 text-sm text-slate-400">
            {isLogin ? "Don't have an account yet?" : 'Already have an account?'}{' '}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setIsForgotPassword(false);
              }}
              className="font-medium text-cyan-400 hover:underline"
            >
              {isLogin ? 'Register here' : 'Sign in here'}
            </button>
          </p>

          {isLogin ? (
            <LoginForm
              onSubmit={handleLogin}
              onGoogleSuccess={handleGoogleSuccess}
              onForgotPasswordClick={() => setIsForgotPassword(true)}
              submitting={submitting}
            />
          ) : (
            <RegisterForm onSubmit={handleRegister} submitting={submitting} />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
      <Link
        to="/"
        className="absolute left-4 top-6 flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-cyan-400 sm:left-8"
      >
        <ArrowLeft className="h-4 w-4" /> Back to home
      </Link>

      <div className="relative flex w-full max-w-5xl overflow-hidden rounded-3xl border border-cyan-500/20 bg-slate-900 shadow-2xl shadow-cyan-950/40 lg:h-[580px]">
        {/* Desktop sliding brand panel — anchored LEFT, slides right on register */}
        <SlidingPanel isLogin={isLogin} />

        {/* Mobile brand header */}
        <div className="flex w-full flex-col items-center gap-2 border-b border-slate-800 bg-gradient-to-br from-slate-900 to-cyan-950/30 px-6 py-8 lg:hidden">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-md">
            <Terminal className="h-6 w-6 text-slate-950" />
          </div>
          <h1 className="text-xl font-bold text-slate-50">
            {isLogin ? 'Cloud IDE Login' : 'Join Cloud IDE'}
          </h1>
        </div>

        {/* Desktop form panel — anchored RIGHT, slides left on register */}
        <motion.div
          animate={{ x: isLogin ? '0%' : '-100%' }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          className="absolute right-0 top-0 hidden h-full w-1/2 flex-col justify-center px-12 lg:flex"
        >
          {formContent}
        </motion.div>

        {/* Mobile form */}
        <div className="flex w-full flex-col justify-center px-6 py-10 sm:px-10 lg:hidden">
          {formContent}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
