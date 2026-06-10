// ========== ОФЛАЙН-СИНХРОНИЗАЦИЯ ПРОГРЕССА ==========

// Ключ для временного хранения прогресса
const OFFLINE_PROGRESS_KEY = 'cheesecake_offline_progress';

// Сохранить прогресс (автоматически определяет, есть ли интернет)
function saveProgressWithSync(progressData) {
    if (navigator.onLine) {
        // Есть интернет — сохраняем сразу
        return saveProgressDirectly(progressData);
    } else {
        // Нет интернета — сохраняем во временное хранилище
        return saveProgressToOffline(progressData);
    }
}

// Сохранить прогресс напрямую в основное хранилище
function saveProgressDirectly(progressData) {
    try {
        const user = getCurrentUser();
        if (!user) return false;
        
        const users = getUsers();
        const idx = users.findIndex(u => u.id === user.id);
        if (idx !== -1) {
            if (progressData.completedLessons) {
                users[idx].completedLessons = [...new Set([...(users[idx].completedLessons || []), ...progressData.completedLessons])];
            }
            if (progressData.learnedWords) {
                users[idx].learnedWords = [...new Set([...(users[idx].learnedWords || []), ...progressData.learnedWords])];
            }
            if (progressData.lessonResults) {
                users[idx].lessonResults = { ...(users[idx].lessonResults || {}), ...progressData.lessonResults };
            }
            if (progressData.dailyProgress) {
                users[idx].dailyProgress = { ...(users[idx].dailyProgress || {}), ...progressData.dailyProgress };
            }
            saveUsers(users);
            
            // Обновляем текущего пользователя
            const { password: _, ...updatedUser } = users[idx];
            setCurrentUser(updatedUser);
            return true;
        }
    } catch (e) {
        console.error('Ошибка сохранения:', e);
    }
    return false;
}

// Сохранить прогресс во временное хранилище (офлайн)
function saveProgressToOffline(progressData) {
    try {
        let offlineProgress = JSON.parse(localStorage.getItem(OFFLINE_PROGRESS_KEY) || '[]');
        offlineProgress.push({
            ...progressData,
            timestamp: Date.now()
        });
        localStorage.setItem(OFFLINE_PROGRESS_KEY, JSON.stringify(offlineProgress));
        console.log('Прогресс сохранён офлайн, будет синхронизирован при появлении интернета');
        return true;
    } catch (e) {
        console.error('Ошибка сохранения офлайн-прогресса:', e);
        return false;
    }
}

// Синхронизировать все офлайн-сохранения при появлении интернета
async function syncOfflineProgress() {
    const offlineProgress = JSON.parse(localStorage.getItem(OFFLINE_PROGRESS_KEY) || '[]');
    if (offlineProgress.length === 0) return;
    
    console.log(`Синхронизация ${offlineProgress.length} офлайн-сохранений...`);
    
    let successCount = 0;
    for (const progress of offlineProgress) {
        if (saveProgressDirectly(progress)) {
            successCount++;
        }
    }
    
    // Очищаем синхронизированные
    localStorage.setItem(OFFLINE_PROGRESS_KEY, JSON.stringify([]));
    
    showSyncToast(`✅ Синхронизировано ${successCount} из ${offlineProgress.length} сохранений`);
    
    // Обновляем интерфейс, если нужно
    if (window.location.pathname.includes('profile.html')) {
        renderProfile();
    }
}

// Показать уведомление о синхронизации
function showSyncToast(message) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #4CAF50;
        color: white;
        padding: 10px 20px;
        border-radius: 40px;
        font-size: 14px;
        z-index: 10000;
        animation: fadeOut 3s forwards;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Слушаем событие появления интернета
window.addEventListener('online', () => {
    console.log('Интернет появился! Синхронизируем прогресс...');
    syncOfflineProgress();
});

// При загрузке страницы проверяем, есть ли несинхронизированный прогресс
if (navigator.onLine) {
    syncOfflineProgress();
}
// ========== НАДЁЖНОЕ ХРАНЕНИЕ ДАННЫХ ==========
function safeSaveUsers(users) {
    try {
        localStorage.setItem('cheesecake_users', JSON.stringify(users));
        localStorage.setItem('cheesecake_users_backup', JSON.stringify(users));
        return true;
    } catch (e) {
        console.error('Ошибка сохранения пользователей:', e);
        showStorageError();
        return false;
    }
}

function safeGetUsers() {
    try {
        const users = localStorage.getItem('cheesecake_users');
        if (users) return JSON.parse(users);
        const backup = localStorage.getItem('cheesecake_users_backup');
        if (backup) {
            console.log('Восстановление из резервной копии');
            return JSON.parse(backup);
        }
        return [];
    } catch (e) {
        const backup = localStorage.getItem('cheesecake_users_backup');
        if (backup) {
            try {
                return JSON.parse(backup);
            } catch (e2) {
                return [];
            }
        }
        return [];
    }
}

function safeSaveCurrentUser(user) {
    try {
        localStorage.setItem('cheesecake_current_user', JSON.stringify(user));
        localStorage.setItem('cheesecake_current_user_backup', JSON.stringify(user));
        return true;
    } catch (e) {
        console.error('Ошибка сохранения текущего пользователя:', e);
        showStorageError();
        return false;
    }
}

function safeGetCurrentUser() {
    try {
        const user = localStorage.getItem('cheesecake_current_user');
        if (user) return JSON.parse(user);
        const backup = localStorage.getItem('cheesecake_current_user_backup');
        if (backup) {
            console.log('Восстановление текущего пользователя из бэкапа');
            return JSON.parse(backup);
        }
        return null;
    } catch (e) {
        const backup = localStorage.getItem('cheesecake_current_user_backup');
        if (backup) {
            try {
                return JSON.parse(backup);
            } catch (e2) {
                return null;
            }
        }
        return null;
    }
}

function showStorageError() {
    const toast = document.createElement('div');
    toast.textContent = '⚠️ Проблема с сохранением данных. Прогресс не потерян, попробуйте ещё раз.';
    toast.style.cssText = `position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: #ff9800; color: white; padding: 10px 20px; border-radius: 40px; font-size: 14px; z-index: 10000; animation: fadeOut 3s forwards;`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

window.getUsers = safeGetUsers;
window.saveUsers = safeSaveUsers;
window.getCurrentUser = safeGetCurrentUser;
window.setCurrentUser = safeSaveCurrentUser;

function getUsers() { return safeGetUsers(); }
function saveUsers(users) { return safeSaveUsers(users); }
function getCurrentUser() { return safeGetCurrentUser(); }
function setCurrentUser(user) { return safeSaveCurrentUser(user); }
function logout() {
    localStorage.removeItem('cheesecake_current_user');
    window.location.href = 'auth.html';
}

// ========== СТРАНИЦА АВТОРИЗАЦИИ ==========
if (window.location.pathname.includes('auth.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const showRegister = document.getElementById('showRegister');
        const showLogin = document.getElementById('showLogin');
        
        if (showRegister) {
            showRegister.addEventListener('click', () => {
                loginForm.classList.remove('active');
                registerForm.classList.add('active');
            });
        }
        
        if (showLogin) {
            showLogin.addEventListener('click', () => {
                registerForm.classList.remove('active');
                loginForm.classList.add('active');
            });
        }
        
        const registerBtn = document.getElementById('registerBtn');
        if (registerBtn) {
            registerBtn.addEventListener('click', () => {
                const name = document.getElementById('regName').value.trim();
                const age = document.getElementById('regAge').value.trim();
                const email = document.getElementById('regEmail').value.trim();
                const password = document.getElementById('regPassword').value;
                const regError = document.getElementById('regError');
                
                if (!name || !age || !email || !password) {
                    regError.textContent = 'Заполните все поля';
                    return;
                }
                
                if (password.length < 4) {
                    regError.textContent = 'Пароль должен быть минимум 4 символа';
                    return;
                }
                
                const users = getUsers();
                if (users.find(u => u.email === email)) {
                    regError.textContent = 'Пользователь с такой почтой уже существует';
                    return;
                }
                
                const newUser = {
                    id: Date.now(),
                    name: name,
                    age: age,
                    email: email,
                    password: password,
                    avatar: null,
                    completedLessons: [],
                    learnedWords: [],
                    wordsToReview: [],
                    lessonResults: {},
                    dailyProgress: {},
                    registrationDate: new Date().toISOString()
                };
                
                users.push(newUser);
                saveUsers(users);
                
                const { password: _, ...userWithoutPassword } = newUser;
                setCurrentUser(userWithoutPassword);
                window.location.href = 'lessons.html';
            });
        }
        
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                const email = document.getElementById('loginEmail').value.trim();
                const password = document.getElementById('loginPassword').value;
                const loginError = document.getElementById('loginError');
                
                const users = getUsers();
                const user = users.find(u => u.email === email && u.password === password);
                
                if (!user) {
                    loginError.textContent = 'Неверная почта или пароль';
                    return;
                }
                
                const { password: _, ...userWithoutPassword } = user;
                setCurrentUser(userWithoutPassword);
                window.location.href = 'lessons.html';
            });
        }
        
        if (getCurrentUser()) {
            window.location.href = 'lessons.html';
        }
    });
}

// ========== ДАННЫЕ УРОКОВ ==========
const lessonsData = [
    { id: 1, title: "Приветствие", description: "Научитесь говорить 'Здравствуйте' и представляться", image: "images/hello-cake.png", words: ["你好", "再见", "谢谢"] },
    { id: 2, title: "Числа 1-10", description: "Изучите цифры от 1 до 10", image: "images/numbers-cake.png", words: ["一", "二", "三", "四", "五"] },
    { id: 3, title: "Семья", description: "Мама, папа, брат, сестра", image: "images/old-cake.png", words: ["妈妈", "爸爸", "哥哥", "姐姐"] },
    { id: 4, title: "Еда", description: "Основные продукты и блюда", image: "https://placehold.co/200x200/DE2910/white?text=吃", words: ["米饭", "面条", "水", "茶"] },
    { id: 5, title: "Цвета", description: "Красный, синий, зелёный и другие", image: "https://placehold.co/200x200/DE2910/white?text=颜色", words: ["红色", "蓝色", "绿色", "黄色"] }
];

// ========== СТРАНИЦА УРОКОВ ==========
if (window.location.pathname.includes('lessons.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        const user = getCurrentUser();
        if (!user) {
            window.location.href = 'auth.html';
            return;
        }
        
        let currentIndex = 0;
        let animationInProgress = false;
        
        function saveCompletedLesson(lessonId) {
            const users = getUsers();
            const userIndex = users.findIndex(u => u.id === user.id);
            if (userIndex !== -1) {
                if (!users[userIndex].completedLessons) users[userIndex].completedLessons = [];
                if (!users[userIndex].completedLessons.includes(lessonId)) {
                    users[userIndex].completedLessons.push(lessonId);
                    const lesson = lessonsData.find(l => l.id === lessonId);
                    if (lesson && lesson.words) {
                        if (!users[userIndex].learnedWords) users[userIndex].learnedWords = [];
                        lesson.words.forEach(word => {
                            if (!users[userIndex].learnedWords.includes(word)) {
                                users[userIndex].learnedWords.push(word);
                            }
                        });
                    }
                }
                saveUsers(users);
                const { password: _, ...updatedUser } = users[userIndex];
                setCurrentUser(updatedUser);
            }
        }
        
        function isLessonCompleted(lessonId) {
            const currentUser = getCurrentUser();
            return currentUser?.completedLessons?.includes(lessonId) || false;
        }
        
        function isLessonUnlocked(lessonId) {
            if (lessonId === 1) return true;
            return isLessonCompleted(lessonId - 1);
        }
        
        function hasSeenFirstLessonWarning() {
            const currentUser = getCurrentUser();
            return currentUser?.hasSeenWarning || false;
        }
        
        function setHasSeenWarning() {
            const users = getUsers();
            const userIndex = users.findIndex(u => u.id === user.id);
            if (userIndex !== -1) {
                users[userIndex].hasSeenWarning = true;
                saveUsers(users);
                const { password: _, ...updatedUser } = users[userIndex];
                setCurrentUser(updatedUser);
            }
        }
        
        function showFirstLessonWarning(callback) {
            const modal = document.getElementById('firstLessonModal');
            if (!modal) {
                if (callback) callback();
                return;
            }
            modal.classList.add('active');
            const studyBtn = document.getElementById('studyLettersBtn');
            const newStudyBtn = studyBtn.cloneNode(true);
            studyBtn.parentNode.replaceChild(newStudyBtn, studyBtn);
            newStudyBtn.addEventListener('click', () => {
                modal.classList.remove('active');
                window.location.href = 'letters.html';
            });
            const knowBtn = document.getElementById('alreadyKnowBtn');
            const newKnowBtn = knowBtn.cloneNode(true);
            knowBtn.parentNode.replaceChild(newKnowBtn, knowBtn);
            newKnowBtn.addEventListener('click', () => {
                modal.classList.remove('active');
                setHasSeenWarning();
                if (callback) callback();
            });
        }
        
        function showFirstLaunchHint() {
            const hasSeenHint = localStorage.getItem('cheesecake_has_seen_hint');
            if (hasSeenHint) return;
            const modal = document.getElementById('firstLaunchModal');
            if (!modal) return;
            modal.classList.add('active');
            const closeBtn = document.getElementById('closeFirstLaunchBtn');
            if (closeBtn) {
                closeBtn.onclick = () => {
                    modal.classList.remove('active');
                    localStorage.setItem('cheesecake_has_seen_hint', 'true');
                };
            }
        }
        
        function renderLessons() {
            const grid = document.getElementById('lessonsGrid');
            if (!grid) return;
            grid.innerHTML = '';
            for (let i = 0; i < lessonsData.length; i++) {
                const lesson = lessonsData[i];
                const completed = isLessonCompleted(lesson.id);
                const unlocked = isLessonUnlocked(lesson.id);
                const isLocked = !unlocked && !completed;
                const lessonCard = document.createElement('div');
                lessonCard.className = `lesson-grid-card ${isLocked ? 'locked' : ''} ${completed ? 'completed' : ''}`;
                lessonCard.setAttribute('data-lesson-id', lesson.id);
                lessonCard.innerHTML = `
                    <div class="lesson-grid-image"><img src="${lesson.image}" alt="${lesson.title}" onerror="this.src='images/logo.png'"></div>
                    <div class="lesson-grid-number">Урок ${lesson.id}</div>
                    <div class="lesson-grid-title">${lesson.title}</div>
                    <div class="lesson-grid-description">${lesson.description}</div>
                    <div class="lesson-card-buttons">
                        ${!isLocked && !completed ? `<button class="lesson-grid-btn start-btn" data-id="${lesson.id}" data-page="${lesson.page}">Начать урок</button>` : ''}
                        ${completed ? `<button class="lesson-grid-btn reset-btn" data-page="${lesson.page}"><i class="fas fa-undo-alt"></i> Пройти заново</button>` : ''}
                    </div>
                    ${completed ? '<div class="lesson-grid-completed"><i class="fas fa-check-circle"></i> Пройден</div>' : ''}
                    ${isLocked ? '<div class="lesson-grid-locked"><i class="fas fa-lock"></i> Заблокировано</div>' : ''}
                `;
                grid.appendChild(lessonCard);
            }
            document.querySelectorAll('.start-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const lessonId = parseInt(btn.dataset.id);
                    const page = btn.dataset.page;
                    if (lessonId === 1 && !hasSeenFirstLessonWarning()) {
                        showFirstLessonWarning(() => { window.location.href = page; });
                    } else {
                        window.location.href = page;
                    }
                });
            });
            document.querySelectorAll('.reset-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    window.location.href = btn.dataset.page;
                });
            });
        }
        
        document.addEventListener('DOMContentLoaded', () => {
            const user = getCurrentUser();
            if (!user) { window.location.href = 'auth.html'; return; }
            renderLessons();
            showFirstLaunchHint();
        });
    });
}

// ========== СТРАНИЦА БУКВ И ТОНОВ ==========
if (window.location.pathname.includes('letters.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        const initials = ['b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'z', 'c', 's', 'zh', 'ch', 'sh', 'r'];
        const finals = ['a', 'ai', 'ao', 'an', 'ang', 'e', 'ei', 'en', 'eng', 'o', 'ou', 'ong', 'i', 'ia', 'ie', 'iao', 'iu', 'ian', 'in', 'iang', 'ing', 'iong', 'u', 'ua', 'uo', 'uai', 'ui', 'uan', 'un', 'uang', 'ueng', 'ü', 'üe', 'üan', 'ün', 'er'];
        
        function speak(text) {
            if (!window.speechSynthesis) return;
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'zh-CN';
            utterance.rate = 0.8;
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(utterance);
        }
        
        const initialsGrid = document.getElementById('initialsGrid');
        if (initialsGrid) {
            initials.forEach(init => {
                const card = document.createElement('div');
                card.className = 'sound-card';
                card.innerHTML = `<div class="sound-text">${init}</div><div class="sound-desc">согласный</div>`;
                card.addEventListener('click', () => speak(init));
                initialsGrid.appendChild(card);
            });
        }
        
        const finalsGrid = document.getElementById('finalsGrid');
        if (finalsGrid) {
            finals.forEach(final => {
                const card = document.createElement('div');
                card.className = 'sound-card';
                card.innerHTML = `<div class="sound-text">${final}</div><div class="sound-desc">гласный</div>`;
                card.addEventListener('click', () => speak(final));
                finalsGrid.appendChild(card);
            });
        }
        
        const trainBtn = document.getElementById('trainTonesBtn');
        const quizModal = document.getElementById('tonesQuizModal');
        const quizContent = document.getElementById('quizContent');
        const quizFeedback = document.getElementById('quizFeedback');
        const quizNextBtn = document.getElementById('quizNextBtn');
        const quizCloseBtn = document.getElementById('quizCloseBtn');
        
        let currentQuestion = 0;
        let score = 0;
        
        const questions = [
            { correct: 1, text: 'Какой это тон?', options: ['1-й тон (ровный)', '2-й тон (восходящий)', '3-й тон (нисх.-восх.)', '4-й тон (резкий)'] },
            { correct: 2, text: 'Какой это тон?', options: ['1-й тон (ровный)', '2-й тон (восходящий)', '3-й тон (нисх.-восх.)', '4-й тон (резкий)'] },
            { correct: 3, text: 'Какой это тон?', options: ['1-й тон (ровный)', '2-й тон (восходящий)', '3-й тон (нисх.-восх.)', '4-й тон (резкий)'] },
            { correct: 4, text: 'Какой это тон?', options: ['1-й тон (ровный)', '2-й тон (восходящий)', '3-й тон (нисх.-восх.)', '4-й тон (резкий)'] }
        ];
        
        function playToneSound(tone) {
            const freq = tone === 1 ? 220 : tone === 2 ? 264 : tone === 3 ? 198 : 330;
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.frequency.value = freq;
            oscillator.type = 'sine';
            gainNode.gain.value = 0.3;
            oscillator.start();
            gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 1);
            oscillator.stop(audioContext.currentTime + 1);
        }
        
        function loadQuestion() {
            const q = questions[currentQuestion];
            quizContent.innerHTML = `
                <div class="quiz-question">${q.text}</div>
                <button class="quiz-audio-btn" id="playQuizAudio"><i class="fas fa-play"></i> Прослушать звук</button>
                <div class="quiz-options" id="quizOptions">${q.options.map((opt, idx) => `<div class="quiz-option" data-opt="${idx + 1}">${opt}</div>`).join('')}</div>
            `;
            document.getElementById('playQuizAudio').addEventListener('click', () => playToneSound(q.correct));
            document.querySelectorAll('.quiz-option').forEach(opt => {
                opt.addEventListener('click', () => {
                    const selected = parseInt(opt.dataset.opt);
                    const isCorrect = selected === q.correct;
                    if (isCorrect) { score++; quizFeedback.innerHTML = '✅ Правильно! Молодец!'; quizFeedback.className = 'quiz-feedback correct'; }
                    else { quizFeedback.innerHTML = `❌ Неправильно. Правильный ответ: ${q.options[q.correct - 1]}`; quizFeedback.className = 'quiz-feedback wrong'; }
                    document.querySelectorAll('.quiz-option').forEach(o => { o.style.pointerEvents = 'none'; o.style.opacity = '0.6'; });
                    quizNextBtn.style.display = 'block';
                });
            });
        }
        
        if (trainBtn) {
            trainBtn.addEventListener('click', () => {
                currentQuestion = 0; score = 0; quizFeedback.innerHTML = ''; quizNextBtn.style.display = 'none'; quizModal.classList.add('active'); loadQuestion();
            });
        }
        if (quizNextBtn) {
            quizNextBtn.addEventListener('click', () => {
                if (currentQuestion + 1 < questions.length) { currentQuestion++; quizFeedback.innerHTML = ''; quizNextBtn.style.display = 'none'; loadQuestion(); }
                else { quizModal.classList.remove('active'); alert(`Тренировка завершена! Вы набрали ${score} из ${questions.length}`); }
            });
        }
        if (quizCloseBtn) quizCloseBtn.addEventListener('click', () => { quizModal.classList.remove('active'); });
    });
}

// ========== PWA ОБНОВЛЕНИЯ ==========
let newWorkerSW = null;
let updateToastSW = null;

function checkForUpdatesSW() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => { registration.update(); });
    }
}

function showUpdateNotificationSW() {
    if (updateToastSW) updateToastSW.remove();
    updateToastSW = document.createElement('div');
    updateToastSW.innerHTML = `<div style="position: fixed; bottom: 90px; left: 50%; transform: translateX(-50%); background: #7B001C; color: white; padding: 12px 20px; border-radius: 50px; font-size: 14px; z-index: 10001; display: flex; align-items: center; gap: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); cursor: pointer;"><span>🔄</span><span>Доступна новая версия! Нажмите для обновления</span></div>`;
    updateToastSW.onclick = () => { if (newWorkerSW) { newWorkerSW.postMessage({ type: 'SKIP_WAITING' }); window.location.reload(); } };
    document.body.appendChild(updateToastSW);
    setTimeout(() => { if (updateToastSW) updateToastSW.remove(); }, 10000);
}

function registerServiceWorkerSW() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').then(registration => {
            setInterval(() => { registration.update(); }, 6 * 60 * 60 * 1000);
            if (registration.waiting) { newWorkerSW = registration.waiting; showUpdateNotificationSW(); }
            registration.addEventListener('updatefound', () => {
                newWorkerSW = registration.installing;
                newWorkerSW.addEventListener('statechange', () => {
                    if (newWorkerSW.state === 'installed' && navigator.serviceWorker.controller) { showUpdateNotificationSW(); }
                });
            });
        }).catch(error => console.log('SW error:', error));
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => { if (refreshing) return; refreshing = true; window.location.reload(); });
    }
}
registerServiceWorkerSW();
window.addEventListener('load', () => { checkForUpdatesSW(); });

// Удаляем мобильную шапку на компьютере
function checkMobileHeader() {
    const mobileHeader = document.querySelector('.mobile-header');
    if (mobileHeader && window.innerWidth > 768) { mobileHeader.remove(); }
}
checkMobileHeader();
window.addEventListener('resize', checkMobileHeader);

