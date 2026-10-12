import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { createRankedRouter } from './src/server/rankedService';

dotenv.config();

const app = express();
app.use(express.json({ limit: '1mb' }));

const PORT = 3000;
// Default to ultra-fast, high-availability gemini-3.5-flash-lite, with automatic fallback
const PRIMARY_GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
const FALLBACK_GEMINI_MODELS = Array.from(
  new Set([PRIMARY_GEMINI_MODEL, 'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.8-flash'])
);

// Rate limiter / Cooldown map for personal MVP
const clientCooldowns = new Map<string, { lastRequest: number; count: number; windowStart: number }>();
const inFlightRequests = new Set<string>();

/**
 * Robust helper to invoke Gemini generateContent with fallback models and per-attempt timeout
 */
async function callGeminiWithFallback(
  ai: GoogleGenAI,
  params: {
    contents: string;
    config: any;
    attemptTimeoutMs?: number;
  }
) {
  const timeoutMs = params.attemptTimeoutMs || 12000; // 12 seconds per candidate model
  let lastError: any = null;

  for (const model of FALLBACK_GEMINI_MODELS) {
    try {
      // Race generateContent with a timeout promise to prevent hanging
      const response = await Promise.race([
        ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout exceeding ${timeoutMs}ms on model ${model}`)), timeoutMs)
        ),
      ]);

      if (response && response.text) {
        return response;
      }
    } catch (err: any) {
      lastError = err;
      const isTemporary =
        err?.status === 503 ||
        err?.status === 429 ||
        err?.message?.includes('503') ||
        err?.message?.includes('high demand') ||
        err?.message?.includes('RESOURCE_EXHAUSTED') ||
        err?.message?.includes('Timeout');
      console.warn(`[Gemini] Attempt with model "${model}" failed (temporary: ${Boolean(isTemporary)}):`, err?.message || err);
      // Try next candidate model
    }
  }

  throw lastError || new Error('Không thể nhận phản hồi từ các mô hình AI.');
}

function checkRateLimit(req: Request, res: Response): boolean {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  const record = clientCooldowns.get(ip) || { lastRequest: 0, count: 0, windowStart: now };

  // Reset 1-minute window
  if (now - record.windowStart > 60000) {
    record.count = 0;
    record.windowStart = now;
  }

  // Max 30 requests per minute
  if (record.count >= 30) {
    res.status(429).json({
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Đại ca thao tác nhanh quá! Vui lòng đợi một chút trước khi thử lại.',
    });
    return false;
  }

  // Rapid debounce (minimum 500ms between calls)
  if (now - record.lastRequest < 500) {
    res.status(429).json({
      error: 'TOO_FAST',
      message: 'Từ từ thôi đại ca ơi, bấm nhanh thế AI lag đấy.',
    });
    return false;
  }

  record.lastRequest = now;
  record.count += 1;
  clientCooldowns.set(ip, record);
  return true;
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey.trim(),
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// ==========================================
// API 1: EVALUATE MEANING (VIETNAMESE EXPLANATION)
// ==========================================
app.post('/api/ai/evaluate-meaning', async (req: Request, res: Response) => {
  if (!checkRateLimit(req, res)) return;

  const { word, expectedDefinition, userAnswer, partOfSpeech, exampleSentence, notes } = req.body;

  // 1. Input Validation
  if (!word || typeof word !== 'string' || word.trim().length === 0 || word.length > 100) {
    return res.status(400).json({ error: 'INVALID_WORD', message: 'Từ vựng tiếng Anh không hợp lệ.' });
  }

  if (
    !expectedDefinition ||
    typeof expectedDefinition !== 'string' ||
    expectedDefinition.trim().length === 0 ||
    expectedDefinition.length > 300
  ) {
    return res.status(400).json({ error: 'INVALID_DEFINITION', message: 'Định nghĩa mục tiêu không hợp lệ.' });
  }

  if (
    !userAnswer ||
    typeof userAnswer !== 'string' ||
    userAnswer.trim().length === 0 ||
    userAnswer.length > 300
  ) {
    return res.status(400).json({ error: 'INVALID_ANSWER', message: 'Vui lòng nhập câu trả lời của đại ca.' });
  }

  // Double-submission lock key
  const dedupeKey = `meaning:${word}:${userAnswer.trim().toLowerCase()}`;
  if (inFlightRequests.has(dedupeKey)) {
    return res.status(429).json({ error: 'IN_FLIGHT', message: 'Yêu cầu đang được AI chấm điểm, vui lòng đợi.' });
  }

  inFlightRequests.add(dedupeKey);
  req.on('close', () => {
    inFlightRequests.delete(dedupeKey);
  });

  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'MISSING_API_KEY',
        message: 'Chưa cấu hình GEMINI_API_KEY trên máy chủ. Hãy cấu hình Secret trong AI Studio.',
      });
    }

    const systemInstruction = `Bạn là chuyên gia khảo thí ngôn ngữ tiếng Anh và tiếng Việt cho ứng dụng "Cạp Cạp Học Tiếng Anh".
Mục tiêu: Đánh giá câu trả lời giải thích nghĩa tiếng Việt của người học đối với từ vựng tiếng Anh mục tiêu.

Quy tắc chấm ngữ nghĩa:
- CORRECT: Người học hiểu và diễn đạt chính xác bản chất nghĩa mục tiêu của từ. CHẤP NHẬN các từ đồng nghĩa tiếng Việt tự nhiên, cách hành văn tương đương (Ví dụ: "die" -> "chết", "thiệt mạng", "mất", "qua đời"; "mitigate" -> "giảm thiểu", "làm giảm bớt tác hại/rủi ro"; "substantial" -> "đáng kể", "rất lớn về số lượng/mức độ"). KHÔNG phạt lỗi dấu câu, viết hoa hoặc diễn đạt ngữ cảnh tự nhiên.
- PARTIALLY_CORRECT: Diễn đạt được một phần nghĩa nhưng chưa trọn vẹn, quá chung chung, hoặc có một phần nhầm lẫn sắc thái nhưng không hoàn toàn sai.
- INCORRECT: Diễn đạt sai bản chất nghĩa, trái nghĩa, hoặc nhầm sang một nét nghĩa khác không khớp với định nghĩa mục tiêu được lưu (Ví dụ: "bank" lưu với nghĩa "ngân hàng" mà người học trả lời "bờ sông" thì là INCORRECT cho nét nghĩa này, cần giải thích từ này đa nghĩa).

Nếu định nghĩa được lưu có nét nghĩa mơ hồ, hãy ghi nhận sự không chắc chắn đó thay vì tự tin phạt người học.
Trả về JSON đúng schema đã định nghĩa.`;

    const promptText = `Hãy đánh giá câu trả lời sau:
- Từ tiếng Anh: "${word.trim()}"
- Định nghĩa mục tiêu đã lưu: "${expectedDefinition.trim()}"
- Từ loại: "${partOfSpeech ? String(partOfSpeech).trim() : 'N/A'}"
- Câu ví dụ gốc: "${exampleSentence ? String(exampleSentence).trim() : 'N/A'}"
- Ghi chú: "${notes ? String(notes).trim() : 'N/A'}"
- Câu trả lời của người học: "${userAnswer.trim()}"`;

    const response = await callGeminiWithFallback(ai, {
      contents: promptText,
      attemptTimeoutMs: 12000,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            verdict: {
              type: Type.STRING,
              description: "Must be exactly 'correct', 'partially_correct', or 'incorrect'",
            },
            confidence: {
              type: Type.NUMBER,
              description: 'Confidence score from 0.0 to 1.0',
            },
            explanationVi: {
              type: Type.STRING,
              description: 'Clear, concise explanation in Vietnamese for why the verdict was given',
            },
            expectedMeaningVi: {
              type: Type.STRING,
              description: 'Accurate suggested Vietnamese meaning',
            },
            userMeaningVi: {
              type: Type.STRING,
              description: "Interpretation of the learner's answer in Vietnamese",
            },
            nuanceNoteVi: {
              type: Type.STRING,
              description: 'Optional nuance note or polysemy reminder in Vietnamese',
            },
          },
          required: ['verdict', 'confidence', 'explanationVi', 'expectedMeaningVi', 'userMeaningVi'],
        },
      },
    });

    const rawJson = response.text?.trim() || '{}';
    let parsed: any;
    try {
      parsed = JSON.parse(rawJson);
    } catch (parseErr) {
      return res.status(502).json({
        error: 'INVALID_AI_OUTPUT',
        message: 'Mô hình AI trả về định dạng không đọc được.',
      });
    }

    // Reconcile verdict to safe values
    let verdict: 'correct' | 'partially_correct' | 'incorrect' = 'incorrect';
    if (parsed.verdict === 'correct' || parsed.verdict === 'partially_correct' || parsed.verdict === 'incorrect') {
      verdict = parsed.verdict;
    }

    const confidence = typeof parsed.confidence === 'number' ? Math.max(0, Math.min(1, parsed.confidence)) : 0.85;

    return res.json({
      verdict,
      confidence,
      explanationVi: String(parsed.explanationVi || 'Đã đánh giá xong nghĩa từ vựng.'),
      expectedMeaningVi: String(parsed.expectedMeaningVi || expectedDefinition),
      userMeaningVi: String(parsed.userMeaningVi || userAnswer),
      nuanceNoteVi: parsed.nuanceNoteVi ? String(parsed.nuanceNoteVi) : undefined,
    });
  } catch (error: any) {
    console.error('Error evaluating meaning with Gemini:', error);
    const errorMessage = error?.message || 'Lỗi không xác định khi gọi Gemini API.';
    if (errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('429')) {
      return res.status(429).json({
        error: 'QUOTA_EXHAUSTED',
        message: 'Gemini đang tạm thời hết hạn mức (Quota). Vui lòng thử lại sau ít phút.',
      });
    }
    if (errorMessage.includes('503') || errorMessage.includes('UNAVAILABLE') || errorMessage.includes('high demand')) {
      return res.status(503).json({
        error: 'SERVICE_UNAVAILABLE',
        message: 'Mô hình AI đang tạm thời quá tải vì nhu cầu cao. Vui lòng bấm thử lại sau vài giây.',
      });
    }
    return res.status(500).json({
      error: 'AI_EVALUATION_FAILED',
      message: `Không thể kết nối đến Gemini: ${errorMessage}`,
    });
  } finally {
    inFlightRequests.delete(dedupeKey);
  }
});

// ==========================================
// API 2: EVALUATE SENTENCE (ENGLISH PRODUCTION)
// ==========================================
app.post('/api/ai/evaluate-sentence', async (req: Request, res: Response) => {
  if (!checkRateLimit(req, res)) return;

  const { word, expectedDefinition, userSentence, partOfSpeech, exampleSentence } = req.body;

  // 1. Input Validation
  if (!word || typeof word !== 'string' || word.trim().length === 0 || word.length > 100) {
    return res.status(400).json({ error: 'INVALID_WORD', message: 'Từ vựng tiếng Anh không hợp lệ.' });
  }

  if (
    !userSentence ||
    typeof userSentence !== 'string' ||
    userSentence.trim().length === 0 ||
    userSentence.length > 500
  ) {
    return res.status(400).json({ error: 'INVALID_SENTENCE', message: 'Vui lòng nhập câu tiếng Anh cần chấm.' });
  }

  const dedupeKey = `sentence:${word}:${userSentence.trim().toLowerCase()}`;
  if (inFlightRequests.has(dedupeKey)) {
    return res.status(429).json({ error: 'IN_FLIGHT', message: 'Câu này đang được chấm điểm, vui lòng đợi.' });
  }

  inFlightRequests.add(dedupeKey);
  req.on('close', () => {
    inFlightRequests.delete(dedupeKey);
  });

  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'MISSING_API_KEY',
        message: 'Chưa cấu hình GEMINI_API_KEY trên máy chủ. Hãy cấu hình Secret trong AI Studio.',
      });
    }

    const systemInstruction = `Bạn là giám khảo tiếng Anh chuyên nghiệp chấm câu viết của người học cho ứng dụng "Cạp Cạp Học Tiếng Anh".
Nhiệm vụ: Đánh giá câu tiếng Anh mà người học đặt bằng từ vựng mục tiêu theo 4 tiêu chí (thang điểm 0 - 4 cho mỗi tiêu chí, tổng tối đa 16 điểm):
1. grammar (0-4): Độ chính xác ngữ pháp, thì, cấu trúc câu, trật tự từ, giới từ, mạo từ.
2. vocabularyUsage (0-4): Sử dụng từ mục tiêu đúng ngữ cảnh và đúng nét nghĩa cần học. Cho phép biến thể hình thái tự nhiên (ví dụ thì quá khứ, tiếp diễn, số nhiều). Nếu câu KHÔNG chứa từ vựng hoặc dùng sai từ loại/nghĩa, điểm tiêu chí này phải <= 1.
3. context (0-4): Tính hợp lý, logic về mặt ngữ nghĩa và tình huống thực tế của câu.
4. naturalness (0-4): Độ tự nhiên, mạch lạc theo thói quen diễn đạt của người bản xứ.

Quy tắc chấm quan trọng:
- Chấp nhận cả biến thể tiếng Anh-Anh (British) và Anh-Mỹ (American).
- Chấp nhận câu đơn giản nhưng đúng. KHÔNG phạt người học vì câu ngắn hoặc cấu trúc cơ bản.
- Phân biệt rõ lỗi ngữ pháp thực sự với cách dùng từ chưa tối ưu.
- Điểm naturalness cao KHÔNG ĐƯỢC bù đắp cho việc dùng sai từ mục tiêu.
- Cung cấp:
  + correctedSentence: Câu sửa lỗi tối thiểu để đúng ngữ pháp.
  + improvedSentence: Câu gợi ý nâng cấp tự nhiên/học thuật hơn nếu cần.
  + grammarIssues: Danh sách lỗi ngữ pháp cụ thể (tiếng Việt).
  + usageIssues: Danh sách lỗi dùng từ mục tiêu cụ thể (tiếng Việt).
  + explanationVi: Giải thích chi tiết và lời khuyên sư phạm (tiếng Việt).
  + feedbackVi: Nhận xét ngắn gọn, mang tính xây dựng (tiếng Việt).
Trả về JSON đúng schema đã định nghĩa.`;

    const promptText = `Hãy đánh giá câu viết sau:
- Từ vựng mục tiêu: "${word.trim()}"
- Nét nghĩa cần học: "${expectedDefinition ? String(expectedDefinition).trim() : 'N/A'}"
- Từ loại: "${partOfSpeech ? String(partOfSpeech).trim() : 'N/A'}"
- Câu mẫu tham khảo: "${exampleSentence ? String(exampleSentence).trim() : 'N/A'}"
- Câu người học viết: "${userSentence.trim()}"`;

    const response = await callGeminiWithFallback(ai, {
      contents: promptText,
      attemptTimeoutMs: 12000,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            verdict: {
              type: Type.STRING,
              description: "'correct', 'partially_correct', or 'incorrect'",
            },
            scores: {
              type: Type.OBJECT,
              properties: {
                grammar: { type: Type.INTEGER, description: 'Grammar score 0-4' },
                vocabularyUsage: { type: Type.INTEGER, description: 'Vocabulary usage score 0-4' },
                context: { type: Type.INTEGER, description: 'Context and logic score 0-4' },
                naturalness: { type: Type.INTEGER, description: 'Naturalness score 0-4' },
              },
              required: ['grammar', 'vocabularyUsage', 'context', 'naturalness'],
            },
            totalScore: { type: Type.INTEGER, description: 'Sum of 4 scores (0-16)' },
            feedbackVi: { type: Type.STRING, description: 'Short constructive feedback in Vietnamese' },
            grammarIssues: { type: Type.ARRAY, items: { type: Type.STRING } },
            usageIssues: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctedSentence: { type: Type.STRING, description: 'Minimally corrected sentence' },
            improvedSentence: { type: Type.STRING, description: 'More natural alternative sentence' },
            explanationVi: { type: Type.STRING, description: 'Pedagogical explanation in Vietnamese' },
          },
          required: [
            'scores',
            'feedbackVi',
            'grammarIssues',
            'usageIssues',
            'correctedSentence',
            'explanationVi',
          ],
        },
      },
    });

    const rawJson = response.text?.trim() || '{}';
    let parsed: any;
    try {
      parsed = JSON.parse(rawJson);
    } catch (parseErr) {
      return res.status(502).json({
        error: 'INVALID_AI_OUTPUT',
        message: 'Mô hình AI trả về định dạng JSON không đọc được.',
      });
    }

    // Clamp score dimensions safely to [0, 4]
    const grammar = Math.max(0, Math.min(4, Number(parsed.scores?.grammar) || 0));
    const vocabularyUsage = Math.max(0, Math.min(4, Number(parsed.scores?.vocabularyUsage) || 0));
    const context = Math.max(0, Math.min(4, Number(parsed.scores?.context) || 0));
    const naturalness = Math.max(0, Math.min(4, Number(parsed.scores?.naturalness) || 0));

    // Calculate deterministic totalScore
    const totalScore = grammar + vocabularyUsage + context + naturalness;

    // Deterministic rubric reconciliation
    let verdict: 'correct' | 'partially_correct' | 'incorrect' = 'incorrect';
    if (totalScore >= 12 && grammar >= 3 && vocabularyUsage >= 3) {
      verdict = 'correct';
    } else if (vocabularyUsage >= 2 && totalScore >= 7) {
      verdict = 'partially_correct';
    } else {
      verdict = 'incorrect';
    }

    return res.json({
      verdict,
      scores: {
        grammar,
        vocabularyUsage,
        context,
        naturalness,
      },
      totalScore,
      feedbackVi: String(parsed.feedbackVi || 'Đã hoàn thành đánh giá câu.'),
      grammarIssues: Array.isArray(parsed.grammarIssues) ? parsed.grammarIssues.map(String) : [],
      usageIssues: Array.isArray(parsed.usageIssues) ? parsed.usageIssues.map(String) : [],
      correctedSentence: String(parsed.correctedSentence || userSentence),
      improvedSentence: String(parsed.improvedSentence || parsed.correctedSentence || userSentence),
      explanationVi: String(parsed.explanationVi || 'Xem chi tiết các lỗi cần cải thiện phía trên.'),
    });
  } catch (error: any) {
    console.error('Error evaluating sentence with Gemini:', error);
    const errorMessage = error?.message || 'Lỗi không xác định khi gọi Gemini API.';
    if (errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('429')) {
      return res.status(429).json({
        error: 'QUOTA_EXHAUSTED',
        message: 'Gemini đang tạm thời hết hạn mức (Quota). Vui lòng thử lại sau ít phút.',
      });
    }
    if (errorMessage.includes('503') || errorMessage.includes('UNAVAILABLE') || errorMessage.includes('high demand')) {
      return res.status(503).json({
        error: 'SERVICE_UNAVAILABLE',
        message: 'Mô hình AI đang tạm thời quá tải vì nhu cầu cao. Vui lòng bấm thử lại sau vài giây.',
      });
    }
    return res.status(500).json({
      error: 'AI_EVALUATION_FAILED',
      message: `Không thể kết nối đến Gemini: ${errorMessage}`,
    });
  } finally {
    inFlightRequests.delete(dedupeKey);
  }
});

// ==========================================
// API 3: ENRICH VOCABULARY WITH AI (QUICK ADD)
// ==========================================
app.post('/api/ai/enrich-vocabulary', async (req: Request, res: Response) => {
  if (!checkRateLimit(req, res)) return;

  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'INVALID_ITEMS', message: 'Danh sách từ vựng cần tra cứu không hợp lệ.' });
  }

  if (items.length > 50) {
    return res.status(400).json({ error: 'TOO_MANY_ITEMS', message: 'Mỗi lần tra cứu tối đa 50 từ để đảm bảo độ chính xác của AI.' });
  }

  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'MISSING_API_KEY',
        message: 'Chưa cấu hình GEMINI_API_KEY trên máy chủ. Hãy cấu hình Secret trong AI Studio.',
      });
    }

    const systemInstruction = `Bạn là trợ lý từ vựng song ngữ Anh-Việt cao cấp cho ứng dụng "Cạp Cạp Học Tiếng Anh".
Nhiệm vụ: Nhận danh sách các từ, cụm từ, phrasal verbs, idioms tiếng Anh (có thể kèm nghĩa gợi ý từ người dùng) và tạo thông tin từ vựng hoàn chỉnh cho từng từ.
Với mỗi mục, bạn cần trả về:
- inputId: giữ nguyên inputId được truyền vào.
- englishWord: từ hoặc cụm từ tiếng Anh chuẩn xác.
- vietnameseDefinition: định nghĩa tiếng Việt tự nhiên, chính xác, súc tích (nếu người dùng có cung cấp userProvidedMeaning, hãy tôn trọng và trau chuốt theo ý đó).
- partOfSpeech: 'noun', 'verb', 'adj', 'adv', 'idiom', 'phrasal_verb', 'collocation', hoặc 'other'.
- exampleSentence: câu ví dụ tiếng Anh tự nhiên, thực tế, có chứa từ vựng đó.
- alternativeMeanings: danh sách các nghĩa phụ hoặc nét nghĩa khác (đặc biệt hữu ích với từ đa nghĩa như "bank", "run", "lead",...). Mỗi phần tử gồm { definition, partOfSpeech }.
- status: 'ready' (hoàn hảo), 'needs_review' (cần người dùng xem lại nét nghĩa), hoặc 'invalid' (từ không có nghĩa hoặc lỗi chính tả nặng).
- reviewNote: ghi chú ngắn gọn bằng tiếng Việt nếu có điểm cần lưu ý (ví dụ: từ đa nghĩa, lưu ý ngữ cảnh).

Trả về mảng JSON đúng schema đã định nghĩa.`;

    const promptText = `Hãy tra cứu và làm giàu danh sách từ vựng sau:\n${JSON.stringify(items, null, 2)}`;

    const response = await callGeminiWithFallback(ai, {
      contents: promptText,
      attemptTimeoutMs: 15000,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              inputId: { type: Type.STRING },
              englishWord: { type: Type.STRING },
              vietnameseDefinition: { type: Type.STRING },
              partOfSpeech: { type: Type.STRING },
              exampleSentence: { type: Type.STRING },
              alternativeMeanings: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    definition: { type: Type.STRING },
                    partOfSpeech: { type: Type.STRING },
                  },
                  required: ['definition', 'partOfSpeech'],
                },
              },
              status: { type: Type.STRING, description: "'ready', 'needs_review', or 'invalid'" },
              reviewNote: { type: Type.STRING },
            },
            required: ['inputId', 'englishWord', 'vietnameseDefinition', 'partOfSpeech', 'exampleSentence', 'status'],
          },
        },
      },
    });

    const rawJson = response.text?.trim() || '[]';
    let parsed: any[];
    try {
      parsed = JSON.parse(rawJson);
      if (!Array.isArray(parsed)) parsed = [];
    } catch (err) {
      return res.status(502).json({ error: 'INVALID_AI_OUTPUT', message: 'AI trả về định dạng JSON không hợp lệ.' });
    }

    return res.json({ results: parsed });
  } catch (error: any) {
    console.error('Error enriching vocabulary with Gemini:', error);
    const errorMessage = error?.message || 'Lỗi không xác định.';
    if (errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('429')) {
      return res.status(429).json({ error: 'QUOTA_EXHAUSTED', message: 'Gemini tạm hết hạn mức quota. Vui lòng thử lại sau.' });
    }
    if (errorMessage.includes('503') || errorMessage.includes('UNAVAILABLE')) {
      return res.status(503).json({ error: 'SERVICE_UNAVAILABLE', message: 'AI đang quá tải, vui lòng thử lại sau vài giây.' });
    }
    return res.status(500).json({ error: 'AI_ENRICH_FAILED', message: `Không thể gọi AI: ${errorMessage}` });
  }
});

// ==========================================
// API 4: RANKED ARENA (ĐẤU TRƯỜNG CẠP CẠP)
// ==========================================
app.use('/api/ranked', createRankedRouter());

// ==========================================
// STATIC / VITE MIDDLEWARE SETUP
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve('dist', 'index.html'));
    });
  } else {
    // In dev, attach Vite middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Cạp Cạp Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
