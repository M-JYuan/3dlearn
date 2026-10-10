import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

async function load(stored = null, storage = null) {
    const context = vm.createContext({ window: {}, console: { warn() {} }, localStorage: storage || { getItem: () => stored, setItem() {} } });
    for (const file of ['data/learning-path-config.js', 'data/quiz-bank.js', 'js/learning-engine.js']) {
        vm.runInContext(await readFile(new URL('../' + file, import.meta.url), 'utf8'), context);
    }
    return context.window;
}
const scene = 'quadratic-function';

test('unknown steps and exploration actions cannot bypass learning gates', async () => {
    const { LearningEngine: engine } = await load();
    assert.equal(engine.canAccessStep(scene, 'unknown'), false);
    assert.equal(engine.canAccessStep(scene, 'read'), true);
    assert.equal(engine.canAccessStep(scene, 'practice'), false);
    for (let i = 0; i < 10; i++) {
        assert.equal(engine.completeStep(scene, `invalid-${i}`), false);
        assert.equal(engine.recordExplore(scene, `invalid-${i}`), false);
    }
    assert.equal(engine.getScore(scene), 0);
    assert.equal(engine.canStartQuiz(scene), false);
    assert.equal(engine.createSession('toString'), null);
});

test('grading uses the configured question and rejects invalid answers', async () => {
    const { LearningEngine: engine, QuizBank } = await load();
    assert.equal(engine.submitAnswer(scene, null, undefined).reason, 'question-missing');
    assert.equal(engine.submitAnswer(scene, { id: 'unknown' }, 'yes').reason, 'question-missing');
    const question = QuizBank[scene][0];
    assert.equal(engine.submitAnswer(scene, question, 'not-an-option').reason, 'answer-invalid');
    assert.equal(engine.getSession(scene).quizResults.length, 0);
    const fake = { ...question, correctAnswer: 'up' };
    assert.equal(engine.submitAnswer(scene, fake, 'up').isCorrect, false);
    assert.equal(engine.submitAnswer(scene, question, 'down').isCorrect, true);
    assert.equal(engine.getSession(scene).quizResults.length, 1);
});

test('configured steps, exploration and all correct quizzes reach full mastery', async () => {
    const { LearningEngine: engine, LearningPathConfig, QuizBank } = await load();
    for (const sceneId of Object.keys(LearningPathConfig)) {
        const path = LearningPathConfig[sceneId];
        assert.ok(path.completionRules.minQuizAnswered <= QuizBank[sceneId].length);
        assert.ok(path.completionRules.requiredStepIds.every(id => path.steps.some(step => step.id === id)));
        for (const step of path.steps) engine.completeStep(sceneId, step.id);
        for (const action of path.exploreActions) engine.recordExplore(sceneId, action);
        assert.equal(engine.canStartQuiz(sceneId), true);
        for (const q of QuizBank[sceneId]) {
            assert.ok(q.options.some(option => option.value === q.correctAnswer));
            assert.equal(engine.submitAnswer(sceneId, q, q.correctAnswer).isCorrect, true);
        }
        assert.equal(engine.getScore(sceneId), 100);
    }
});

test('non-array saved metrics cannot break subsequent learning events', async () => {
    for (const stored of ['{}', 'null', '123', '"text"', 'invalid']) {
        const { LearningEngine: engine } = await load(stored);
        assert.equal(engine.readMetrics().length, 0);
        assert.doesNotThrow(() => engine.completeStep(scene, 'read'));
    }
});

test('quadratic axis position alone does not determine b without the sign of a', async () => {
    const { LearningEngine: engine, QuizBank } = await load();
    const question = QuizBank[scene].find(q => q.id === 'qf-q2');
    assert.equal(engine.submitAnswer(scene, question, 'cannot-decide').isCorrect, true);
    assert.equal(engine.submitAnswer(scene, question, 'b-negative').isCorrect, false);
});

function memoryStorage() {
    const values = new Map();
    return { values, getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
}

test('both courses restore steps, exploration, answers and scene state after a fresh VM', async () => {
    const storage = memoryStorage();
    const first = await load(null, storage);
    for (const id of Object.keys(first.LearningPathConfig)) {
        const path = first.LearningPathConfig[id];
        const question = first.QuizBank[id][0];
        first.LearningEngine.completeStep(id, path.steps[0].id);
        first.LearningEngine.recordExplore(id, path.exploreActions[0]);
        first.LearningEngine.submitAnswer(id, question, question.correctAnswer);
        first.LearningEngine.updateSceneState(id, { currentStep: 1, params: { value: 3 } });
    }
    const second = await load(null, storage);
    for (const id of Object.keys(first.LearningPathConfig)) {
        const original = first.LearningEngine.getSession(id);
        const restored = second.LearningEngine.getSession(id);
        assert.deepEqual([...restored.completedSteps], [...original.completedSteps]);
        assert.deepEqual([...restored.exploreActions], [...original.exploreActions]);
        assert.deepEqual(JSON.parse(JSON.stringify(restored.quizAnswers)), JSON.parse(JSON.stringify(original.quizAnswers)));
        assert.deepEqual(JSON.parse(JSON.stringify(restored.sceneState)), { currentStep: 1, params: { value: 3 } });
        assert.equal(second.LearningEngine.getScore(id), first.LearningEngine.getScore(id));
        assert.equal(second.LearningEngine.getSession(id), restored);
    }
});

test('explicit new sessions overwrite previous progress and reset clears only its course', async () => {
    const storage = memoryStorage();
    const { LearningEngine: engine } = await load(null, storage);
    engine.completeStep(scene, 'read');
    engine.completeStep('circuit-ohm', 'read');
    engine.createSession(scene);
    assert.equal(engine.getSession(scene).completedSteps.size, 0);
    assert.equal((await load(null, storage)).LearningEngine.getSession(scene).completedSteps.size, 0);
    engine.completeStep(scene, 'read');
    engine.resetSession(scene);
    assert.equal(storage.getItem(engine.progressKeyPrefix + scene), null);
    const fresh = (await load(null, storage)).LearningEngine;
    assert.equal(fresh.getSession(scene).completedSteps.size, 0);
    assert.equal(fresh.hasCompletedStep('circuit-ohm', 'read'), true);
});

test('restored progress filters obsolete configuration ids and regrades saved answers', async () => {
    const storage = memoryStorage();
    const { LearningEngine: engine } = await load(null, storage);
    engine.createSession(scene);
    const key = engine.progressKeyPrefix + scene;
    const saved = JSON.parse(storage.getItem(key));
    Object.assign(saved, { completedSteps: ['read', 'deleted-step', 'read'], exploreActions: ['adjust-a', 'bad'], quizAnswers: { 'qf-q1': 'up', 'qf-q2': 'invalid', forged: 'yes' }, quizResults: [{ isCorrect: true }], score: 100 });
    storage.setItem(key, JSON.stringify(saved));
    const restoredEngine = (await load(null, storage)).LearningEngine;
    const restored = restoredEngine.getSession(scene);
    assert.deepEqual([...restored.completedSteps], ['read']);
    assert.deepEqual([...restored.exploreActions], ['adjust-a']);
    assert.equal(restored.quizResults.length, 1);
    assert.equal(restored.quizResults[0].isCorrect, false);
    assert.ok(restoredEngine.getScore(scene) < 100);
});

test('malformed, expired, future and unknown-version progress is discarded', async () => {
    const storage = memoryStorage();
    const { LearningEngine: engine } = await load(null, storage);
    engine.completeStep(scene, 'read');
    const key = engine.progressKeyPrefix + scene;
    const valid = JSON.parse(storage.getItem(key));
    const badRecords = ['invalid', 'null', '[]', 'x'.repeat(70000),
        JSON.stringify({ ...valid, version: 99 }),
        JSON.stringify({ ...valid, sceneId: 'another-course' }),
        JSON.stringify({ ...valid, savedAt: Date.now() - engine.progressMaxAgeMs - 1000 }),
        JSON.stringify({ ...valid, savedAt: Date.now() + 3600000 }),
        JSON.stringify({ ...valid, completedSteps: {} }),
        JSON.stringify({ ...valid, sceneState: null })];
    for (const record of badRecords) {
        storage.setItem(key, record);
        const fresh = (await load(null, storage)).LearningEngine;
        assert.equal(fresh.getSession(scene).completedSteps.size, 0);
    }
});

test('scene snapshots reject non-JSON, oversized, cyclic or dangerous data and are detached', async () => {
    const { LearningEngine: engine } = await load();
    const snapshot = { currentStep: 1, params: { value: 2 } };
    assert.equal(engine.updateSceneState(scene, snapshot), true);
    snapshot.params.value = 99;
    assert.equal(engine.getSession(scene).sceneState.params.value, 2);
    const cyclic = {}; cyclic.self = cyclic;
    for (const bad of [null, [], { fn() {} }, { value: NaN }, { value: Infinity }, { value: undefined }, { date: new Date() }, cyclic, { text: 'x'.repeat(20000) }, { list: Array(1001).fill(1) }, JSON.parse('{"__proto__":{"polluted":true}}')]) {
        assert.equal(engine.updateSceneState(scene, bad), false);
    }
    assert.equal(engine.getSession(scene).sceneState.params.value, 2);
});

test('storage denial never prevents learning, grading, scene updates or reset', async () => {
    const denied = () => { throw new Error('SecurityError'); };
    const { LearningEngine: engine, QuizBank } = await load(null, { getItem: denied, setItem: denied, removeItem: denied });
    assert.equal(engine.completeStep(scene, 'read'), true);
    assert.equal(engine.recordExplore(scene, 'adjust-a'), true);
    assert.equal(engine.submitAnswer(scene, QuizBank[scene][0], 'down').isCorrect, true);
    assert.equal(engine.updateSceneState(scene, { currentStep: 1 }), true);
    assert.equal(engine.getSession(scene).sceneState.currentStep, 1);
    assert.doesNotThrow(() => engine.resetSession(scene));
});

test('reset cannot resurrect readable old progress when storage deletion and writes fail', async () => {
    const storage = memoryStorage();
    const first = (await load(null, storage)).LearningEngine;
    first.completeStep(scene, 'read');
    first.completeStep('circuit-ohm', 'read');
    const readOnly = { getItem: storage.getItem, setItem() { throw new Error('write denied'); }, removeItem() { throw new Error('delete denied'); } };
    const engine = (await load(null, readOnly)).LearningEngine;
    assert.equal(engine.hasCompletedStep(scene, 'read'), true);
    engine.resetSession(scene);
    const fresh = engine.getSession(scene);
    assert.equal(fresh.completedSteps.size, 0);
    assert.equal(engine.restoreSession(scene), null);
    assert.equal(engine.getSession(scene), fresh);
    assert.equal(engine.hasCompletedStep('circuit-ohm', 'read'), true);
    assert.equal(engine.completeStep(scene, 'observe-a'), true);
    assert.equal(engine.hasCompletedStep(scene, 'read'), false);
});

test('successful saving after a failed deletion replaces obsolete progress for future reloads', async () => {
    const storage = memoryStorage();
    const engine = (await load(null, { ...storage, removeItem() { throw new Error('delete denied'); } })).LearningEngine;
    engine.completeStep(scene, 'read');
    engine.resetSession(scene);
    assert.equal(engine.getSession(scene).completedSteps.size, 0);
    const reloaded = (await load(null, storage)).LearningEngine;
    assert.equal(reloaded.getSession(scene).completedSteps.size, 0);
});

async function saveCompletedCourse(storage, id = scene) {
    const first = await load(null, storage);
    const path = first.LearningPathConfig[id];
    for (const step of path.steps) first.LearningEngine.completeStep(id, step.id);
    for (const action of path.exploreActions) first.LearningEngine.recordExplore(id, action);
    for (const question of first.QuizBank[id]) first.LearningEngine.submitAnswer(id, question, question.correctAnswer);
    first.LearningEngine.updateSceneState(id, { currentStep: path.steps.length - 1 });
    assert.equal(first.LearningEngine.getScore(id), 100);
}

test('curriculum option changes reopen practice instead of restoring a stale summary completion', async () => {
    for (const id of [scene, 'circuit-ohm']) {
        const storage = memoryStorage();
        await saveCompletedCourse(storage, id);
        const fresh = await load(null, storage);
        const firstQuestion = fresh.QuizBank[id][0];
        const oldAnswer = firstQuestion.correctAnswer;
        firstQuestion.options.find(option => option.value === oldAnswer).value = 'revised-answer';
        firstQuestion.correctAnswer = 'revised-answer';
        const engine = fresh.LearningEngine;
        const restored = engine.getSession(id);
        assert.equal(restored.quizResults.length, 2);
        assert.equal(restored.completedSteps.has('practice'), false);
        assert.equal(restored.completedSteps.has('summary'), false);
        assert.equal(engine.canAccessStep(id, 'practice'), true);
        assert.equal(engine.canAccessStep(id, 'summary'), false);
        assert.ok(engine.getScore(id) < 90);
        engine.submitAnswer(id, firstQuestion, 'revised-answer');
        engine.completeStep(id, 'practice');
        assert.equal(engine.canAccessStep(id, 'summary'), true);
    }
});

test('new exploration or step prerequisites invalidate downstream restored completion', async () => {
    for (const change of ['exploration', 'step']) {
        const storage = memoryStorage();
        await saveCompletedCourse(storage);
        const fresh = await load(null, storage);
        const path = fresh.LearningPathConfig[scene];
        if (change === 'exploration') {
            path.exploreActions.push('new-experiment');
            path.completionRules.minExplores = 4;
        } else {
            path.steps.splice(1, 0, { id: 'new-prerequisite' });
            path.completionRules.requiredStepIds.push('new-prerequisite');
        }
        const restored = fresh.LearningEngine.getSession(scene);
        assert.equal(restored.completedSteps.has('practice'), false);
        assert.equal(restored.completedSteps.has('summary'), false);
        assert.equal(restored.completedSteps.has('observe-a'), true);
        assert.equal(restored.quizResults.length, 3);
        assert.equal(fresh.LearningEngine.canAccessStep(scene, 'summary'), false);
    }
});
