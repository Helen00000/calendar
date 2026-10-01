import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react';

interface PasswordGateProps {
  onSuccess: () => void;
}

export const PasswordGate: React.FC<PasswordGateProps> = ({ onSuccess }) => {
const [password, setPassword] = useState('');
const [showPassword, setShowPassword] = useState(false);
const [error, setError] = useState(false);
const [errorMessage, setErrorMessage] = useState('Неверный пароль. Попробуйте еще раз.');
const [isLoading, setIsLoading] = useState(false);
const [isAnimating, setIsAnimating] = useState(false);

// 🔒 Проверка пароля происходит ТОЛЬКО на сервере (/api/auth).
// В клиентском коде пароль не хранится — клиент получает лишь токен сессии.
const handleSubmit = async (e: React.FormEvent) => {
e.preventDefault();
if (isLoading) return;
setIsLoading(true);
try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        if (data.token) {
          localStorage.setItem('session_token', data.token);
        }
        setError(false);
        onSuccess();
        return;
      }

      // 423 = аккаунт временно заблокирован после 5 попыток
      if (res.status === 423) {
        setErrorMessage(data.error || 'Вход временно заблокирован. Попробуйте позже.');
      } else {
        setErrorMessage(data.error || 'Неверный пароль. Попробуйте еще раз.');
      }
    } catch {
      setErrorMessage('Сервер недоступен. Проверьте, что приложение запущено.');
    }
setError(true);
setIsAnimating(true);
setTimeout(() => setIsAnimating(false), 500);
setIsLoading(false);
};

return (
<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-3 sm:p-4 selection:bg-indigo-500 selection:text-white overflow-y-auto">
<div
className={`w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl space-y-5 sm:space-y-6 text-slate-100 transition-transform my-auto ${
isAnimating ? 'animate-shake' : ''
}`}
>
{/* Header Icon */}
<div className="flex flex-col items-center text-center space-y-2.5 sm:space-y-3">
<div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-4 ring-slate-800">
<Lock className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
</div>
<div>
<h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Доступ Защищен</h2>
<p className="text-xs text-slate-400 mt-1">
Введите пароль доступа (по умолчанию: <span className="text-indigo-400 font-mono font-semibold">admin</span>)
</p>
</div>
</div>

{/* Form */}
<form onSubmit={handleSubmit} className="space-y-4">
<div className="space-y-1.5">
<label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
<ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
<span>Пароль доступа</span>
</label>
<div className="relative">
<input
type={showPassword ? 'text' : 'password'}
value={password}
onChange={(e) => {
setPassword(e.target.value);
if (error) setError(false);
}}
placeholder="Введите пароль..."
autoFocus
className={`w-full px-4 py-3.5 rounded-2xl bg-slate-950 border text-sm font-mono text-white placeholder-slate-600 outline-none transition-all ${
error
? 'border-rose-500 ring-2 ring-rose-500/30'
: 'border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
}`}
/>
<button
type="button"
onClick={() => setShowPassword(!showPassword)}
className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1"
tabIndex={-1}
>
{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
</button>
</div>
{error && (
<p className="text-xs font-bold text-rose-400 animate-fade-in pl-1">
⚠️ {errorMessage}
</p>
)}
</div>

<button
type="submit"
disabled={isLoading}
className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-bold text-sm rounded-2xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 group active:scale-[0.99]"
>
<span>{isLoading ? 'Проверка пароля...' : 'Войти в систему'}</span>
<ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
</button>
</form>

{/* Footer info */}
<div className="border-t border-slate-800/80 pt-4 text-center">
<p className="text-[11px] text-slate-500 font-medium">
🔒 Сессия действительна 12 часов и сохраняется в вашем браузере до выхода из аккаунта.
</p>
</div>
</div>
</div>
);
};