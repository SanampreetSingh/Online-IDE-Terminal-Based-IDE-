import { useState } from 'react';
import { Mail, Lock, KeyRound, Loader2, Send, CheckCircle } from 'lucide-react';
import { sendOtp } from '../../api/authApi';
import { toast } from 'sonner';

const ForgotPasswordForm = ({ onSubmit, onBackToLogin, submitting }) => {
  const [formData, setFormData] = useState({ email: '', otp: '', newPassword: '' });
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSendOtp = async () => {
    if (!formData.email) {
      toast.error('Please enter your registered email address');
      return;
    }
    setSendingOtp(true);
    try {
      await sendOtp({ email: formData.email, type: 'forgot' });
      setOtpSent(true);
      toast.success('Password reset OTP sent to your email!');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'User not found or failed to send OTP');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!otpSent) {
      toast.error('Please request and enter an OTP first');
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {/* Email */}
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-300">Registered Email Address</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="developer@example.com"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <button
            type="button"
            onClick={handleSendOtp}
            disabled={sendingOtp || !formData.email}
            className="flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs font-medium text-cyan-400 hover:bg-cyan-500/20 disabled:opacity-40"
          >
            {sendingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            {otpSent ? 'Resend' : 'Send OTP'}
          </button>
        </div>
      </div>

      {/* 6-Digit OTP */}
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-300">6-Digit Reset OTP</label>
        <div className="relative">
          <KeyRound className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
          <input
            type="text"
            name="otp"
            maxLength={6}
            required
            value={formData.otp}
            onChange={handleChange}
            placeholder="123456"
            className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-4 text-sm tracking-widest text-slate-100 placeholder-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>
      </div>

      {/* New Password */}
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-300">New Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
          <input
            type="password"
            name="newPassword"
            required
            value={formData.newPassword}
            onChange={handleChange}
            placeholder="••••••••"
            className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>
      </div>

      {/* Actions */}
      <button
        type="submit"
        disabled={submitting}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3 font-semibold text-slate-950 transition-all hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50"
      >
        {submitting ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            <CheckCircle className="h-4 w-4" /> Reset Password
          </>
        )}
      </button>

      <button
        type="button"
        onClick={onBackToLogin}
        className="mt-1 text-center text-xs text-slate-400 hover:text-cyan-400 hover:underline"
      >
        Back to Login
      </button>
    </form>
  );
};

export default ForgotPasswordForm;
