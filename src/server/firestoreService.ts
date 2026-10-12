import firebaseConfigData from '../../firebase-applet-config.json';
import type { RankedProfile, RankedMatchResult } from '../types';

export const TARGET_PROJECT_ID = firebaseConfigData.projectId || 'noted-sphinx-9dtd0';
export const TARGET_DATABASE_ID =
  firebaseConfigData.firestoreDatabaseId || 'ai-studio-cpcp-0520ee62-0383-4b20-b948-cb813c3da19a';
export const REQUIRED_IAM_ROLE = 'roles/datastore.user';

export interface FirestoreProbeResult {
  available: boolean;
  httpStatus: number;
  message: string;
  serviceAccount: string;
  testedAt: number;
  targetProject: string;
  targetDatabase: string;
}

let cachedServiceAccount = '';

async function getRuntimeServiceAccountEmail(): Promise<string> {
  if (cachedServiceAccount) return cachedServiceAccount;
  try {
    const res = await fetch('http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/email', {
      headers: { 'Metadata-Flavor': 'Google' },
    });
    if (res.ok) {
      cachedServiceAccount = (await res.text()).trim();
      return cachedServiceAccount;
    }
  } catch (err) {
    console.warn('Metadata server email lookup failed:', err);
  }
  return process.env.AUTHORIZED_SERVICE_ACCOUNT_EMAIL || 'ais-sandbox@ais-asia-east1-ad3b2b5ecb484e5.iam.gserviceaccount.com';
}

async function getAccessToken(): Promise<string | null> {
  try {
    const res = await fetch('http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token', {
      headers: { 'Metadata-Flavor': 'Google' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.access_token || null;
  } catch (err) {
    console.error('Failed to retrieve metadata access token:', err);
    return null;
  }
}

function getBaseDocumentUrl(): string {
  return `https://firestore.googleapis.com/v1/projects/${TARGET_PROJECT_ID}/databases/${TARGET_DATABASE_ID}/documents`;
}

/**
 * Executes a minimal, non-destructive read/write probe on a dedicated test path
 * (_preflight_probes/test_rw) to verify actual Firestore IAM access without touching user data.
 */
export async function probeNamedDatabaseAccess(): Promise<FirestoreProbeResult> {
  const saEmail = await getRuntimeServiceAccountEmail();
  const token = await getAccessToken();

  if (!token) {
    return {
      available: false,
      httpStatus: 503,
      message: 'Không thể lấy Access Token từ máy chủ Metadata của Google Cloud Run.',
      serviceAccount: saEmail,
      testedAt: Date.now(),
      targetProject: TARGET_PROJECT_ID,
      targetDatabase: TARGET_DATABASE_ID,
    };
  }

  const probePath = `${getBaseDocumentUrl()}/_preflight_probes/test_rw`;

  try {
    // 1. Try reading test document
    const getRes = await fetch(probePath, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (getRes.status === 403) {
      return {
        available: false,
        httpStatus: 403,
        message: `PERMISSION_DENIED: Service Account [${saEmail}] chưa được cấp quyền [${REQUIRED_IAM_ROLE}] trên dự án [${TARGET_PROJECT_ID}].`,
        serviceAccount: saEmail,
        testedAt: Date.now(),
        targetProject: TARGET_PROJECT_ID,
        targetDatabase: TARGET_DATABASE_ID,
      };
    }

    if (getRes.status === 404 || getRes.ok) {
      // 2. Test writing a temporary test record
      const patchRes = await fetch(probePath, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: {
            probeTime: { integerValue: String(Date.now()) },
            tester: { stringValue: saEmail },
          },
        }),
      });

      if (!patchRes.ok) {
        const errText = await patchRes.text();
        return {
          available: false,
          httpStatus: patchRes.status,
          message: `Lỗi ghi Firestore test document (${patchRes.status}): ${errText}`,
          serviceAccount: saEmail,
          testedAt: Date.now(),
          targetProject: TARGET_PROJECT_ID,
          targetDatabase: TARGET_DATABASE_ID,
        };
      }

      // 3. Clean up probe document
      await fetch(probePath, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      return {
        available: true,
        httpStatus: 200,
        message: 'Xác minh thành công: Máy chủ có toàn quyền đọc/ghi trên Named Database.',
        serviceAccount: saEmail,
        testedAt: Date.now(),
        targetProject: TARGET_PROJECT_ID,
        targetDatabase: TARGET_DATABASE_ID,
      };
    }

    return {
      available: false,
      httpStatus: getRes.status,
      message: `HTTP ${getRes.status}: ${await getRes.text()}`,
      serviceAccount: saEmail,
      testedAt: Date.now(),
      targetProject: TARGET_PROJECT_ID,
      targetDatabase: TARGET_DATABASE_ID,
    };
  } catch (err: any) {
    return {
      available: false,
      httpStatus: 500,
      message: `Lỗi mạng khi gọi Firestore REST API: ${err?.message}`,
      serviceAccount: saEmail,
      testedAt: Date.now(),
      targetProject: TARGET_PROJECT_ID,
      targetDatabase: TARGET_DATABASE_ID,
    };
  }
}

// ==========================================
// FIRESTORE JSON CONVERTERS
// ==========================================
function toFirestoreFields(obj: Record<string, any>): Record<string, any> {
  const fields: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null) continue;
    if (typeof value === 'string') {
      fields[key] = { stringValue: value };
    } else if (typeof value === 'number') {
      if (Number.isInteger(value)) {
        fields[key] = { integerValue: String(value) };
      } else {
        fields[key] = { doubleValue: value };
      }
    } else if (typeof value === 'boolean') {
      fields[key] = { booleanValue: value };
    } else if (Array.isArray(value)) {
      fields[key] = {
        arrayValue: {
          values: value.map((v) =>
            typeof v === 'object' ? { mapValue: { fields: toFirestoreFields(v) } } : { stringValue: String(v) }
          ),
        },
      };
    } else if (typeof value === 'object') {
      fields[key] = { mapValue: { fields: toFirestoreFields(value) } };
    }
  }
  return fields;
}

function fromFirestoreFields(fields: Record<string, any>): Record<string, any> {
  const res: Record<string, any> = {};
  for (const [key, val] of Object.entries(fields || {})) {
    if (val.stringValue !== undefined) res[key] = val.stringValue;
    else if (val.integerValue !== undefined) res[key] = parseInt(val.integerValue, 10);
    else if (val.doubleValue !== undefined) res[key] = val.doubleValue;
    else if (val.booleanValue !== undefined) res[key] = val.booleanValue;
    else if (val.arrayValue !== undefined) {
      res[key] = (val.arrayValue.values || []).map((item: any) => {
        if (item.mapValue) return fromFirestoreFields(item.mapValue.fields);
        return item.stringValue ?? item.integerValue ?? item.booleanValue;
      });
    } else if (val.mapValue !== undefined) {
      res[key] = fromFirestoreFields(val.mapValue.fields);
    }
  }
  return res;
}

// ==========================================
// PERSISTENT RANKED OPERATIONS
// ==========================================
export async function getRankedProfileFromFirestore(userId: string): Promise<RankedProfile | null> {
  const token = await getAccessToken();
  if (!token) return null;

  const url = `${getBaseDocumentUrl()}/rankedProfiles/${encodeURIComponent(userId)}`;
  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return null;
    const doc = await res.json();
    if (!doc.fields) return null;
    return fromFirestoreFields(doc.fields) as RankedProfile;
  } catch (err) {
    console.error('Error fetching ranked profile from Firestore:', err);
    return null;
  }
}

export async function saveRankedProfileToFirestore(profile: RankedProfile): Promise<boolean> {
  const token = await getAccessToken();
  if (!token) return false;

  const url = `${getBaseDocumentUrl()}/rankedProfiles/${encodeURIComponent(profile.userId)}`;
  try {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields: toFirestoreFields(profile) }),
    });
    return res.ok;
  } catch (err) {
    console.error('Error saving ranked profile to Firestore:', err);
    return false;
  }
}

export async function saveRankedMatchToFirestore(match: RankedMatchResult, userId: string): Promise<boolean> {
  const token = await getAccessToken();
  if (!token) return false;

  const url = `${getBaseDocumentUrl()}/rankedMatches/${encodeURIComponent(match.matchId)}`;
  try {
    const docData = {
      ...match,
      userId,
    };
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields: toFirestoreFields(docData) }),
    });
    return res.ok;
  } catch (err) {
    console.error('Error saving match record to Firestore:', err);
    return false;
  }
}

export async function getRankedMatchFromFirestore(matchId: string): Promise<RankedMatchResult | null> {
  const token = await getAccessToken();
  if (!token) return null;

  const url = `${getBaseDocumentUrl()}/rankedMatches/${encodeURIComponent(matchId)}`;
  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return null;
    const doc = await res.json();
    if (!doc.fields) return null;
    return fromFirestoreFields(doc.fields) as RankedMatchResult;
  } catch (err) {
    console.error('Error getting match record from Firestore:', err);
    return null;
  }
}
