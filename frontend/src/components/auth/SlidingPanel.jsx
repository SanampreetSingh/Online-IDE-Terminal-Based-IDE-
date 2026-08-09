import { motion } from 'framer-motion';
import { Terminal, ShieldCheck, Sparkles, Cpu } from 'lucide-react';

const SlidingPanel = ({ isLogin }) => {
  return (
    <motion.div
      animate={{ x: isLogin ? 0 : '100%' }}
      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      className="absolute z-10 hidden h-full w-1/2 flex-col justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/40 border-r border-cyan-500/20 lg:flex"
    >
      <div className="flex h-full w-full flex-col items-center justify-center gap-6 px-10 text-center">
        {/* Glow Logo Badge */}
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-xl shadow-cyan-900/40 border border-cyan-300/30">
          <Terminal className="h-8 w-8 text-slate-950" />
        </div>

        <motion.div
          key={isLogin ? 'login-copy' : 'register-copy'}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <h1 className="text-3xl font-bold text-slate-50">
            {isLogin ? 'Welcome Back to Cloud IDE' : 'Create Your Workspace'}
          </h1>
          <p className="mt-4 max-w-sm text-sm text-slate-400">
            {isLogin
              ? 'Sign in to access your isolated cloud containers, Monaco editor, and live preview environments.'
              : 'Register now to instantly provision isolated C++/Node.js micro-containers with persistent storage.'}
          </p>
        </motion.div>

        <div className="mt-4 flex flex-col gap-3 text-left">
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <Cpu className="h-4 w-4 shrink-0 text-cyan-400" />
            Isolated Docker sandbox per user
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <ShieldCheck className="h-4 w-4 shrink-0 text-cyan-400" />
            Secure JWT cookie authentication
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <Sparkles className="h-4 w-4 shrink-0 text-cyan-400" />
            Zero-config live web preview proxy
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SlidingPanel;
