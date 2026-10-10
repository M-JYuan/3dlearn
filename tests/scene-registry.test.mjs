import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

test('every registered scene loads its assets and exposes the configured class', async () => {
    const root = new URL('../', import.meta.url);
    const window = {};
    let context;
    const loaded = [];
    const document = {
        createElement() { return { remove() {} }; },
        body: {
            appendChild(script) {
                const sourcePath = script.src.split('?')[0];
                readFile(new URL(sourcePath, root), 'utf8').then(source => {
                    vm.runInContext(source, context, { filename: sourcePath });
                    loaded.push(sourcePath);
                    script.onload();
                }).catch(() => script.onerror());
            }
        }
    };
    context = vm.createContext({ window, document, console, setTimeout, clearTimeout });
    for (const file of ['data/cases-config.js', 'js/scene-loader.js']) {
        vm.runInContext(await readFile(new URL(file, root), 'utf8'), context, { filename: file });
    }
    const cases = window.CasesConfig.CASES.filter(item => item.type === 'scene');
    const ids = new Set(cases.map(item => item.id));
    assert.equal(ids.size, cases.length, 'scene ids must be unique');
    for (const config of cases) {
        const before = loaded.length;
        await window.SceneLoader.ensureSceneLoaded(config);
        assert.ok(loaded.length > before, `${config.id}: missing lazy assets`);
        assert.equal(typeof window.CasesConfig.getSceneClass(config.id), 'function', `${config.id}: missing scene class`);
        assert.equal(window.SceneLoader.isSceneReady(config.id), true);
        await window.SceneLoader.ensureSceneLoaded(config);
        assert.equal(loaded.length, before + (config.id === 'smartmine' ? 2 : 1), 'assets should be cached');
    }
});
