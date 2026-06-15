import { useState } from 'react';
import { Lock, Eye, EyeOff, X, ShieldCheck } from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  currentPassword: string;
  onUpdatePassword: (email: string, newPassword: string) => void;
  onToast: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

export default function ChangePasswordModal({
  isOpen,
  onClose,
  userEmail,
  currentPassword,
  onUpdatePassword,
  onToast,
}: ChangePasswordModalProps) {
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const resetForm = () => {
    setOldPwd('');
    setNewPwd('');
    setConfirmPwd('');
    setShowOld(false);
    setShowNew(false);
    setShowConfirm(false);
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!oldPwd) {
      newErrors.oldPwd = 'Current password is required';
    } else if (oldPwd !== currentPassword) {
      newErrors.oldPwd = 'Current password is incorrect';
    }

    if (!newPwd) {
      newErrors.newPwd = 'New password is required';
    } else if (newPwd.length < 6) {
      newErrors.newPwd = 'Password must be at least 6 characters';
    } else if (newPwd === oldPwd) {
      newErrors.newPwd = 'New password must be different from current';
    }

    if (!confirmPwd) {
      newErrors.confirmPwd = 'Please confirm your new password';
    } else if (confirmPwd !== newPwd) {
      newErrors.confirmPwd = 'Passwords do not match';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      if (newErrors.oldPwd) onToast('error', newErrors.oldPwd);
      return;
    }

    onUpdatePassword(userEmail, newPwd);
    onToast('success', 'Password changed successfully! 🔒');
    resetForm();
    onClose();
  };

  const PwdInput = ({
    value,
    onChange,
    placeholder,
    show,
    onToggle,
    error,
    label,
  }: {
    value: string;
    onChange: (v: string) => void;
    placeholder: string;
    show: boolean;
    onToggle: () => void;
    error?: string;
    label: string;
  }) => (
    <div>
      <label className="text-xs font-medium text-slate-600">{label}</label>
      <div className="mt-1 relative">
        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-xl border bg-white py-2.5 pl-10 pr-10 text-sm outline-none transition-all focus:ring-2 focus:ring-violet-100 ${
            error ? 'border-rose-300' : 'border-slate-200 focus:border-violet-300'
          }`}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl shadow-violet-200 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Change Password</h2>
              <p className="text-[11px] text-slate-400">{userEmail}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <PwdInput
            label="Current Password"
            value={oldPwd}
            onChange={setOldPwd}
            placeholder="Enter current password"
            show={showOld}
            onToggle={() => setShowOld(!showOld)}
            error={errors.oldPwd}
          />
          <PwdInput
            label="New Password"
            value={newPwd}
            onChange={setNewPwd}
            placeholder="Enter new password"
            show={showNew}
            onToggle={() => setShowNew(!showNew)}
            error={errors.newPwd}
          />
          <PwdInput
            label="Confirm New Password"
            value={confirmPwd}
            onChange={setConfirmPwd}
            placeholder="Confirm new password"
            show={showConfirm}
            onToggle={() => setShowConfirm(!showConfirm)}
            error={errors.confirmPwd}
          />

          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-xs text-emerald-700">
              🔒 Password must be at least 6 characters and different from your current one.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-200 hover:shadow-lg"
            >
              <ShieldCheck className="h-4 w-4" />
              Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
