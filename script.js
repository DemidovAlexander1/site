// ========== Глобальные переменные и утилиты ==========
const STORAGE_KEY = 'yaaboo_app';

function loadData() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : { users: [], currentUserId: null };
}

function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getCurrentUser() {
    const data = loadData();
    if (!data.currentUserId) return null;
    return data.users.find(u => u.id === data.currentUserId) || null;
}

function generateId() {
    return Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

// Звуки через Web Audio
function playSound(type) {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') {
            audioCtx.resume().then(() => createSound(audioCtx, type));
        } else {
            createSound(audioCtx, type);
        }
    } catch (e) {
        console.log('Audio not supported');
    }
}

function createSound(ctx, type) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';

    switch(type) {
        case 'like':
            osc.frequency.value = 800;
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
            osc.start();
            osc.stop(ctx.currentTime + 0.2);
            break;
        case 'dislike':
            osc.frequency.value = 300;
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
            osc.start();
            osc.stop(ctx.currentTime + 0.15);
            break;
        case 'match':
            osc.frequency.value = 600;
            osc.frequency.setValueAtTime(800, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
            osc.start();
            osc.stop(ctx.currentTime + 0.3);
            break;
        case 'click':
            osc.frequency.value = 200;
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
            osc.start();
            osc.stop(ctx.currentTime + 0.05);
            break;
    }
}

// Уведомления
function showNotification(msg, isError = false) {
    const notif = document.createElement('div');
    notif.className = 'notification';
    notif.style.background = isError ? '#000' : '#ff1a1a';
    notif.textContent = msg;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 3000);
}

// Автоматическое расширение textarea по высоте
function autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = (textarea.scrollHeight) + 'px';
}

// Применить autoResize ко всем textarea на странице
function initAutoResize() {
    document.querySelectorAll('textarea').forEach(textarea => {
        autoResize(textarea);
        textarea.addEventListener('input', function() {
            autoResize(this);
        });
    });
}

// ========== Переключение между регистрацией и входом ==========
const registerForm = document.getElementById('register-form');
const loginForm = document.getElementById('login-form');
const switchToLogin = document.getElementById('switch-to-login');
const switchToRegister = document.getElementById('switch-to-register');

switchToLogin.addEventListener('click', () => {
    registerForm.style.display = 'none';
    loginForm.style.display = 'flex';
    switchToLogin.style.display = 'none';
    switchToRegister.style.display = 'inline';
});

switchToRegister.addEventListener('click', () => {
    loginForm.style.display = 'none';
    registerForm.style.display = 'flex';
    switchToRegister.style.display = 'none';
    switchToLogin.style.display = 'inline';
});

// ========== Регистрация ==========
const registerScreen = document.getElementById('register-screen');
const mainScreen = document.getElementById('main-screen');
const registerBtn = document.getElementById('register-btn');
const photoUpload = document.getElementById('photo-upload');
const uploadPhotoBtn = document.getElementById('upload-photo-btn');
const photoPreview = document.getElementById('photo-preview');

let uploadedPhoto = null;

function validateRegister() {
    const gender = document.getElementById('gender').value;
    const email = document.getElementById('email').value.trim();
    const fullname = document.getElementById('fullname').value.trim();
    const username = document.getElementById('username').value.trim();
    const pwd = document.getElementById('password').value;
    const pwd2 = document.getElementById('password2').value;
    const social = document.getElementById('social-link').value.trim();
    const bio = document.getElementById('bio').value.trim();

    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const passwordsMatch = pwd === pwd2 && pwd.length >= 4;
    const bioValid = bio.length >= 20;
    const socialValid = social.startsWith('http');
    const photoValid = uploadedPhoto !== null;

    const allValid = gender && emailValid && fullname && username && passwordsMatch && bioValid && socialValid && photoValid;
    registerBtn.disabled = !allValid;
}

document.getElementById('gender').addEventListener('change', validateRegister);
document.getElementById('email').addEventListener('input', validateRegister);
document.getElementById('fullname').addEventListener('input', validateRegister);
document.getElementById('username').addEventListener('input', validateRegister);
document.getElementById('password').addEventListener('input', validateRegister);
document.getElementById('password2').addEventListener('input', validateRegister);
document.getElementById('social-link').addEventListener('input', validateRegister);
document.getElementById('bio').addEventListener('input', validateRegister);
document.getElementById('bio').addEventListener('input', function() { autoResize(this); });

uploadPhotoBtn.addEventListener('click', () => photoUpload.click());
photoUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            uploadedPhoto = e.target.result;
            photoPreview.src = uploadedPhoto;
            photoPreview.style.display = 'block';
            validateRegister();
        };
        reader.readAsDataURL(file);
    }
});

registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = loadData();

    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();

    if (data.users.some(u => u.username === username)) {
        showNotification('Логин уже используется', true);
        return;
    }
    if (data.users.some(u => u.email === email)) {
        showNotification('Почта уже зарегистрирована', true);
        return;
    }

    const newUser = {
        id: generateId(),
        gender: document.getElementById('gender').value,
        email: email,
        fullName: document.getElementById('fullname').value.trim(),
        username: username,
        password: document.getElementById('password').value,
        bio: document.getElementById('bio').value.trim(),
        photo: uploadedPhoto,
        socialType: document.getElementById('social-type').value,
        socialLink: document.getElementById('social-link').value.trim(),
        wall: [],
        likes: [],
        likedBy: [],
        dislikes: [],
        notifications: []
    };

    data.users.push(newUser);
    data.currentUserId = newUser.id;
    saveData(data);

    registerScreen.classList.remove('active');
    mainScreen.classList.add('active');
    playSound('click');
    showNotification('Регистрация успешна!');
    renderApp();
    initAutoResize();
});

// ========== Вход ==========
const loginBtn = document.getElementById('login-btn');
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    const data = loadData();
    const user = data.users.find(u => u.username === username && u.password === password);

    if (user) {
        data.currentUserId = user.id;
        saveData(data);
        registerScreen.classList.remove('active');
        mainScreen.classList.add('active');
        playSound('click');
        showNotification('Вход выполнен');
        renderApp();
        initAutoResize();
    } else {
        showNotification('Неверный логин или пароль', true);
    }
});

// ========== Основное приложение ==========
function renderApp() {
    const activeTab = document.querySelector('.nav-item.active')?.dataset.tab || 'home';
    renderContent(activeTab);
}

function renderContent(tab) {
    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = '';

    // Добавляем общий логотип
    const logo = document.createElement('div');
    logo.className = 'logo-header';
    logo.innerHTML = `<img src="logo.png" class="logo-image" alt="YaaBoo">`;
    contentArea.appendChild(logo);

    switch(tab) {
        case 'home': renderHome(contentArea); break;
        case 'profiles': renderProfiles(contentArea); break;
        case 'likes': renderLikes(contentArea); break;
        case 'profile': renderProfile(contentArea); break;
    }

    // Добавляем футер с контактом
    const footer = document.createElement('div');
    footer.className = 'admin-footer';
    footer.innerHTML = `Связь с администрацией: <a href="https://t.me/Demidovvv124" target="_blank">@Demidovvv124</a>`;
    contentArea.appendChild(footer);

    initAutoResize();
}

// Навигация
document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
        playSound('click');
        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderContent(btn.dataset.tab);
    });
});

// ========== Главная (карточки) ==========
function renderHome(container) {
    const user = getCurrentUser();
    if (!user) return;

    const data = loadData();
    let candidates = data.users.filter(u =>
        u.id !== user.id &&
        !user.likes.includes(u.id) &&
        !user.dislikes.includes(u.id)
    );

    // Перемешиваем массив для случайного порядка
    candidates = candidates.sort(() => Math.random() - 0.5);

    if (candidates.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.style.textAlign = 'center';
        emptyMsg.style.marginTop = '30px';
        emptyMsg.style.color = '#aaa';
        emptyMsg.textContent = 'Анкеты закончились 🥀';
        container.appendChild(emptyMsg);
        return;
    }

    const candidate = candidates[0];
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
        <div class="card-header" style="background-image: url('${candidate.photo}');"></div>
        <div class="card-info">
            <div class="card-name">${candidate.fullName} (${candidate.gender === 'male' ? '♂' : candidate.gender === 'female' ? '♀' : '⚧'})</div>
            <div class="card-bio">${candidate.bio}</div>
            <a href="${candidate.socialLink}" target="_blank" class="card-social">
                ${candidate.socialType === 'tg' ? '📱 Telegram' : '🌐 VK'}
            </a>
        </div>
        <div class="card-actions">
            <button class="action-btn dislike" id="dislikeBtn">✕</button>
            <button class="action-btn like" id="likeBtn">❤️</button>
        </div>
    `;
    container.appendChild(card);

    document.getElementById('dislikeBtn').addEventListener('click', () => {
        playSound('dislike');
        handleDislike(candidate.id);
        const oldCard = container.querySelector('.card');
        if (oldCard) oldCard.remove();
        renderHome(container);
    });

    document.getElementById('likeBtn').addEventListener('click', () => {
        playSound('like');
        handleLike(candidate.id);
        const oldCard = container.querySelector('.card');
        if (oldCard) oldCard.remove();
        renderHome(container);
    });
}

function handleLike(targetId) {
    const data = loadData();
    const user = getCurrentUser();
    const target = data.users.find(u => u.id === targetId);
    if (!user || !target) return;

    if (!user.likes.includes(targetId)) {
        user.likes.push(targetId);
    }
    if (!target.likedBy.includes(user.id)) {
        target.likedBy.push(user.id);
    }

    if (target.likes && target.likes.includes(user.id)) {
        playSound('match');
        showNotification(`Взаимный интерес! Ссылка: ${target.socialLink}`);
        target.notifications = target.notifications || [];
        target.notifications.push({
            message: `🔥 ${user.fullName} лайкнул вас в ответ! Ссылка: ${user.socialLink}`,
            read: false,
            timestamp: Date.now()
        });
    }

    saveData(data);
}

function handleDislike(targetId) {
    const data = loadData();
    const user = getCurrentUser();
    const target = data.users.find(u => u.id === targetId);
    if (!user || !target) return;

    if (!user.dislikes.includes(targetId)) {
        user.dislikes.push(targetId);
    }

    const likeIndex = user.likes.indexOf(targetId);
    if (likeIndex !== -1) {
        user.likes.splice(likeIndex, 1);
        const targetLikedIndex = target.likedBy.indexOf(user.id);
        if (targetLikedIndex !== -1) target.likedBy.splice(targetLikedIndex, 1);
    }

    const targetLikeIndex = target.likes.indexOf(user.id);
    if (targetLikeIndex !== -1) {
        target.likes.splice(targetLikeIndex, 1);
        const userLikedByIndex = user.likedBy.indexOf(targetId);
        if (userLikedByIndex !== -1) user.likedBy.splice(userLikedByIndex, 1);
    }

    saveData(data);
}

// ========== Анкеты (список всех пользователей) ==========
function renderProfiles(container) {
    const user = getCurrentUser();
    if (!user) return;

    const data = loadData();
    const others = data.users.filter(u => u.id !== user.id);

    if (others.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.style.textAlign = 'center';
        emptyMsg.style.color = '#aaa';
        emptyMsg.textContent = 'Нет других анкет';
        container.appendChild(emptyMsg);
        return;
    }

    const grid = document.createElement('div');
    grid.className = 'profiles-grid';

    others.forEach(p => {
        const card = document.createElement('div');
        card.className = 'profile-card';
        card.innerHTML = `
            <img src="${p.photo}" class="profile-avatar">
            <div class="profile-name">${p.fullName}</div>
            <div class="profile-bio-short">${p.bio.substring(0, 30)}...</div>
        `;
        card.addEventListener('click', () => {
            showNotification(p.fullName, false);
        });
        grid.appendChild(card);
    });

    container.appendChild(grid);
}

// ========== Лайки (избранное) ==========
function renderLikes(container) {
    const user = getCurrentUser();
    if (!user) return;

    const data = loadData();
    const likedUsers = data.users.filter(u => user.likes.includes(u.id));

    if (likedUsers.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.style.textAlign = 'center';
        emptyMsg.style.color = '#aaa';
        emptyMsg.textContent = 'Вы ещё никого не лайкнули';
        container.appendChild(emptyMsg);
        return;
    }

    const list = document.createElement('div');
    list.className = 'likes-list';

    likedUsers.forEach(liked => {
        const mutual = liked.likes && liked.likes.includes(user.id);
        const item = document.createElement('div');
        item.className = 'like-item';
        item.innerHTML = `
            <img src="${liked.photo}" class="like-avatar">
            <div class="like-info">
                <div class="like-name">${liked.fullName}</div>
                <div class="like-status ${mutual ? 'mutual' : ''}">${mutual ? '💞 Взаимно' : '⏳ Ожидание'}</div>
            </div>
            ${mutual ? `<a href="${liked.socialLink}" target="_blank" class="like-link">${liked.socialType === 'tg' ? '📱 TG' : '🌐 VK'}</a>` : ''}
            <button class="like-remove" data-id="${liked.id}">✕</button>
        `;
        list.appendChild(item);
    });

    container.appendChild(list);

    document.querySelectorAll('.like-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            const data = loadData();
            const user = getCurrentUser();
            const target = data.users.find(u => u.id === id);
            if (!user || !target) return;

            const likeIndex = user.likes.indexOf(id);
            if (likeIndex !== -1) user.likes.splice(likeIndex, 1);
            const targetLikedIndex = target.likedBy.indexOf(user.id);
            if (targetLikedIndex !== -1) target.likedBy.splice(targetLikedIndex, 1);

            const targetLikeIndex = target.likes.indexOf(user.id);
            if (targetLikeIndex !== -1) target.likes.splice(targetLikeIndex, 1);
            const userLikedByIndex = user.likedBy.indexOf(id);
            if (userLikedByIndex !== -1) user.likedBy.splice(userLikedByIndex, 1);

            saveData(data);
            renderContent('likes');
        });
    });
}

// ========== Профиль (с кнопками выхода и удаления аккаунта) ==========
function renderProfile(container) {
    const user = getCurrentUser();
    if (!user) return;

    const profileDiv = document.createElement('div');
    profileDiv.innerHTML = `
        <div class="profile-header">
            <img src="${user.photo}" class="profile-avatar-large" id="profileAvatar">
            <div class="profile-name-large">${user.fullName}</div>
            <div class="profile-bio-text" id="profileBio">${user.bio}</div>
        </div>

        <div class="edit-section">
            <h3>Редактировать профиль</h3>
            <div class="edit-form">
                <input type="text" id="editFullname" placeholder="ФИО" value="${user.fullName}">
                <textarea id="editBio" placeholder="О себе" rows="1">${user.bio}</textarea>
                <input type="file" id="editPhoto" accept="image/*" style="display:none;">
                <button id="editPhotoBtn" class="upload-wall-btn">📸 Изменить фото</button>
                <button id="saveProfileBtn">Сохранить изменения</button>
            </div>
        </div>

        <h3 style="color:white; margin:20px 0 10px;">Моя стена</h3>
        <div class="wall-grid" id="wallGrid"></div>
        <input type="file" id="wallUpload" accept="image/*" multiple style="display:none;">
        <div class="upload-wall-btn" id="uploadWallBtn">➕ Добавить фото на стену</div>

        <!-- Кнопка выхода -->
        <button class="logout-btn" id="logoutBtn">🚪 Выйти из аккаунта</button>
        <!-- Кнопка удаления аккаунта -->
        <button class="delete-account-btn" id="deleteAccountBtn">🗑 Удалить аккаунт</button>
    `;
    container.appendChild(profileDiv);

    // Загрузка стены
    const wallGrid = document.getElementById('wallGrid');
    if (user.wall && user.wall.length) {
        user.wall.forEach((photo, index) => {
            const item = document.createElement('div');
            item.className = 'wall-item';
            item.style.backgroundImage = `url('${photo}')`;
            item.addEventListener('click', () => {
                if (confirm('Удалить это фото?')) {
                    user.wall.splice(index, 1);
                    saveData(loadData());
                    renderContent('profile');
                }
            });
            wallGrid.appendChild(item);
        });
    } else {
        wallGrid.innerHTML = '<p style="color:#666;">Нет фото на стене</p>';
    }

    document.getElementById('editPhotoBtn').addEventListener('click', () => {
        document.getElementById('editPhoto').click();
    });
    document.getElementById('editPhoto').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                user.photo = e.target.result;
                saveData(loadData());
                document.getElementById('profileAvatar').src = user.photo;
                showNotification('Фото обновлено');
            };
            reader.readAsDataURL(file);
        }
    });

    document.getElementById('saveProfileBtn').addEventListener('click', () => {
        const newName = document.getElementById('editFullname').value.trim();
        const newBio = document.getElementById('editBio').value.trim();
        if (newName) user.fullName = newName;
        if (newBio) user.bio = newBio;
        saveData(loadData());
        document.getElementById('profileBio').innerText = user.bio;
        document.querySelector('.profile-name-large').innerText = user.fullName;
        showNotification('Профиль обновлён');
        autoResize(document.getElementById('editBio'));
    });

    // Загрузка на стену (множественные файлы)
    document.getElementById('uploadWallBtn').addEventListener('click', () => {
        document.getElementById('wallUpload').click();
    });
    document.getElementById('wallUpload').addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        let processed = 0;
        const newPhotos = [];

        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                newPhotos.push(e.target.result);
                processed++;
                if (processed === files.length) {
                    user.wall = user.wall || [];
                    user.wall.push(...newPhotos);
                    saveData(loadData());
                    renderContent('profile');
                    showNotification(`Добавлено ${newPhotos.length} фото`);
                }
            };
            reader.readAsDataURL(file);
        });
    });

    // Авто-resize для textarea в профиле
    const bioTextarea = document.getElementById('editBio');
    if (bioTextarea) {
        autoResize(bioTextarea);
        bioTextarea.addEventListener('input', function() { autoResize(this); });
    }

    // Обработчик кнопки выхода
    document.getElementById('logoutBtn').addEventListener('click', () => {
        const data = loadData();
        data.currentUserId = null;
        saveData(data);
        registerScreen.classList.add('active');
        mainScreen.classList.remove('active');
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        document.querySelector('[data-tab="home"]').classList.add('active');
        showNotification('Вы вышли из аккаунта');
        document.getElementById('register-form').reset();
        document.getElementById('login-form').reset();
        uploadedPhoto = null;
        photoPreview.style.display = 'none';
        photoPreview.src = '#';
        registerForm.style.display = 'flex';
        loginForm.style.display = 'none';
        switchToLogin.style.display = 'inline';
        switchToRegister.style.display = 'none';
    });

    // Обработчик кнопки удаления аккаунта
    document.getElementById('deleteAccountBtn').addEventListener('click', () => {
        if (confirm('Вы уверены, что хотите удалить аккаунт? Это действие необратимо.')) {
            const data = loadData();
            const userId = user.id;
            // Удаляем пользователя из массива
            data.users = data.users.filter(u => u.id !== userId);
            data.currentUserId = null;
            saveData(data);
            registerScreen.classList.add('active');
            mainScreen.classList.remove('active');
            document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
            document.querySelector('[data-tab="home"]').classList.add('active');
            showNotification('Аккаунт удалён');
            document.getElementById('register-form').reset();
            document.getElementById('login-form').reset();
            uploadedPhoto = null;
            photoPreview.style.display = 'none';
            photoPreview.src = '#';
            registerForm.style.display = 'flex';
            loginForm.style.display = 'none';
            switchToLogin.style.display = 'inline';
            switchToRegister.style.display = 'none';
        }
    });
}

// ========== Инициализация ==========
const data = loadData();
if (data.currentUserId) {
    registerScreen.classList.remove('active');
    mainScreen.classList.add('active');
    renderApp();
} else {
    registerScreen.classList.add('active');
    mainScreen.classList.remove('active');
}

// Активация звуков при первом взаимодействии
document.body.addEventListener('click', () => playSound('click'), { once: true });

initAutoResize();