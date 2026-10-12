import { MeaningEvaluationResponse, SentenceEvaluationResponse } from '../types';

export interface MeaningEvaluationPayload {
  word: string;
  expectedDefinition: string;
  userAnswer: string;
  partOfSpeech?: string;
  exampleSentence?: string;
  notes?: string;
}

export interface SentenceEvaluationPayload {
  word: string;
  expectedDefinition?: string;
  userSentence: string;
  partOfSpeech?: string;
  exampleSentence?: string;
}

export class AiEvaluationError extends Error {
  code: string;
  constructor(message: string, code: string = 'UNKNOWN_ERROR') {
    super(message);
    this.name = 'AiEvaluationError';
    this.code = code;
  }
}

/**
 * Call server-side Gemini to evaluate user's Vietnamese explanation of an English word
 */
export async function evaluateMeaning(
  payload: MeaningEvaluationPayload
): Promise<MeaningEvaluationResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s generous timeout for cold starts/fallbacks

  try {
    const res = await fetch('/api/ai/evaluate-meaning', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMsg =
        data.message ||
        (res.status === 429
          ? 'Hệ thống đang quá tải hoặc thao tác quá nhanh. Vui lòng đợi ít giây rồi thử lại.'
          : res.status === 503
          ? 'Chưa cấu hình GEMINI_API_KEY trên máy chủ. Hãy cấu hình Secret trong AI Studio.'
          : 'Không thể kết nối đến máy chủ chấm điểm AI.');
      throw new AiEvaluationError(errorMsg, data.error || `HTTP_${res.status}`);
    }

    return data as MeaningEvaluationResponse;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new AiEvaluationError(
        'Thời gian phản hồi của AI quá lâu. Đại ca vui lòng bấm Thử lại hoặc tự đối chiếu nghĩa bên dưới.',
        'TIMEOUT'
      );
    }
    if (err instanceof AiEvaluationError) {
      throw err;
    }
    throw new AiEvaluationError(
      err.message || 'Mất kết nối mạng hoặc lỗi máy chủ cục bộ.',
      'NETWORK_ERROR'
    );
  }
}

/**
 * Call server-side Gemini to evaluate user's English sentence using target vocabulary
 */
export async function evaluateSentence(
  payload: SentenceEvaluationPayload
): Promise<SentenceEvaluationResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s timeout

  try {
    const res = await fetch('/api/ai/evaluate-sentence', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMsg =
        data.message ||
        (res.status === 429
          ? 'Hệ thống đang quá tải hoặc thao tác quá nhanh. Vui lòng đợi ít giây rồi thử lại.'
          : res.status === 503
          ? 'Chưa cấu hình GEMINI_API_KEY trên máy chủ. Hãy cấu hình Secret trong AI Studio.'
          : 'Không thể kết nối đến máy chủ chấm điểm câu AI.');
      throw new AiEvaluationError(errorMsg, data.error || `HTTP_${res.status}`);
    }

    return data as SentenceEvaluationResponse;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new AiEvaluationError(
        'Thời gian chấm câu của AI quá lâu. Đại ca vui lòng bấm Thử lại hoặc tự đối chiếu câu bên dưới.',
        'TIMEOUT'
      );
    }
    if (err instanceof AiEvaluationError) {
      throw err;
    }
    throw new AiEvaluationError(
      err.message || 'Mất kết nối mạng hoặc lỗi máy chủ cục bộ.',
      'NETWORK_ERROR'
    );
  }
}
