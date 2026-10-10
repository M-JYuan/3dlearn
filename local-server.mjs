import { createServer } from 'node:http';
import { readFile, realpath } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = __dirname;
const DEFAULT_PORT = 8000;
const GUIDE_FILE = path.join(ROOT_DIR, 'docs', '火山TTS引擎key及指南.txt');
const ZHIPU_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

const MIME_TYPES = new Map([
    ['.html', 'text/html; charset=utf-8'],
    ['.css', 'text/css; charset=utf-8'],
    ['.js', 'text/javascript; charset=utf-8'],
    ['.mjs', 'text/javascript; charset=utf-8'],
    ['.json', 'application/json; charset=utf-8'],
    ['.png', 'image/png'],
    ['.jpg', 'image/jpeg'],
    ['.jpeg', 'image/jpeg'],
    ['.gif', 'image/gif'],
    ['.svg', 'image/svg+xml'],
    ['.mp4', 'video/mp4'],
    ['.mp3', 'audio/mpeg'],
    ['.wav', 'audio/wav']
]);
const PUBLIC_DIRS = new Set(['assets', 'css', 'data', 'js', 'scenes']);
const PUBLIC_EXTENSIONS = new Set([...MIME_TYPES.keys(), '.vrm', '.glb', '.gltf', '.bin', '.webp', '.ico', '.woff', '.woff2']);

export function cleanTtsText(input) {
    return String(input || '')
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 260);
}

export function loadEnvText(text) {
    const values = {};
    for (const rawLine of String(text || '').split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) continue;

        const envMatch = line.match(/^(VOLCANO_TTS_[A-Z_]+|ZHIPU_API_KEY|AI_CHAT_BASE_URL|AI_CHAT_API_KEY|AI_CHAT_MODEL)\s*=\s*(.+)$/);
        if (envMatch) {
            values[envMatch[1]] = stripValue(envMatch[2]);
            continue;
        }

        const pairMatch = line.match(/^([^:=：]+)\s*[:=：]\s*(.+)$/);
        if (!pairMatch) continue;

        const rawKey = stripValue(pairMatch[1]).replace(/[<>]/g, '');
        const normalizedKey = rawKey.toLowerCase().replace(/[\s_-]+/g, '');
        const value = stripValue(pairMatch[2]);
        if (!value || isGuidePlaceholder(value)) continue;

        if (normalizedKey === 'volcanottsappid' || normalizedKey === 'xapiappid' || normalizedKey === 'appid') {
            values.VOLCANO_TTS_APP_ID = value;
        } else if (normalizedKey === 'volcanottsapikey' || normalizedKey === 'xapikey' || normalizedKey === 'apikey') {
            values.VOLCANO_TTS_API_KEY = value;
        } else if (
            normalizedKey === 'volcanottsaccesstoken' ||
            normalizedKey === 'xapiaccesskey' ||
            normalizedKey === 'accesstoken' ||
            normalizedKey === 'token'
        ) {
            values.VOLCANO_TTS_ACCESS_TOKEN = value;
        } else if (normalizedKey === 'volcanottsresourceid' || normalizedKey === 'xapiresourceid' || normalizedKey === 'resourceid') {
            values.VOLCANO_TTS_RESOURCE_ID = value;
        } else if (normalizedKey === 'volcanottscluster' || normalizedKey === 'cluster') {
            values.VOLCANO_TTS_CLUSTER = value;
        } else if (normalizedKey === 'volcanottsvoicetype' || normalizedKey === 'voicetype' || normalizedKey === 'voice') {
            values.VOLCANO_TTS_VOICE_TYPE = value;
        } else if (normalizedKey === 'volcanottsendpoint' || normalizedKey === 'endpoint') {
            values.VOLCANO_TTS_ENDPOINT = value;
        } else if (normalizedKey === 'volcanottsv3endpoint' || normalizedKey === 'v3endpoint') {
            values.VOLCANO_TTS_V3_ENDPOINT = value;
        }
    }
    return values;
}

export function pickVolcanoConfig(envValues = {}, guideValues = {}) {
    const source = { ...guideValues, ...envValues };
    const resourceId = source.VOLCANO_TTS_RESOURCE_ID || '';
    return {
        endpoint: source.VOLCANO_TTS_ENDPOINT || 'https://openspeech.bytedance.com/api/v1/tts',
        v3Endpoint: source.VOLCANO_TTS_V3_ENDPOINT || 'https://openspeech.bytedance.com/api/v3/tts/unidirectional',
        apiKey: source.VOLCANO_TTS_API_KEY || '',
        resourceId,
        appId: source.VOLCANO_TTS_APP_ID || '',
        accessToken: source.VOLCANO_TTS_ACCESS_TOKEN || '',
        cluster: source.VOLCANO_TTS_CLUSTER || 'volcano_tts',
        voiceType: source.VOLCANO_TTS_VOICE_TYPE || defaultVoiceType(resourceId)
    };
}

export function decodeVolcanoAudio(data) {
    const audioBase64 = data?.data || data?.audio || data?.result?.data;
    if (!audioBase64) {
        throw new Error(data?.message || data?.error || 'Volcano TTS response has no audio data');
    }
    return Buffer.from(audioBase64, 'base64');
}

function stripValue(value) {
    return String(value || '')
        .trim()
        .replace(/,$/, '')
        .trim()
        .replace(/^['"“”]|['"“”]$/g, '')
        .trim();
}

function isGuidePlaceholder(value) {
    return /参考|示例|替换为|your-|<.+>|^\[masked\]$/i.test(value);
}

function jsonResponse(res, statusCode, body, headers = {}) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*',
        ...headers
    });
    res.end(JSON.stringify(body));
}

function sendCors(res) {
    res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
    });
    res.end();
}

function redact(value, secret) {
    const text = String(value || 'unknown');
    return secret ? text.replaceAll(secret, '[redacted]') : text;
}

async function readJsonBody(req) {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString('utf8');
    return raw.trim() ? JSON.parse(raw) : {};
}

async function readOptionalEnvFile(filePath) {
    if (!existsSync(filePath)) return {};
    return loadEnvText(await readFile(filePath, 'utf8'));
}

async function getLocalConfig(options = {}) {
    const envValues = options.env || process.env;
    const envFilePath = Object.prototype.hasOwnProperty.call(options, 'envFilePath')
        ? options.envFilePath
        : path.join(ROOT_DIR, '.env');
    const guideFilePath = Object.prototype.hasOwnProperty.call(options, 'guideFilePath')
        ? options.guideFilePath
        : GUIDE_FILE;
    const dotEnvValues = envFilePath ? await readOptionalEnvFile(envFilePath) : {};
    const guideValues = guideFilePath ? await readOptionalEnvFile(guideFilePath) : {};
    const merged = { ...dotEnvValues, ...envValues };
    return {
        volcano: pickVolcanoConfig(merged, guideValues),
        chat: resolveChatUpstream(merged)
    };
}

export function chatCompletionsUrl(baseUrl) {
    const url = new URL(String(baseUrl || '').trim());
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
        throw new Error('AI chat base URL must use http or https');
    }
    if (url.username || url.password) throw new Error('AI chat base URL must not include credentials');
    const pathName = url.pathname.replace(/\/+$/, '');
    url.pathname = /\/chat\/completions$/i.test(pathName) ? pathName : `${pathName}/chat/completions`;
    url.search = '';
    url.hash = '';
    return url.toString();
}

export function resolveChatUpstream(env = {}) {
    const baseUrl = String(env.AI_CHAT_BASE_URL || '').trim();
    const apiKey = String(env.AI_CHAT_API_KEY || '').trim();
    const model = String(env.AI_CHAT_MODEL || '').trim();
    if (baseUrl || apiKey || model) {
        if (!baseUrl || !apiKey || !model) {
            return { error: 'AI_CHAT_BASE_URL, AI_CHAT_API_KEY, and AI_CHAT_MODEL must be set together.' };
        }
        return { source: 'relay', apiKey, model, url: chatCompletionsUrl(baseUrl) };
    }
    const zhipuApiKey = String(env.ZHIPU_API_KEY || '').trim();
    if (!zhipuApiKey) return null;
    return { source: 'zhipu', apiKey: zhipuApiKey, model: 'glm-4-flash', url: ZHIPU_API_URL };
}

function sanitizeChatPayload(payload, model) {
    const messages = Array.isArray(payload?.messages) ? payload.messages : null;
    if (!messages) return { error: 'messages is required' };
    const system = [];
    const rest = [];
    for (const message of messages) {
        if (!message || typeof message !== 'object') continue;
        const role = message.role === 'system' || message.role === 'assistant' || message.role === 'user' ? message.role : '';
        const content = typeof message.content === 'string' ? message.content.trim() : '';
        if (!role || !content) continue;
        const cleaned = { role, content: content.slice(0, role === 'system' ? 8000 : 4000) };
        if (role === 'system') system.push(cleaned);
        else rest.push(cleaned);
    }
    const kept = [...system.slice(0, 1), ...rest.slice(-10)];
    if (!kept.length) return { error: 'messages is required' };
    const temperature = Number(payload?.temperature);
    const maxTokens = Number(payload?.max_tokens);
    return {
        body: {
            model,
            messages: kept,
            temperature: Number.isFinite(temperature) ? Math.min(Math.max(temperature, 0), 1.5) : 0.7,
            max_tokens: Number.isFinite(maxTokens) ? Math.min(Math.max(Math.round(maxTokens), 1), 800) : 500
        }
    };
}

async function handleTts(req, res, configOptions = {}) {
    if (req.method === 'OPTIONS') return sendCors(res);
    if (req.method !== 'POST') return jsonResponse(res, 405, { error: 'Only POST /api/tts is supported' });

    let body;
    try {
        body = await readJsonBody(req);
    } catch {
        return jsonResponse(res, 400, { error: 'Invalid JSON body' });
    }

    const text = cleanTtsText(body?.text);
    if (!text) return jsonResponse(res, 400, { error: 'text is required' });

    const { volcano } = await getLocalConfig(configOptions);
    const speed = Number(body.speed || 1);
    const safeSpeed = Number.isFinite(speed) ? Math.min(Math.max(speed, 0.5), 2) : 1;

    const fetchImpl = configOptions.fetchImpl || fetch;
    if (volcano.apiKey) return synthesizeV3Tts(res, volcano, text, safeSpeed, fetchImpl);
    if (volcano.appId && volcano.accessToken) return synthesizeV1Tts(res, volcano, text, safeSpeed, fetchImpl);

    return jsonResponse(res, 500, {
        error: 'Local TTS is not configured',
        details: 'Set VOLCANO_TTS_API_KEY and VOLCANO_TTS_RESOURCE_ID, or set VOLCANO_TTS_APP_ID and VOLCANO_TTS_ACCESS_TOKEN.'
    });
}

async function synthesizeV3Tts(res, volcano, text, safeSpeed, fetchImpl) {
    if (!volcano.resourceId) {
        return jsonResponse(res, 500, {
            error: 'Local TTS is not configured',
            details: 'VOLCANO_TTS_RESOURCE_ID is required for Volcano TTS V3.'
        });
    }

    const payload = {
        user: { uid: '3dlearn-local' },
        event: 100,
        req_params: {
            text,
            speaker: volcano.voiceType,
            audio_params: {
                format: 'mp3',
                sample_rate: 24000,
                // V3 uses percentage change; V1 uses a speed ratio.
                speech_rate: Math.round((safeSpeed - 1) * 100)
            }
        }
    };

    try {
        const upstream = await fetchImpl(volcano.v3Endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'X-Api-Key': volcano.apiKey,
                'X-Api-Resource-Id': volcano.resourceId,
                'X-Api-Request-Id': crypto.randomUUID()
            },
            body: JSON.stringify(payload),
            redirect: 'error',
            signal: AbortSignal.timeout(30000)
        });

        const textBody = await upstream.text();
        if (!upstream.ok) {
            return jsonResponse(res, 502, {
                error: 'Volcano TTS V3 request failed',
                status: upstream.status,
                details: redact(textBody.slice(0, 500), volcano.apiKey)
            });
        }

        const audio = decodeV3ChunkedAudio(textBody);
        if (!audio.length) {
            return jsonResponse(res, 502, {
                error: 'Volcano TTS V3 returned no audio',
                details: redact(textBody.slice(0, 500), volcano.apiKey)
            });
        }

        return sendAudio(res, audio);
    } catch (error) {
        return jsonResponse(res, 502, {
            error: 'Volcano TTS V3 proxy failed',
            details: redact(error.message, volcano.apiKey)
        });
    }
}

export function decodeV3ChunkedAudio(textBody) {
    const parts = [];
    for (const trimmed of splitJsonObjects(String(textBody || ''))) {
        const data = JSON.parse(trimmed);
        if (data.code === 0 && data.data) parts.push(Buffer.from(data.data, 'base64'));
        if (data.code === 20000000) break;
        if (data.code && data.code !== 0) {
            throw new Error(data.message || `Volcano V3 TTS error: ${data.code}`);
        }
    }
    return Buffer.concat(parts);
}

function defaultVoiceType(resourceId) {
    return String(resourceId || '').includes('seed-tts-2.0')
        ? 'zh_female_xiaohe_uranus_bigtts'
        : 'zh_female_shuangkuaisisi_moon_bigtts';
}

function splitJsonObjects(input) {
    const chunks = [];
    let start = -1;
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let i = 0; i < input.length; i += 1) {
        const char = input[i];
        if (inString) {
            if (escaped) {
                escaped = false;
            } else if (char === '\\') {
                escaped = true;
            } else if (char === '"') {
                inString = false;
            }
            continue;
        }

        if (char === '"') {
            inString = true;
        } else if (char === '{') {
            if (depth === 0) start = i;
            depth += 1;
        } else if (char === '}') {
            depth -= 1;
            if (depth === 0 && start >= 0) {
                chunks.push(input.slice(start, i + 1));
                start = -1;
            }
        }
    }

    return chunks;
}

async function synthesizeV1Tts(res, volcano, text, safeSpeed, fetchImpl) {
    const payload = {
        app: { appid: volcano.appId, token: volcano.accessToken, cluster: volcano.cluster },
        user: { uid: '3dlearn-local' },
        audio: {
            voice_type: volcano.voiceType,
            encoding: 'mp3',
            speed_ratio: safeSpeed,
            volume_ratio: 1,
            pitch_ratio: 1
        },
        request: { reqid: crypto.randomUUID(), text, operation: 'query' }
    };

    try {
        const upstream = await fetchImpl(volcano.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer;${volcano.accessToken}`
            },
            body: JSON.stringify(payload),
            redirect: 'error',
            signal: AbortSignal.timeout(30000)
        });
        const data = await upstream.json().catch(() => null);
        if (!upstream.ok || !data) {
            return jsonResponse(res, 502, {
                error: 'Volcano TTS V1 request failed',
                status: upstream.status,
                details: redact(data?.message || data?.error, volcano.accessToken)
            });
        }
        return sendAudio(res, decodeVolcanoAudio(data));
    } catch (error) {
        return jsonResponse(res, 502, {
            error: 'Volcano TTS V1 proxy failed',
            details: redact(error.message, volcano.accessToken)
        });
    }
}

function sendAudio(res, audio) {
    res.writeHead(200, {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audio.length,
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*'
    });
    res.end(audio);
}

async function handleAiChat(req, res, configOptions = {}) {
    if (req.method === 'OPTIONS') return sendCors(res);
    if (req.method !== 'POST') return jsonResponse(res, 405, { error: 'Only POST /api/ai/chat is supported' });

    let payload;
    try {
        payload = await readJsonBody(req);
    } catch {
        return jsonResponse(res, 400, { error: 'Invalid JSON body' });
    }

    const { chat } = await getLocalConfig(configOptions);
    if (chat?.error) return jsonResponse(res, 500, { error: chat.error });
    if (!chat) {
        return jsonResponse(res, 500, {
            error: 'AI chat is not configured',
            details: 'Set AI_CHAT_BASE_URL, AI_CHAT_API_KEY, and AI_CHAT_MODEL, or set ZHIPU_API_KEY.'
        });
    }

    const sanitized = sanitizeChatPayload(payload, chat.model);
    if (sanitized.error) return jsonResponse(res, 400, { error: sanitized.error });

    const fetchImpl = configOptions.fetchImpl || fetch;
    try {
        const upstream = await fetchImpl(chat.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${chat.apiKey}`
            },
            body: JSON.stringify(sanitized.body),
            redirect: 'error',
            signal: AbortSignal.timeout(30000)
        });
        const text = redact(await upstream.text(), chat.apiKey);
        res.writeHead(upstream.status, {
            'Content-Type': upstream.headers.get('Content-Type') || 'application/json; charset=utf-8',
            'Cache-Control': 'no-store',
            'Access-Control-Allow-Origin': '*'
        });
        res.end(text);
    } catch (error) {
        jsonResponse(res, 502, { error: 'AI proxy failed', details: redact(error.message || String(error), chat.apiKey) });
    }
}

async function serveStatic(req, res, pathname) {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        return jsonResponse(res, 405, { error: 'Only GET and HEAD are supported' });
    }
    const target = pathname === '/' ? '/app.html' : pathname;
    const segments = target.slice(1).split('/');
    const extension = path.extname(target).toLowerCase();
    const publicRootFile = segments.length === 1 && (
        target === '/app.html' || target === '/index.html' ||
        ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.mp4'].includes(extension)
    );
    if (target.includes('\\') || target.includes('\0') ||
        segments.some((segment) => segment.startsWith('.')) ||
        !PUBLIC_EXTENSIONS.has(extension) ||
        (!publicRootFile && !PUBLIC_DIRS.has(segments[0]))) {
        return jsonResponse(res, 403, { error: 'Forbidden' });
    }
    const filePath = path.resolve(ROOT_DIR, `.${target}`);

    if (!filePath.startsWith(ROOT_DIR + path.sep)) return jsonResponse(res, 403, { error: 'Forbidden' });

    try {
        const resolvedPath = await realpath(filePath);
        // Never follow a public-looking symlink into configuration or private source files.
        if (resolvedPath !== filePath) {
            return jsonResponse(res, 403, { error: 'Forbidden' });
        }
        const content = await readFile(resolvedPath);
        res.writeHead(200, {
            'Content-Type': MIME_TYPES.get(path.extname(filePath).toLowerCase()) || 'application/octet-stream',
            'Cache-Control': 'no-cache'
        });
        res.end(req.method === 'HEAD' ? undefined : content);
    } catch {
        jsonResponse(res, 404, { error: 'Not found' });
    }
}

export function createLocalServer(options = {}) {
    return createServer(async (req, res) => {
        try {
            let pathname;
            try {
                pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
            } catch {
                return jsonResponse(res, 400, { error: 'Invalid request URL' });
            }
            if (pathname === '/api/tts') return await handleTts(req, res, options);
            if (pathname === '/api/ai/chat') return await handleAiChat(req, res, options);
            if (pathname.startsWith('/api/')) return jsonResponse(res, 404, { error: 'Not found' });
            return await serveStatic(req, res, pathname);
        } catch (error) {
            return jsonResponse(res, 500, { error: 'Local server error', details: error.message || String(error) });
        }
    });
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
    const port = Number(process.env.PORT || DEFAULT_PORT);
    createLocalServer().listen(port, () => {
        console.log(`3Dlearn local server: http://localhost:${port}/app.html`);
        console.log('Static files + /api/ai/chat + /api/tts are served from one HTTP origin.');
    });
}
