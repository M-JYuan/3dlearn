/**
 * Cloudflare Pages Function: AI 代理
 * 优先使用 AI_CHAT_BASE_URL、AI_CHAT_API_KEY、AI_CHAT_MODEL。
 * 否则使用 ZHIPU_API_KEY，模型固定为 glm-4-flash。
 */

const ZHIPU_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

function resolveUpstream(env = {}) {
    const baseUrl = String(env.AI_CHAT_BASE_URL || '').trim();
    const apiKey = String(env.AI_CHAT_API_KEY || '').trim();
    const model = String(env.AI_CHAT_MODEL || '').trim();
    if (baseUrl || apiKey || model) {
        if (!baseUrl || !apiKey || !model) {
            return { error: 'AI_CHAT_BASE_URL, AI_CHAT_API_KEY, and AI_CHAT_MODEL must be set together.' };
        }
        const url = new URL(baseUrl);
        if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
            throw new Error('AI chat base URL must use http(s) without credentials');
        }
        const pathName = url.pathname.replace(/\/+$/, '');
        url.pathname = /\/chat\/completions$/i.test(pathName) ? pathName : `${pathName}/chat/completions`;
        url.search = '';
        url.hash = '';
        return { apiKey, model, url: url.toString() };
    }
    if (!env.ZHIPU_API_KEY) return null;
    return { apiKey: env.ZHIPU_API_KEY, model: 'glm-4-flash', url: ZHIPU_API_URL };
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

function redact(value, secret) {
    const text = String(value || '');
    return secret ? text.replaceAll(secret, '[redacted]') : text;
}

function jsonResponse(body, status = 200, extraHeaders = {}) {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store',
            ...extraHeaders
        }
    });
}

function buildCorsHeaders(origin = '*') {
    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
    };
}

export async function onRequestOptions(context) {
    const origin = context.request.headers.get('Origin') || '*';
    return new Response(null, {
        status: 204,
        headers: buildCorsHeaders(origin)
    });
}

export async function onRequestPost(context) {
    const { request, env } = context;
    const origin = request.headers.get('Origin') || '*';
    const corsHeaders = buildCorsHeaders(origin);

    let payload;
    try {
        payload = await request.json();
    } catch {
        return jsonResponse({ error: '请求体不是合法 JSON' }, 400, corsHeaders);
    }

    let upstream;
    try {
        upstream = resolveUpstream(env);
    } catch (error) {
        return jsonResponse({ error: 'AI chat configuration is invalid', details: error.message || String(error) }, 500, corsHeaders);
    }
    if (upstream?.error) return jsonResponse({ error: upstream.error }, 500, corsHeaders);
    if (!upstream) {
        return jsonResponse(
            { error: 'AI chat is not configured', details: 'Set AI_CHAT_BASE_URL, AI_CHAT_API_KEY, and AI_CHAT_MODEL, or set ZHIPU_API_KEY.' },
            500,
            corsHeaders
        );
    }
    const sanitized = sanitizeChatPayload(payload, upstream.model);
    if (sanitized.error) return jsonResponse({ error: sanitized.error }, 400, corsHeaders);

    try {
        const upstreamResponse = await fetch(upstream.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${upstream.apiKey}`
            },
            body: JSON.stringify(sanitized.body),
            redirect: 'error',
            signal: AbortSignal.timeout(30000)
        });

        const text = redact(await upstreamResponse.text(), upstream.apiKey);
        return new Response(text, {
            status: upstreamResponse.status,
            headers: {
                ...corsHeaders,
                'Cache-Control': 'no-store',
                'Content-Type': upstreamResponse.headers.get('Content-Type') || 'application/json; charset=utf-8'
            }
        });
    } catch (error) {
        return jsonResponse(
            { error: 'AI 服务转发失败', details: redact(error.message || String(error), upstream.apiKey) },
            502,
            corsHeaders
        );
    }
}
