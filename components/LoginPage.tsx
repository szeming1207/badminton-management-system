
import React from 'react';
import { Calendar, User, Lock, ArrowRight, Info, ShieldCheck } from 'lucide-react';

interface LoginPageProps {
  onLogin: (role: 'admin' | 'user') => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [loginId, setLoginId] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // 模拟快速验证逻辑
    setTimeout(() => {
      if (loginId.toLowerCase() === 'admin' && password === 'admin123') {
        onLogin('admin');
      } else if (loginId.toLowerCase() === 'user' && password === 'user123') {
        onLogin('user');
      } else {
        setError('登录ID或密码不正确');
        setIsLoading(false);
      }
    }, 400);
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light p-3">
      <div className="w-100" style={{ maxWidth: '420px' }}>
        <div className="text-center mb-5 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="d-inline-flex align-items-center justify-content-center bg-success text-white rounded-4xl shadow-lg mb-4" style={{ width: '80px', height: '80px' }}>
            <Calendar size={40} />
          </div>
          <h1 className="fw-black h3 mb-1">SBG Badminton</h1>
          <p className="text-muted fw-medium">Sibu Badminton Gang 活动管理系统</p>
        </div>

        <div className="card border-0 shadow-soft rounded-4xl p-4 p-md-5 bg-white animate-in zoom-in duration-300">
          <form onSubmit={handleSubmit} className="vstack gap-4">
            <div>
              <label className="form-label small fw-black text-muted text-uppercase tracking-wider px-1">账号 ID</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-0 rounded-start-3 px-3">
                  <User size={18} className="text-muted" />
                </span>
                <input
                  type="text"
                  required
                  autoFocus
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="admin 或 user"
                  className="form-control bg-light border-0 rounded-end-3 py-3 fw-bold shadow-none"
                />
              </div>
            </div>

            <div>
              <label className="form-label small fw-black text-muted text-uppercase tracking-wider px-1">访问密码</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-0 rounded-start-3 px-3">
                  <Lock size={18} className="text-muted" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="form-control bg-light border-0 rounded-end-3 py-3 fw-bold shadow-none"
                />
              </div>
            </div>

            {error && (
              <div className="alert alert-danger border-0 rounded-3 small fw-bold py-3 mb-0 animate-in shake">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-success rounded-3 py-3 fw-black d-flex align-items-center justify-content-center gap-2 shadow-sm transition-all"
            >
              {isLoading ? (
                <div className="spinner-border spinner-border-sm text-white" />
              ) : (
                <>
                  <span>立即登入</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 pt-4 border-top">
             <div className="alert alert-primary bg-primary bg-opacity-10 border-0 rounded-4 d-flex gap-3 mb-0">
                <div className="bg-primary bg-opacity-20 text-primary rounded-3 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                  <ShieldCheck size={20} />
                </div>
                <div className="small">
                  <p className="fw-black text-primary text-uppercase mb-1">测试访问权限</p>
                  <p className="text-muted mb-0">账号: <span className="text-dark fw-black">user</span> / <span className="text-dark fw-black">user123</span></p>
                </div>
             </div>
          </div>
        </div>
        
        <p className="text-center mt-4 text-muted small fw-bold">
          © {new Date().getFullYear()} SBG Badminton Gang. All rights reserved.
        </p>
      </div>
      
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-in.shake { animation: shake 0.4s ease-in-out; }
      `}</style>
    </div>
  );
};

export default LoginPage;
