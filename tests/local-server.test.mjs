import test from 'node:test';
import assert from 'node:assert/strict';

import {
    chatCompletionsUrl,
    cleanTtsText,
    createLocalServer,
    decodeV3ChunkedAudio,
    decodeVolcanoAudio,
    loadEnvText,
    pickVolcanoConfig,
    resolveChatUpstream
} from '../local-server.mjs';

test('cleanTtsText strips markup, collapses whitespace, and limits length', () => {
    const result = cleanTtsText('<b>hello</b>\n\nstudent   '.repeat(80));

    assert.equal(result.includes('<b>'), false);
    assert.equal(result.includes('\n'), false);
    assert.equal(result.length, 260);
});

test('loadEnvText reads explicit env style values without leaking unknown lines', () => {
    const values = loadEnvText(`
VOLCANO_TTS_APP_ID=app-from-env
VOLCANO_TTS_ACCESS_TOKEN=token-from-env
VOLCANO_TTS_CLUSTER=volcano_tts
VOLCANO_TTS_VOICE_TYPE=BV001_streaming
note: this line should be ignored
`);

    assert.deepEqual(values, {
        VOLCANO_TTS_APP_ID: 'app-from-env',
        VOLCANO_TTS_ACCESS_TOKEN: 'token-from-env',
        VOLCANO_TTS_CLUSTER: 'volcano_tts',
        VOLCANO_TTS_VOICE_TYPE: 'BV001_streaming'
    });
});

test('loadEnvText reads official Volcano guide header names', () => {
    const values = loadEnvText(`
    "X-Api-App-Id": "123456789",
    "X-Api-Access-Key": "access-token-value",
    "X-Api-Key": "api-key-value",
    "X-Api-Resource-Id": "volc.service_type.10029"
`);

    assert.equal(values.VOLCANO_TTS_APP_ID, '123456789');
    assert.equal(values.VOLCANO_TTS_ACCESS_TOKEN, 'access-token-value');
    assert.equal(values.VOLCANO_TTS_API_KEY, 'api-key-value');
    assert.equal(values.VOLCANO_TTS_RESOURCE_ID, 'volc.service_type.10029');
});

test('pickVolcanoConfig prefers process env over guide file values', () => {
    const config = pickVolcanoConfig(
        {
            VOLCANO_TTS_APP_ID: 'env-app',
            VOLCANO_TTS_ACCESS_TOKEN: 'env-token'
        },
        {
            VOLCANO_TTS_APP_ID: 'guide-app',
            VOLCANO_TTS_ACCESS_TOKEN: 'guide-token',
            VOLCANO_TTS_CLUSTER: 'guide-cluster'
        }
    );

    assert.equal(config.appId, 'env-app');
    assert.equal(config.accessToken, 'env-token');
    assert.equal(config.cluster, 'guide-cluster');
});

test('pickVolcanoConfig chooses a TTS 2.0 speaker for seed-tts-2.0 resources', () => {
    const config = pickVolcanoConfig({}, { VOLCANO_TTS_RESOURCE_ID: 'seed-tts-2.0' });

    assert.equal(config.voiceType, 'zh_female_xiaohe_uranus_bigtts');
});

test('decodeVolcanoAudio accepts base64 data from Volcano HTTP TTS response', () => {
    const buffer = decodeVolcanoAudio({ data: Buffer.from('audio').toString('base64') });

    assert.equal(Buffer.isBuffer(buffer), true);
    assert.equal(buffer.toString('utf8'), 'audio');
});

test('decodeV3ChunkedAudio accepts newline and concatenated JSON events', () => {
    const first = JSON.stringify({ code: 0, data: Buffer.from('au').toString('base64') });
    const second = JSON.stringify({ code: 0, data: Buffer.from('dio').toString('base64') });
    const done = JSON.stringify({ code: 20000000 });

    assert.equal(decodeV3ChunkedAudio(`${first}\n${second}\n${done}`).toString('utf8'), 'audio');
    assert.equal(decodeV3ChunkedAudio(`${first}${second}${done}`).toString('utf8'), 'audio');
});

test('local AI chat returns a configuration error when ZHIPU_API_KEY is missing', async () => {
    const server = createLocalServer({
        env: {},
        envFilePath: null,
        guideFilePath: null
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

    try {
        const { port } = server.address();
        const response = await fetch(`http://127.0.0.1:${port}/api/ai/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: [{ role: 'user', content: 'hello' }] })
        });
        const body = await response.json();

        assert.equal(response.status, 500);
        assert.match(body.error, /not configured/);
        assert.match(body.details, /ZHIPU_API_KEY/);
    } finally {
        await new Promise((resolve) => server.close(resolve));
    }
});

test('relay chat config replaces the browser model and keeps the key on the server', async () => {
    const requests = [];
    const server = createLocalServer({
        env: {
            AI_CHAT_BASE_URL: 'https://sub2api.komaapi.com/v1',
            AI_CHAT_API_KEY: 'secret-relay',
            AI_CHAT_MODEL: 'grok-4.6'
        },
        envFilePath: null,
        guideFilePath: null,
        fetchImpl: async (url, init) => {
            requests.push({ url, body: JSON.parse(init.body), authorization: init.headers.Authorization });
            return {
                status: 200,
                headers: { get: () => 'application/json' },
                text: async () => JSON.stringify({ choices: [{ message: { content: '好' } }], echo: 'secret-relay' })
            };
        }
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

    try {
        const { port } = server.address();
        const response = await fetch(`http://127.0.0.1:${port}/api/ai/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'glm-4-flash',
                messages: [{ role: 'user', content: '你好' }],
                max_tokens: 500
            })
        });
        const body = await response.json();
        assert.equal(response.status, 200);
        assert.equal(body.choices[0].message.content, '好');
        assert.equal(JSON.stringify(body).includes('secret-relay'), false);
        assert.equal(requests[0].url, 'https://sub2api.komaapi.com/v1/chat/completions');
        assert.equal(requests[0].authorization, 'Bearer secret-relay');
        assert.equal(requests[0].body.model, 'grok-4.6');
        assert.equal(chatCompletionsUrl('https://sub2api.komaapi.com/v1/'), requests[0].url);
        assert.equal(resolveChatUpstream({ ZHIPU_API_KEY: 'z' }).model, 'glm-4-flash');
    } finally {
        await new Promise((resolve) => server.close(resolve));
    }
});

async function withLocalServer(run) {
    const server = createLocalServer({ env: {}, envFilePath: null, guideFilePath: null });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    try {
        await run(`http://127.0.0.1:${server.address().port}`);
    } finally {
        await new Promise((resolve) => server.close(resolve));
    }
}

test('static serving exposes application assets but blocks configuration and private files', async () => {
    await withLocalServer(async (base) => {
        for (const resource of ['/', '/app.html', '/js/app.js', '/css/main.css', '/data/cases-config.js', '/scenes/maze-scene.js']) {
            const response = await fetch(base + resource);
            assert.equal(response.status, 200, resource);
            await response.arrayBuffer();
        }
        for (const resource of ['/.env', '/.git/config', '/local-server.mjs', '/functions/api/tts.js', '/docs/keys.txt', '/debug.log', '/assets/%2e%2e%2f.env', '/%2e%2e%2f3dlearn-private/secret.js']) {
            const response = await fetch(base + resource);
            assert.equal(response.status, 403, resource);
            await response.arrayBuffer();
        }
    });
});

test('invalid URL encoding is a client error and API routes require exact paths', async () => {
    await withLocalServer(async (base) => {
        assert.equal((await fetch(base + '/bad%ZZ')).status, 400);
        assert.equal((await fetch(base + '/api/tts-extra', { method: 'POST' })).status, 404);
        assert.equal((await fetch(base + '/api/ai/chat-extra', { method: 'POST' })).status, 404);
    });
});

test('null TTS payload is rejected without a server exception', async () => {
    await withLocalServer(async (base) => {
        const response = await fetch(base + '/api/tts', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: 'null'
        });
        assert.equal(response.status, 400);
        assert.equal((await response.json()).error, 'text is required');
    });
});

test('static requests support HEAD and reject mutation methods', async () => {
    await withLocalServer(async (base) => {
        const head = await fetch(base + '/app.html', { method: 'HEAD' });
        assert.equal(head.status, 200);
        assert.equal(await head.text(), '');
        assert.equal((await fetch(base + '/app.html', { method: 'POST' })).status, 405);
    });
});

test('TTS proxies return audio through the configured transport and redact transport errors', async () => {
    for (const version of ['v1', 'v3']) {
        let shouldFail = false;
        const server = createLocalServer({
            env: version === 'v3'
                ? { VOLCANO_TTS_API_KEY: 'tts-secret', VOLCANO_TTS_RESOURCE_ID: 'seed-tts-2.0' }
                : { VOLCANO_TTS_APP_ID: 'app', VOLCANO_TTS_ACCESS_TOKEN: 'tts-secret' },
            envFilePath: null,
            guideFilePath: null,
            fetchImpl: async (_url, init) => {
                assert.ok(init.signal instanceof AbortSignal);
                assert.equal(init.redirect, 'error');
                if (shouldFail) throw new Error('request failed with tts-secret');
                const encoded = Buffer.from('audio').toString('base64');
                return {
                    ok: true,
                    text: async () => JSON.stringify({ code: 0, data: encoded }),
                    json: async () => ({ data: encoded })
                };
            }
        });
        await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
        try {
            const request = () => fetch(`http://127.0.0.1:${server.address().port}/api/tts`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: '你好' })
            });
            const success = await request();
            assert.equal(success.status, 200, version);
            assert.equal(success.headers.get('content-type'), 'audio/mpeg');
            assert.equal(await success.text(), 'audio');
            shouldFail = true;
            const failure = await request();
            assert.equal(failure.status, 502, version);
            assert.doesNotMatch(await failure.text(), /tts-secret/);
        } finally {
            await new Promise((resolve) => server.close(resolve));
        }
    }
});

test('local TTS converts V3 speed ratios to percentage changes', async () => {
    const rates = [];
    const server = createLocalServer({
        env: { VOLCANO_TTS_API_KEY: 'test', VOLCANO_TTS_RESOURCE_ID: 'seed-tts-2.0' },
        envFilePath: null, guideFilePath: null,
        fetchImpl: async (_url, init) => {
            rates.push(JSON.parse(init.body).req_params.audio_params.speech_rate);
            return { ok: true, text: async () => JSON.stringify({ code: 0, data: Buffer.from('audio').toString('base64') }) };
        }
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    try {
        for (const speed of [undefined, 0.5, 1.5, 2]) {
            const response = await fetch(`http://127.0.0.1:${server.address().port}/api/tts`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: '你好', speed })
            });
            assert.equal(response.status, 200);
            await response.arrayBuffer();
        }
        assert.deepEqual(rates, [0, -50, 50, 100]);
    } finally {
        await new Promise(resolve => server.close(resolve));
    }
});
