import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

async function load(fetch) {
    const context = { window: {}, fetch, AbortController, setTimeout, clearTimeout, console: { error() {} } };
    vm.runInNewContext(await readFile(new URL('../js/ai-service.js', import.meta.url), 'utf8'), context);
    return context.window.AIService;
}
const reply = (content) => ({ ok: true, json: async () => ({ choices: [{ message: { content } }] }) });

test('late AI response is cancelled after switching scenes', async () => {
    let finish;
    const ai = await load(() => new Promise(resolve => { finish = resolve; }));
    ai.setSceneContext({ id: 'old' });
    const pending = ai.chat('old question');
    ai.setSceneContext({ id: 'new' });
    finish(reply('old reply'));
    assert.equal((await pending).cancelled, true);
    assert.equal(ai.conversationHistory.length, 0);
});

test('failed AI turns are not retained and empty responses are rejected', async () => {
    const ai = await load(async () => reply(null));
    assert.equal((await ai.chat('question')).success, false);
    assert.equal(ai.conversationHistory.length, 0);
});

test('AI history keeps at most five complete turns', async () => {
    const ai = await load(async () => reply('answer'));
    for (let i = 0; i < 8; i++) assert.equal((await ai.chat(`q${i}`)).success, true);
    assert.equal(ai.conversationHistory.length, 10);
    assert.equal(ai.conversationHistory[0].content, 'q3');
    assert.equal(ai.conversationHistory[0].role, 'user');
});

test('new requests supersede in-flight turns without mixing their histories', async () => {
    const finishes = [];
    const ai = await load(() => new Promise(resolve => finishes.push(resolve)));
    const first = ai.chat('first');
    const second = ai.chat('second');
    finishes[1](reply('second answer'));
    assert.equal((await second).success, true);
    finishes[0](reply('first answer'));
    assert.equal((await first).cancelled, true);
    assert.equal(ai.conversationHistory.length, 2);
    assert.equal(ai.conversationHistory[0].content, 'second');
});

test('AI timeout returns a retryable error and leaves no partial turn', async () => {
    const ai = await load((url, options) => new Promise((resolve, reject) => {
        options.signal.addEventListener('abort', () => reject(new DOMException('timeout', 'AbortError')));
    }));
    ai.REQUEST_TIMEOUT_MS = 5;
    const result = await ai.chat('question');
    assert.equal(result.success, false);
    assert.match(result.message, /超时/);
    assert.equal(ai.conversationHistory.length, 0);
    assert.equal(ai.abortController, null);
});
