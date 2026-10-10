/**
 * 学习引擎（前端轻量版）
 * - 管理步骤、探索动作、练习结果
 * - 计算掌握度并生成总结
 */
window.LearningEngine = {
    sessions: Object.create(null),
    resetProgressIds: new Set(),
    metricsKey: 'learning-metrics-v1',
    metricsBuffer: [],
    progressKeyPrefix: 'learning-session-v1:',
    progressMaxAgeMs: 180 * 24 * 60 * 60 * 1000,
    progressMaxLength: 65536,

    buildSession(sceneId) {
        const pathConfig = Object.prototype.hasOwnProperty.call(window.LearningPathConfig || {}, sceneId)
            ? window.LearningPathConfig[sceneId] : null;
        const quizList = window.QuizBank?.[sceneId] || [];
        if (!pathConfig || !Array.isArray(pathConfig.steps) || !Array.isArray(pathConfig.exploreActions)) {
            console.warn('[LearningEngine] 未找到学习路径配置:', sceneId);
            return null;
        }

        const session = {
            sceneId,
            createdAt: Date.now(),
            completedSteps: new Set(),
            exploreActions: new Set(),
            quizAnswers: {},
            sceneState: {},
            quizResults: [],
            stepCount: pathConfig.steps.length,
            requiredExplore: pathConfig.exploreActions.length,
            requiredQuiz: pathConfig.completionRules?.minQuizAnswered ?? quizList.length,
            quizTotal: quizList.length
        };

        return session;
    },

    createSession(sceneId) {
        const session = this.buildSession(sceneId);
        if (!session) return null;
        this.sessions[sceneId] = session;
        this.saveSession(sceneId);
        this.logEvent(sceneId, 'session_create', { quizTotal: session.quizTotal });
        return session;
    },

    getSession(sceneId) {
        if (!this.sessions[sceneId]) {
            this.sessions[sceneId] = this.restoreSession(sceneId) || this.createSession(sceneId);
        }
        return this.sessions[sceneId];
    },

    // Keep only a small, detached JSON object; scene code validates parameter meaning.
    cloneSceneState(snapshot) {
        let nodes = 0;
        const visit = (value, depth = 0) => {
            if (++nodes > 1000 || depth > 8) throw new Error('Scene state too complex');
            if (value === null || typeof value === 'boolean') return value;
            if (typeof value === 'number' && Number.isFinite(value)) return value;
            if (typeof value === 'string' && value.length <= 4096) return value;
            if (Array.isArray(value)) return value.map(item => visit(item, depth + 1));
            if (value && Object.prototype.toString.call(value) === '[object Object]') {
                const prototype = Object.getPrototypeOf(value);
                if (prototype !== null && Object.getPrototypeOf(prototype) !== null) throw new Error('Invalid object');
                const output = {};
                for (const [key, item] of Object.entries(value)) {
                    if (['__proto__', 'prototype', 'constructor'].includes(key)) throw new Error('Invalid state key');
                    output[key] = visit(item, depth + 1);
                }
                return output;
            }
            throw new Error('Scene state must be JSON data');
        };
        if (!snapshot || Array.isArray(snapshot) || typeof snapshot !== 'object') throw new Error('Scene state must be an object');
        const copy = visit(snapshot);
        if (JSON.stringify(copy).length > 16384) throw new Error('Scene state too large');
        return copy;
    },

    updateSceneState(sceneId, snapshot) {
        let state;
        try { state = this.cloneSceneState(snapshot); } catch { return false; }
        const session = this.getSession(sceneId);
        if (!session) return false;
        session.sceneState = state;
        this.saveSession(sceneId);
        return true;
    },

    saveSession(sceneId) {
        const session = this.sessions[sceneId];
        if (!session) return false;
        try {
            const saved = JSON.stringify({
                version: 1,
                sceneId,
                createdAt: session.createdAt,
                savedAt: Date.now(),
                completedSteps: [...session.completedSteps],
                exploreActions: [...session.exploreActions],
                quizAnswers: session.quizAnswers,
                sceneState: this.cloneSceneState(session.sceneState)
            });
            if (saved.length > this.progressMaxLength) return false;
            localStorage.setItem(this.progressKeyPrefix + sceneId, saved);
            this.resetProgressIds.delete(sceneId);
            return true;
        } catch {
            // SecurityError, quota limits and private browsing must not interrupt learning.
            return false;
        }
    },

    restoreSession(sceneId) {
        if (this.resetProgressIds.has(sceneId)) return null;
        const session = this.buildSession(sceneId);
        if (!session) return null;
        const key = this.progressKeyPrefix + sceneId;
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return null;
            if (raw.length > this.progressMaxLength) throw new Error('Progress too large');
            const saved = JSON.parse(raw);
            const now = Date.now();
            if (!saved || saved.version !== 1 || saved.sceneId !== sceneId ||
                !Number.isFinite(saved.savedAt) || saved.savedAt > now + 60000 || now - saved.savedAt > this.progressMaxAgeMs ||
                !Number.isFinite(saved.createdAt) || saved.createdAt < 0 || saved.createdAt > saved.savedAt ||
                !Array.isArray(saved.completedSteps) || !Array.isArray(saved.exploreActions) ||
                !saved.quizAnswers || Array.isArray(saved.quizAnswers) || typeof saved.quizAnswers !== 'object') {
                throw new Error('Invalid or expired progress');
            }
            const path = window.LearningPathConfig[sceneId];
            session.createdAt = saved.createdAt;
            session.completedSteps = new Set(saved.completedSteps.filter(id => path.steps.some(step => step.id === id)));
            session.exploreActions = new Set(saved.exploreActions.filter(id => path.exploreActions.includes(id)));
            session.sceneState = this.cloneSceneState(saved.sceneState);
            for (const question of window.QuizBank?.[sceneId] || []) {
                const answer = saved.quizAnswers[question.id];
                if (!question.options.some(option => option.value === answer)) continue;
                session.quizAnswers[question.id] = answer;
                session.quizResults.push(this.gradeAnswer(question, answer));
            }
            // A curriculum edit can invalidate old answers or prerequisites. Retain useful
            // exploration, but reopen practice instead of restoring a stale completion badge.
            const rules = path.completionRules || {};
            const practiceIndex = path.steps.findIndex(step => step.id === 'practice');
            const prerequisites = [
                ...(rules.requiredStepIds || []),
                ...path.steps.slice(0, Math.max(practiceIndex, 0)).map(step => step.id)
            ];
            const practiceEligible = prerequisites.every(id => session.completedSteps.has(id)) &&
                session.exploreActions.size >= (rules.minExplores ?? 0) &&
                session.quizResults.length >= session.requiredQuiz;
            if (!practiceEligible) {
                session.completedSteps.delete('practice');
                session.completedSteps.delete('summary');
            }
            const beforeSummary = [...session.completedSteps].filter(id => id !== 'summary').length;
            if (!session.completedSteps.has('practice') || beforeSummary < (rules.minCompletedSteps ?? session.stepCount - 1)) {
                session.completedSteps.delete('summary');
            }
            // Derived grades and totals always come from today's curriculum, never storage.
            return session;
        } catch {
            try { localStorage.removeItem(key); } catch { /* Storage may be unavailable. */ }
            return null;
        }
    },

    gradeAnswer(question, selectedAnswer) {
        const isCorrect = selectedAnswer === question.correctAnswer;
        return {
            questionId: question.id,
            selectedAnswer,
            isCorrect,
            errorTag: isCorrect ? '' : (question.errorTags?.[selectedAnswer] || 'generic'),
            level: question.level
        };
    },

    completeStep(sceneId, stepId) {
        const session = this.getSession(sceneId);
        if (!session || !window.LearningPathConfig[sceneId].steps.some(step => step.id === stepId)) return false;
        if (session.completedSteps.has(stepId)) return true;
        session.completedSteps.add(stepId);
        this.saveSession(sceneId);
        this.logEvent(sceneId, 'step_complete', { stepId });
        return true;
    },

    recordExplore(sceneId, actionId) {
        const session = this.getSession(sceneId);
        if (!session || !window.LearningPathConfig[sceneId].exploreActions.includes(actionId)) return false;
        if (session.exploreActions.has(actionId)) return true;
        session.exploreActions.add(actionId);
        this.saveSession(sceneId);
        this.logEvent(sceneId, 'explore_action', { actionId });
        return true;
    },

    submitAnswer(sceneId, question, selectedAnswer) {
        const session = this.getSession(sceneId);
        if (!session) return { isCorrect: false, reason: 'session-missing' };

        const configuredQuestion = (window.QuizBank?.[sceneId] || []).find(item => item.id === question?.id);
        if (!configuredQuestion) return { isCorrect: false, reason: 'question-missing' };
        if (!configuredQuestion.options.some(option => option.value === selectedAnswer)) {
            return { isCorrect: false, reason: 'answer-invalid' };
        }
        question = configuredQuestion;
        const result = this.gradeAnswer(question, selectedAnswer);
        const { isCorrect } = result;

        session.quizAnswers[question.id] = selectedAnswer;
        session.quizResults = session.quizResults.filter(item => item.questionId !== question.id);
        session.quizResults.push(result);
        this.saveSession(sceneId);
        this.logEvent(sceneId, 'quiz_submit_single', {
            questionId: question.id,
            level: question.level,
            isCorrect
        });
        return result;
    },

    hasCompletedStep(sceneId, stepId) {
        const session = this.getSession(sceneId);
        if (!session) return false;
        return session.completedSteps.has(stepId);
    },

    canAccessStep(sceneId, stepId) {
        const pathConfig = window.LearningPathConfig?.[sceneId];
        const session = this.getSession(sceneId);
        if (!pathConfig || !session) return false;
        const stepIds = pathConfig.steps.map(step => step.id);
        const targetIdx = stepIds.indexOf(stepId);
        if (targetIdx < 0) return false;
        if (targetIdx === 0) return true;
        for (let i = 0; i < targetIdx; i += 1) {
            if (!session.completedSteps.has(stepIds[i])) return false;
        }
        return true;
    },

    canStartQuiz(sceneId) {
        const pathConfig = window.LearningPathConfig?.[sceneId];
        const session = this.getSession(sceneId);
        if (!pathConfig || !session) return false;
        const rules = pathConfig.completionRules || {};
        const minExplore = rules.minExplores || 0;
        const requiredSteps = rules.requiredStepIds || [];
        const stepsOk = requiredSteps.every(step => session.completedSteps.has(step));
        const exploreOk = session.exploreActions.size >= minExplore;
        return stepsOk && exploreOk;
    },

    getScore(sceneId) {
        const session = this.getSession(sceneId);
        if (!session) return 0;

        const pathConfig = window.LearningPathConfig?.[sceneId];
        const rules = pathConfig?.completionRules;
        const minSteps = rules?.minCompletedSteps || session.stepCount;
        const minExplore = rules?.minExplores || session.requiredExplore;
        const minQuiz = rules?.minQuizAnswered || session.requiredQuiz;

        const stepRatio = Math.min(session.completedSteps.size / Math.max(minSteps, 1), 1);
        const exploreRatio = Math.min(session.exploreActions.size / Math.max(minExplore, 1), 1);

        const answered = session.quizResults.length;
        const correct = session.quizResults.filter(item => item.isCorrect).length;
        const quizCompletionRatio = Math.min(answered / Math.max(minQuiz, 1), 1);
        const quizCorrectRatio = answered > 0 ? correct / answered : 0;

        const processScore = Math.round(stepRatio * 20);
        const exploreScore = Math.round(exploreRatio * 20);
        const quizScore = Math.round((quizCompletionRatio * 0.4 + quizCorrectRatio * 0.6) * 60);
        return Math.max(0, Math.min(100, processScore + exploreScore + quizScore));
    },

    getWeakPoints(sceneId) {
        const session = this.getSession(sceneId);
        if (!session) return [];
        const wrong = session.quizResults.filter(item => !item.isCorrect);
        const tags = wrong.map(item => item.errorTag).filter(Boolean);
        return [...new Set(tags)];
    },

    getSummary(sceneId) {
        const score = this.getScore(sceneId);
        const weakPoints = this.getWeakPoints(sceneId);
        let level = '需强化';
        let suggestion = '建议回到步骤 2-4，再次操作参数并完成练习。';

        if (score >= 90) {
            level = '已掌握';
            suggestion = '你已掌握核心规律，建议挑战更高难度场景。';
        } else if (score >= 70) {
            level = '基本掌握';
            suggestion = '建议针对薄弱点做 1 轮强化练习。';
        }

        const summary = { score, level, weakPoints, suggestion };
        this.logEvent(sceneId, 'summary_generate', summary);
        return summary;
    },

    resetSession(sceneId) {
        this.logEvent(sceneId, 'session_reset', {});
        // A failed storage deletion must not revive old progress on the next getSession().
        this.resetProgressIds.add(sceneId);
        delete this.sessions[sceneId];
        try { localStorage.removeItem(this.progressKeyPrefix + sceneId); } catch { /* Optional storage. */ }
    },

    logEvent(sceneId, event, payload = {}) {
        const record = {
            at: Date.now(),
            sceneId,
            event,
            payload
        };
        this.metricsBuffer.push(record);
        if (this.metricsBuffer.length > 300) {
            this.metricsBuffer = this.metricsBuffer.slice(-300);
        }
        try {
            localStorage.setItem(this.metricsKey, JSON.stringify(this.metricsBuffer));
        } catch (error) {
            // 存储失败不影响主流程
        }
    },

    readMetrics() {
        if (this.metricsBuffer.length > 0) return this.metricsBuffer;
        try {
            const raw = localStorage.getItem(this.metricsKey);
            const parsed = raw ? JSON.parse(raw) : [];
            this.metricsBuffer = Array.isArray(parsed) ? parsed.slice(-300) : [];
        } catch (error) {
            this.metricsBuffer = [];
        }
        return this.metricsBuffer;
    }
};
