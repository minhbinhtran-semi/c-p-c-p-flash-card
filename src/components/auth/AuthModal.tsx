import React, { useState } from 'react';
import { X, Shield, Sparkles, LogIn } from 'lucide-react';
import { signInWithGoogle } from '../../services/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
  tone?: 'puppy' | 'cheeky' | 'mentor';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess, tone = 'cheeky' }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await signInWithGoogle();
      onSuccess(user);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError('Đăng nhập Google thất bại. Vui lòng thử lại đại ca ơi!');
    } finally {
      setLoading(false);
    }
  };

  const dialogueText =
    tone === 'puppy'
      ? 'Đăng nhập để lưu lại từ vựng và chiến đấu cùng đồng đội nhé đại ca!'
      : tone === 'mentor'
      ? 'Đăng nhập tài khoản Google để đồng bộ toàn bộ tiến độ học tập trên mọi thiết bị.'
      : 'Đại ca tên gì để tôi còn ghi vào sổ đen? Đăng nhập lẹ đi!';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-emerald-100">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 font-bold">
              🦂
            </span>
            <h2 className="text-xl font-bold text-gray-800">Đăng nhập vào Đế Chế Cạp Cạp</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mascot Speech Bubble */}
        <div className="my-6 rounded-xl bg-emerald-50 p-4 border border-emerald-200 text-sm text-emerald-900 flex items-start gap-3">
          <span className="text-2xl">🦂</span>
          <div>
            <p className="font-semibold text-emerald-800">Cạp Tổng nhắn nhủ:</p>
            <p className="mt-1">{dialogueText}</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 border border-red-200">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 rounded-xl bg-emerald-700 py-3.5 px-4 font-semibold text-white shadow-lg hover:bg-emerald-800 transition active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Đang kết nối Google...
              </span>
            ) : (
              <>
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Tiếp tục với Google
              </>
            )}
          </button>

          <div className="text-center text-xs text-gray-500">
            Bằng cách đăng nhập, đại ca đồng ý đồng bộ từ vựng và tiến độ cạp từ an toàn trên mây.
          </div>
        </div>
      </div>
    </div>
  );
};
