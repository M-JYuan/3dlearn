import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';

const source = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');
function appHarness() {
    const elements = new Map();
    const timers = [];
    const frames = [];
    function element(id = '', tag = 'div') {
        const listeners = {};
        const attributes = {};
        let textContent = '';
        const el = {
            id, tagName: tag.toUpperCase(), style: {}, children: [], innerHTML: '', dataset: {}, className: '',
            get textContent() { return textContent || this.children.map(child => child.textContent).join(''); },
            set textContent(value) { textContent = value; this.children = []; },
            setAttribute(name, value) { attributes[name] = value; },
            getAttribute(name) { return attributes[name]; },
            addEventListener(name, callback) { (listeners[name] ||= []).push(callback); },
            dispatchEvent(event) { listeners[event.type]?.forEach(callback => callback(event)); },
            focus() { document.activeElement = this; },
            appendChild(child) { this.children.push(child); if (child.id) elements.set(child.id, child); },
            querySelectorAll(selector) {
                return this.children.flatMap(child => [
                    ...(child.classList.contains(selector.slice(1)) ? [child] : []), ...child.querySelectorAll(selector)
                ]);
            },
            remove() { this.removed = true; elements.delete(this.id); }
        };
        el.classList = {
            contains(name) { return el.className.split(/\s+/).includes(name); },
            add(name) { if (!this.contains(name)) el.className += ` ${name}`; },
            remove(name) { el.className = el.className.split(/\s+/).filter(item => item !== name).join(' '); },
            toggle(name, enabled) { if (enabled) this.add(name); else this.remove(name); }
        };
        return el;
    }
    const document = {
        addEventListener() {}, querySelectorAll() { return []; },
        createElement(tag) { return element('', tag); },
        getElementById(id) {
            if (id === 'scene-intro-modal') return elements.get(id);
            if (!elements.has(id)) elements.set(id, element(id));
            return elements.get(id);
        }
    };
    const context = vm.createContext({
        document, console, window: { innerWidth: 1024 },
        setTimeout(fn) { timers.push(fn); return timers.length; }, clearTimeout() {},
        requestAnimationFrame(fn) { frames.push(fn); }
    });
    vm.runInContext(source, context);
    return { context, document, timers, frames, run(code) { return vm.runInContext(code, context); } };
}

test('delayed startup welcome cannot interrupt a scene chosen while the avatar loads', async () => {
    const app = appHarness();
    app.run(`
        var avatarReady;
        waitForAvatarTutorReady = () => new Promise(resolve => avatarReady = resolve);
        var greetings = [];
        presentAiMessage = text => greetings.push(text);
        scheduleWelcomeMessage();
        state.generationId++;
        avatarReady();
    `);
    await Promise.resolve();
    app.timers.shift()();
    assert.equal(app.run('greetings.length'), 0);
});

function catalogHarness() {
    const app = appHarness();
    app.run(`
        window.CasesConfig = {CASES: [
            {id:'quantum', title:'双缝干涉', description:'量子力学演示', keywords:['观察者'], icon:'fa-atom'},
            {id:'gravity', title:'引力', description:'万有引力模型', keywords:['Gravity'], icon:'fa-atom'},
            {id:'attention', title:'注意力机制', description:'Transformer演示', keywords:['LLM', '大模型'], icon:'fa-brain'},
            {id:'smartmine', title:'智慧矿山', description:'物联网与智能系统', keywords:['矿山'], icon:'fa-robot'}
        ]};
        for (const [id, name] of [['featured','精选场景'], ['physics','物理'], ['ai','AI/算法'], ['all','全部']]) {
            const tab = document.createElement('button');
            tab.className = 'category-tab'; tab.dataset.category = id; tab.textContent = name;
            document.getElementById('category-tabs').appendChild(tab);
        }
        initQuickCases();
    `);
    return app;
}

function searchCatalog(app, value) {
    const input = app.document.getElementById('case-search');
    input.value = value;
    input.dispatchEvent({ type: 'input' });
}

function visibleCases(app) {
    return app.document.getElementById('quick-cases').children.filter(card => !card.hidden).map(card => card.dataset.caseId);
}

test('catalog combines category with case-insensitive title, description and keyword search', () => {
    const app = catalogHarness();
    assert.deepEqual(visibleCases(app), ['quantum', 'gravity', 'smartmine']);
    app.run(`filterCasesByCategory('all');`);
    searchCatalog(app, '  llm  Transformer ');
    assert.deepEqual(visibleCases(app), ['attention']);
    app.run(`filterCasesByCategory('physics');`);
    assert.deepEqual(visibleCases(app), []);
    assert.equal(app.document.getElementById('case-search-empty').hidden, false);
    searchCatalog(app, '观察者');
    assert.deepEqual(visibleCases(app), ['quantum']);
    searchCatalog(app, '引力');
    assert.deepEqual(visibleCases(app), ['gravity']);
    assert.match(app.document.getElementById('case-results-count').textContent, /物理 · 1 个案例/);
});

test('empty results reset clears both filters; Escape only clears query and restores focus', () => {
    const app = catalogHarness();
    searchCatalog(app, 'no results');
    app.document.getElementById('case-search-reset').dispatchEvent({ type: 'click' });
    assert.equal(visibleCases(app).length, 4);
    assert.equal(app.run('activeCategory'), 'all');
    assert.equal(app.document.getElementById('case-search').value, '');
    app.run(`filterCasesByCategory('physics');`);
    searchCatalog(app, 'Gravity');
    const input = app.document.getElementById('case-search');
    input.dispatchEvent({ type: 'keydown', key: 'Escape', preventDefault() {} });
    assert.deepEqual(visibleCases(app), ['quantum', 'gravity']);
    assert.equal(app.document.activeElement, input);
    assert.equal(app.document.getElementById('case-search-clear').hidden, true);
});

test('catalog cards have native button semantics and retain search/category after returning home', () => {
    const app = catalogHarness();
    app.run(`filterCasesByCategory('ai');`);
    searchCatalog(app, '矿山');
    const card = app.document.getElementById('quick-cases').children.find(card => card.dataset.caseId === 'smartmine');
    assert.equal(card.tagName, 'BUTTON');
    assert.equal(card.type, 'button');
    assert.equal(card.getAttribute('aria-label'), '打开智慧矿山');
    assert.equal(card.dataset.type, 'ai');
    card.dispatchEvent({ type: 'click' });
    assert.equal(app.run('state.currentTopic'), 'smartmine');
    app.run('returnToHome();');
    assert.deepEqual(visibleCases(app), ['smartmine']);
    assert.equal(app.document.getElementById('case-search').value, '矿山');
    const active = app.document.getElementById('category-tabs').children.find(tab => tab.dataset.category === 'ai');
    assert.equal(active.getAttribute('aria-pressed'), 'true');
});

test('scene load failure exposes retry and a successful retry clears the failed scene', async () => {
    const app = appHarness();
    app.run(`
        console = { ...console, error() {} };
        var attempts = 0; var loaded = [];
        state.webglReady = true;
        state.sceneManager = {loadScene(scene) { loaded.push(scene); }, resetToEmptyScene() {}, handleResize() {}};
        window.CodeSnippets = {gravity: 'x'};
        window.SceneLoader = {isSceneReady() {return false;}, async ensureSceneLoaded() {
            if (++attempts === 1) throw Object.assign(new Error('timeout'), {code:'SCENE_SCRIPT_TIMEOUT'});
        }};
        window.CasesConfig = {getSceneClass() {return 'GravityScene';}, getIntro() {return null;}};
        var pending = finishGeneration({id:'gravity', title:'万有引力', type:'scene'});
    `);
    app.timers.shift()();
    await app.run('pending');
    assert.equal(app.document.getElementById('scene-load-error').hidden, false);
    assert.match(app.document.getElementById('scene-load-error-message').textContent, /万有引力.*等待超时/);
    app.document.getElementById('scene-load-retry').onclick();
    assert.equal(app.document.getElementById('scene-load-error').hidden, true);
    while (app.frames.length) app.frames.shift()();
    app.timers.shift()();
    for (let i = 0; i < 4; i++) await Promise.resolve();
    assert.equal(app.run('attempts'), 2);
    assert.equal(app.run('loaded.length'), 1);
    assert.equal(app.run('state.currentSceneConfig.id'), 'gravity');
    assert.equal(app.run('state.failedSceneConfig'), null);
});

test('stale failure or stale retry cannot replace a newer selection', async () => {
    const app = appHarness();
    app.run(`
        var rejectOld;
        state.webglReady = true;
        state.sceneManager = {resetToEmptyScene() {}};
        window.SceneLoader = {isSceneReady() {return false;}, ensureSceneLoaded() {return new Promise((r, reject) => rejectOld = reject);}};
        var pending = finishGeneration({id:'old', title:'旧场景', type:'scene'});
    `);
    app.timers.shift()();
    await Promise.resolve();
    app.run(`startGeneration({id:'new'}); rejectOld(new Error('late failure'));`);
    await app.run('pending');
    assert.equal(app.run('state.currentTopic'), 'new');
    assert.equal(app.document.getElementById('scene-load-error').hidden, true);
    app.run(`setSceneLoadError({id:'old', title:'旧场景'}); var staleRetry = document.getElementById('scene-load-retry').onclick;
        startGeneration({id:'newer'}); staleRetry();`);
    assert.equal(app.run('state.currentTopic'), 'newer');
    assert.equal(app.document.getElementById('scene-load-error').hidden, true);
});

test('chat displays user and AI HTML-like content as literal text', () => {
    const app = appHarness();
    app.run(`addMessage('user', '<img src=x onerror=alert(1)>'); addMessage('ai', '<script>alert(1)</script>');`);
    const messages = app.document.getElementById('chat-history').children;
    assert.equal(messages[0].textContent, '<img src=x onerror=alert(1)>');
    assert.equal(messages[1].textContent, '<script>alert(1)</script>');
    assert.equal(messages[0].innerHTML, '');
});

test('returning home invalidates pending scene fetch', async () => {
    const app = appHarness();
    app.run(`
        var loaded = []; var resolveScene;
        state.webglReady = true;
        state.sceneManager = { loadScene(c) { loaded.push(c); }, resetToEmptyScene() {} };
        window.SceneLoader = { isSceneReady() { return true; }, ensureSceneLoaded() { return new Promise(r => resolveScene = r); } };
        window.CasesConfig = { getSceneClass() { return class Scene {}; }, getIntro() { return null; } };
        var pending = finishGeneration({id: 'gravity', type: 'scene', title: 'Gravity'});
    `);
    app.timers.shift()();
    await Promise.resolve();
    app.run('returnToHome(); resolveScene();');
    await app.run('pending');
    assert.equal(app.run('loaded.length'), 0);
    assert.equal(app.run('state.currentSceneConfig'), null);
});

test('new selection invalidates old code animation and preserves code characters', () => {
    const app = appHarness();
    app.run(`window.CodeSnippets = {first: 'a'.repeat(300), second: '<b>'}; startGeneration({id: 'first'}); startGeneration({id: 'second'});`);
    const oldFrame = app.frames.shift();
    oldFrame();
    assert.equal(app.document.getElementById('code-content').textContent, '<b>');
    assert.equal(app.document.getElementById('code-content').innerHTML, '');
});

test('choosing new content stops the old scene before code loading or PPT begins', () => {
    const app = appHarness();
    app.run(`
        var disposedScenes = 0;
        state.webglReady = true;
        state.sceneManager = {currentSceneInstance: {}, resetToEmptyScene() {
            disposedScenes++;
            this.currentSceneInstance = null;
        }};
        window.CodeSnippets = {ppt: 'slides'};
        startGeneration({id: 'ppt', type: 'ppt'});
    `);
    assert.equal(app.run('disposedScenes'), 1);
    assert.equal(app.run('state.sceneManager.currentSceneInstance'), null);
    assert.equal(app.document.getElementById('placeholder-text').style.display, 'flex');
});

test('opening PPT renders its first slide and clamps invalid indexes', () => {
    const app = appHarness();
    app.run(`window.pptSlides = [{title:'Lesson', subtitle:'Intro', content:'Content'}]; switchTab('ppt'); renderSlide(99);`);
    assert.match(app.document.getElementById('slide-container').innerHTML, /Lesson/);
    assert.equal(app.run('state.pptIndex'), 0);
    assert.equal(app.document.getElementById('btn-next').disabled, true);
});

test('a slower previous scene cannot overwrite a newer scene', async () => {
    const app = appHarness();
    app.run(`
        var loaded = []; var requests = {};
        state.webglReady = true;
        state.sceneManager = {loadScene(c) { loaded.push(c); }};
        window.SceneLoader = {isSceneReady() {return true;}, ensureSceneLoaded(c) {return new Promise(r => requests[c.id] = r);}};
        window.CasesConfig = {getSceneClass(id) {return id;}, getIntro() {return null;}};
        var first = finishGeneration({id: 'first', type: 'scene'});
    `);
    app.timers.shift()();
    await Promise.resolve();
    app.run(`state.generationId++; var second = finishGeneration({id: 'second', type: 'scene'});`);
    app.timers.shift()();
    await Promise.resolve();
    app.run(`requests.second();`);
    await app.run('second');
    app.run('requests.first();');
    await app.run('first');
    assert.deepEqual(Array.from(app.run('loaded')), ['second']);
    assert.equal(app.run('state.currentSceneConfig.id'), 'second');
});

test('cancelled AI requests clear thinking without adding an error message', async () => {
    const app = appHarness();
    app.run(`window.AIService = {async chat() {return {success:false, cancelled:true, message:''};}};`);
    await app.run(`handleAIChat('question')`);
    const messages = app.document.getElementById('chat-history').children;
    assert.equal(messages.length, 1);
    assert.match(messages[0].id, /^ai-thinking-/);
    assert.equal(messages[0].removed, true);
    assert.equal(app.run('state.isAIChatting'), false);
});

test('scene selection cancels old AI context and stops old speech immediately', () => {
    const app = appHarness();
    app.run(`
        var stops = 0; var contextCleared = false;
        window.VoiceTutor = {stop() {stops++;}};
        window.AIService = {setSceneContext(value) {contextCleared = value === null;}};
        state.currentSceneConfig = {id:'old'}; state.isAIChatting = true;
        startGeneration({id:'new'});
    `);
    assert.equal(app.run('stops'), 1);
    assert.equal(app.run('contextCleared'), true);
    assert.equal(app.run('state.currentSceneConfig'), null);
    assert.equal(app.run('state.isAIChatting'), false);
});

test('old chat result cannot appear or unlock a new request after navigation', async () => {
    const app = appHarness();
    app.run(`
        var resolveOld;
        window.AIService = {chat() {return new Promise(resolve => resolveOld = resolve);}};
        var pending = handleAIChat('old question');
        returnToHome();
        state.isAIChatting = true;
        resolveOld({success:true, message:'old answer'});
    `);
    await app.run('pending');
    assert.equal(app.run('state.isAIChatting'), true);
    assert.equal(app.document.getElementById('chat-history').children.some(item => item.textContent === 'old answer'), false);
});

test('speech-delayed messages are discarded after navigation and still settle', async () => {
    const app = appHarness();
    app.run(`
        var speechReady;
        window.VoiceTutor = {speak(text, options) {speechReady = options.onAudioReady;}, stop() {}};
        var pending = presentAiMessage('old introduction', {syncWithSpeech:true});
        returnToHome();
        speechReady();
    `);
    await app.run('pending');
    assert.equal(app.document.getElementById('chat-history').children.length, 0);
});
