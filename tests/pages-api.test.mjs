import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

async function load(file) {
    return import(`data:text/javascript;base64,${Buffer.from(await readFile(new URL(file, import.meta.url))).toString('base64')}`);
}
const chat = await load('../functions/api/ai/chat.js');
const tts = await load('../functions/api/tts.js');
const request = body => new Request('https://classroom.test/api', { method: 'POST', body: JSON.stringify(body) });

test('Pages chat rejects invalid messages before contacting upstream', async t => {
    t.mock.method(globalThis, 'fetch', () => { throw new Error('should not fetch'); });
    const response = await chat.onRequestPost({ request: request(null), env: { ZHIPU_API_KEY: 'test' } });
    assert.equal(response.status, 400);
});

test('Pages chat pins configured model and bounds input like local server', async t => {
    let payload;
    t.mock.method(globalThis, 'fetch', async (url, options) => {
        payload = JSON.parse(options.body);
        return new Response(JSON.stringify({ choices: [] }));
    });
    const response = await chat.onRequestPost({ request: request({ model: 'untrusted', stream: true, messages: [{ role: 'user', content: 'question' }], max_tokens: 99999 }), env: { ZHIPU_API_KEY: 'test' } });
    assert.equal(response.status, 200);
    assert.equal(payload.model, 'glm-4-flash');
    assert.equal(payload.max_tokens, 800);
    assert.equal(payload.stream, undefined);
});

test('Pages TTS converts speed ratio to V3 percentage', async t => {
    const rates = [];
    t.mock.method(globalThis, 'fetch', async (url, options) => {
        rates.push(JSON.parse(options.body).req_params.audio_params.speech_rate);
        return new Response(JSON.stringify({ code: 0, data: btoa('audio') }) + JSON.stringify({ code: 20000000 }));
    });
    for (const speed of [1, 0.5, 1.5, 2]) {
        const response = await tts.onRequestPost({ request: request({ text: '你好', speed }), env: { VOLCANO_TTS_API_KEY: 'test', VOLCANO_TTS_RESOURCE_ID: 'seed-tts-2.0' } });
        assert.equal(response.status, 200);
        assert.equal(await response.text(), 'audio');
    }
    assert.deepEqual(rates, [0, -50, 50, 100]);
});

test('Pages chat redacts upstream credentials on success and transport failure', async t => {
    let shouldFail = false;
    t.mock.method(globalThis, 'fetch', async (_url, options) => {
        assert.ok(options.signal instanceof AbortSignal);
        assert.equal(options.redirect, 'error');
        if (shouldFail) throw new Error('failed: upstream-secret');
        return new Response(JSON.stringify({ message: 'upstream-secret' }));
    });
    const context = () => ({ request: request({ messages: [{ role: 'user', content: 'question' }] }), env: { ZHIPU_API_KEY: 'upstream-secret' } });
    const success = await chat.onRequestPost(context());
    assert.equal(success.status, 200);
    assert.equal(success.headers.get('Cache-Control'), 'no-store');
    assert.doesNotMatch(await success.text(), /upstream-secret/);
    shouldFail = true;
    const failure = await chat.onRequestPost(context());
    assert.equal(failure.status, 502);
    assert.doesNotMatch(await failure.text(), /upstream-secret/);
});

test('Pages TTS handles null body and bounds both upstream requests', async t => {
    const response = await tts.onRequestPost({ request: request(null), env: {} });
    assert.equal(response.status, 400);
    t.mock.method(globalThis, 'fetch', async (_url, options) => {
        assert.ok(options.signal instanceof AbortSignal);
        assert.equal(options.redirect, 'error');
        throw new Error('transport timeout');
    });
    for (const env of [
        { VOLCANO_TTS_APP_ID: 'app', VOLCANO_TTS_ACCESS_TOKEN: 'secret' },
        { VOLCANO_TTS_API_KEY: 'secret', VOLCANO_TTS_RESOURCE_ID: 'seed-tts-2.0' }
    ]) {
        const result = await tts.onRequestPost({ request: request({ text: '你好' }), env });
        assert.equal(result.status, 502);
        assert.equal(result.headers.get('Cache-Control'), 'no-store');
    }
});
