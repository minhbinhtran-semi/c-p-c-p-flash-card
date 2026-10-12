import React, { useState } from 'react';
import { Cloud, Upload, Download, GitMerge, AlertCircle, Sparkles, X } from 'lucide-react';
import { getDecks, getVocabulary, getReviewRecords } from '../../services/storage';

interface MigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadLocal: () => Promise<void>;
  onDownloadCloud: () => Promise<void>;
  onMerge: () => Promise<void>;
}

export const MigrationModal: React.FC<MigrationModalProps> = ({
  isOpen,
  onClose,
  onUploadLocal,
  onDownloadCloud,
  onMerge,
}) => {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const localDecksCount = getDecks().length;
  const localVocabCount = getVocabulary().length;
  const localReviewsCount = getReviewRecords().length;

  const handleAction = async (actionType: 'upload' | 'download' | 'merge', fn: () => Promise<void>) => {
    setLoadingAction(actionType);
    setError(null);
    try {
      await fn();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Quá trình di chuyển dữ liệu gặp sự cố. Vui lòng thử lại!');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-emerald-100">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 font-bold">
              ☁️
            </span>
            <h2 className="text-xl font-bold text-gray-800">Đồng Bộ Dữ Liệu Lần Đầu</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mascot Speech Bubble */}
        <div className="my-5 rounded-xl bg-emerald-50 p-4 border border-emerald-200 text-sm text-emerald-900 flex items-start gap-3">
          <span className="text-2xl">🦂</span>
          <div>
            <p className="font-semibold text-emerald-800">Cạp Tổng kiểm tra:</p>
            <p className="mt-1">
              Phát hiện máy này đang có sẵn <strong className="text-emerald-900">{localDecksCount} bộ từ</strong>, <strong className="text-emerald-900">{localVocabCount} từ vựng</strong> và <strong className="text-emerald-900">{localReviewsCount} lịch sử ôn tập</strong>. Đại ca muốn xử lý dữ liệu này thế nào khi lên mây?
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 border border-red-200 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-3">
          {/* Option 1: Upload */}
          <button
            onClick={() => handleAction('upload', onUploadLocal)}
            disabled={loadingAction !== null}
            className="w-full text-left rounded-xl border-2 border-emerald-200 bg-emerald-50/50 p-4 hover:bg-emerald-50 transition flex items-center justify-between group disabled:opacity-50"
          >
            <div className="flex items-start gap-3">
              <span className="rounded-xl bg-emerald-200/70 p-2.5 text-emerald-800">
                <Upload className="h-5 w-5" />
              </span>
              <div>
                <h4 className="font-bold text-emerald-900 group-hover:text-emerald-950">
                  Đưa dữ liệu máy này lên đám mây
                </h4>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Đẩy toàn bộ từ vựng và tiến độ hiện tại trên thiết bị lên tài khoản Cloud của đại ca.
                </p>
              </div>
            </div>
            {loadingAction === 'upload' && (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
            )}
          </button>

          {/* Option 2: Download */}
          <button
            onClick={() => handleAction('download', onDownloadCloud)}
            disabled={loadingAction !== null}
            className="w-full text-left rounded-xl border border-gray-200 bg-white p-4 hover:bg-gray-50 transition flex items-center justify-between group disabled:opacity-50"
          >
            <div className="flex items-start gap-3">
              <span className="rounded-xl bg-gray-100 p-2.5 text-gray-700">
                <Download className="h-5 w-5" />
              </span>
              <div>
                <h4 className="font-bold text-gray-800 group-hover:text-gray-900">
                  Sử dụng dữ liệu trên đám mây
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Tải dữ liệu từ tài khoản Cloud xuống (sẽ sao lưu dự phòng dữ liệu máy này trước).
                </p>
              </div>
            </div>
            {loadingAction === 'download' && (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-600 border-t-transparent" />
            )}
          </button>

          {/* Option 3: Merge */}
          <button
            onClick={() => handleAction('merge', onMerge)}
            disabled={loadingAction !== null}
            className="w-full text-left rounded-xl border border-gray-200 bg-white p-4 hover:bg-gray-50 transition flex items-center justify-between group disabled:opacity-50"
          >
            <div className="flex items-start gap-3">
              <span className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700">
                <GitMerge className="h-5 w-5" />
              </span>
              <div>
                <h4 className="font-bold text-gray-800 group-hover:text-gray-900">
                  Xem và hợp nhất dữ liệu
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Kết hợp an toàn dữ liệu máy này với dữ liệu đám mây mà không làm mất mát tiến độ.
                </p>
              </div>
            </div>
            {loadingAction === 'merge' && (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
