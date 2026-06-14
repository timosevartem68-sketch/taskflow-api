console.log("TaskFlow JS loaded");

const API_URL = "http://127.0.0.1:8000/api/v1";

// Экран авторизации
const authScreen = document.querySelector("#auth-screen");
const appPage = document.querySelector("#app-page");

const loginTab = document.querySelector("#login-tab");
const registerTab = document.querySelector("#register-tab");
const authForm = document.querySelector("#auth-form");
const fullNameLabel = document.querySelector("#full-name-label");
const fullNameInput = document.querySelector("#auth-full-name");
const emailInput = document.querySelector("#auth-email");
const passwordInput = document.querySelector("#auth-password");
const authSubmitButton = document.querySelector("#auth-submit-button");
const authMessage = document.querySelector("#auth-message");

// Основной интерфейс
const currentUser = document.querySelector("#current-user");
const logoutButton = document.querySelector("#logout-button");
const workspaceContext = document.querySelector("#workspace-context");
const themeToggleButton = document.querySelector("#theme-toggle-button");
const themeToggleIcon = document.querySelector(".theme-toggle-icon");
const themeToggleText = document.querySelector(".theme-toggle-text");

const createTaskButton = document.querySelector("#create-task-button");
const createCard = document.querySelector(".create-card");

const searchInput = document.querySelector(".search-input");
const filterButtons = document.querySelectorAll(".filter-button");
const sidebarLinks = document.querySelectorAll(".sidebar-link");
const crmSections = document.querySelectorAll(".crm-section");

// Модальное окно задачи
const taskModal = document.querySelector("#task-modal");
const closeModalButton = document.querySelector("#close-modal-button");
const cancelTaskButton = document.querySelector("#cancel-task-button");
const taskForm = document.querySelector("#task-form");

const taskTitleInput = document.querySelector("#task-title");
const taskDescriptionInput = document.querySelector("#task-description");
const taskCategoryInput = document.querySelector("#task-category");
const taskPriorityInput = document.querySelector("#task-priority");
// Модальное окно клиента
const openClientModalButton = document.querySelector("#open-client-modal-button");
const clientModal = document.querySelector("#client-modal");
const closeClientModalButton = document.querySelector("#close-client-modal-button");
const cancelClientButton = document.querySelector("#cancel-client-button");
const clientForm = document.querySelector("#client-form");

const clientFullNameInput = document.querySelector("#client-full-name");
const clientCompanyInput = document.querySelector("#client-company");
const clientPhoneInput = document.querySelector("#client-phone");
const clientEmailInput = document.querySelector("#client-email");
const clientSourceInput = document.querySelector("#client-source");
const clientStatusInput = document.querySelector("#client-status");
const clientNoteInput = document.querySelector("#client-note");

const clientSearchInput = document.querySelector("#client-search-input");
const clientStatusFilter = document.querySelector("#client-status-filter");
const clientsList = document.querySelector("#clients-list");

const clientTotalCount = document.querySelector("#client-total-count");
const clientActiveCount = document.querySelector("#client-active-count");
const clientNewCount = document.querySelector("#client-new-count");
const clientLostCount = document.querySelector("#client-lost-count");

// Состояние приложения
let authMode = "login";
let activePriority = "all";
let currentWorkspace = null;
let currentProject = null;
let clients = [];

/*
    localStorage - это маленькое хранилище в браузере.
    Мы кладём туда JWT-токен, чтобы пользователь не входил заново
    после каждого обновления страницы.
*/
function getToken() {
    return localStorage.getItem("taskflow_token");
}

function saveToken(token) {
    localStorage.setItem("taskflow_token", token);
}

function removeToken() {
    localStorage.removeItem("taskflow_token");
}

/*
    Заголовок Authorization нужен backend, чтобы понять,
    какой пользователь делает запрос.
*/
function getAuthHeaders() {
    return {
        "Authorization": `Bearer ${getToken()}`,
    };
}

function getJsonAuthHeaders() {
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getToken()}`,
    };
}

function showAuthScreen() {
    authScreen.classList.remove("hidden");
    appPage.classList.add("hidden");
}

function showAppPage(user) {
    authScreen.classList.add("hidden");
    appPage.classList.remove("hidden");

    const userName = user.full_name || user.email;
    const firstLetter = userName.slice(0, 1).toUpperCase();

    currentUser.innerHTML = `
        <span class="current-user-avatar">${firstLetter}</span>
        <span class="current-user-name">${escapeHtml(userName)}</span>
    `;
}

function showAuthMessage(message, type = "error") {
    authMessage.innerText = message;

    if (type === "success") {
        authMessage.classList.add("success");
    } else {
        authMessage.classList.remove("success");
    }
}

function clearAuthMessage() {
    authMessage.innerText = "";
    authMessage.classList.remove("success");
}

function setAuthMode(mode) {
    authMode = mode;
    clearAuthMessage();

    if (mode === "login") {
        loginTab.classList.add("active");
        registerTab.classList.remove("active");

        fullNameLabel.classList.add("hidden");
        fullNameInput.removeAttribute("required");

        authSubmitButton.innerText = "Войти";
    } else {
        registerTab.classList.add("active");
        loginTab.classList.remove("active");

        fullNameLabel.classList.remove("hidden");
        fullNameInput.setAttribute("required", "required");

        authSubmitButton.innerText = "Зарегистрироваться";
    }
}

/*
    Универсальная функция для запросов к API.
    Она:
    1. отправляет запрос
    2. получает JSON
    3. если ошибка - красиво достаёт текст ошибки
*/
async function requestJson(url, options = {}) {
    const response = await fetch(url, options);

    const data = await response.json().catch(function () {
        return {};
    });

    if (!response.ok) {
        let message = "Ошибка запроса";

        if (typeof data.detail === "string") {
            message = data.detail;
        }

        if (Array.isArray(data.detail)) {
            message = data.detail
                .map(function (errorItem) {
                    return errorItem.msg || "Ошибка валидации";
                })
                .join("; ");
        }

        console.error("Ошибка API:", response.status, data);

        throw new Error(message);
    }

    return data;
}

/*
    Некоторые endpoints могут вернуть просто массив:
    [ ... ]

    А некоторые могут вернуть пагинацию:
    {
        items: [ ... ],
        total: 10
    }

    Эта функция делает оба варианта нормальными.
*/
function normalizeList(data) {
    if (Array.isArray(data)) {
        return data;
    }

    if (data && Array.isArray(data.items)) {
        return data.items;
    }

    return [];
}
// -------------------- THEME --------------------

function getSavedTheme() {
    return localStorage.getItem("taskflow_theme") || "dark";
}

function saveTheme(theme) {
    localStorage.setItem("taskflow_theme", theme);
}

function applyTheme(theme) {
    if (theme === "light") {
        document.body.classList.add("light-theme");

        if (themeToggleIcon) {
            themeToggleIcon.innerText = "☀";
        }

        if (themeToggleText) {
            themeToggleText.innerText = "Светлая";
        }
    } else {
        document.body.classList.remove("light-theme");

        if (themeToggleIcon) {
            themeToggleIcon.innerText = "☾";
        }

        if (themeToggleText) {
            themeToggleText.innerText = "Тёмная";
        }
    }
}

function toggleTheme() {
    const currentTheme = getSavedTheme();
    const nextTheme = currentTheme === "dark" ? "light" : "dark";

    saveTheme(nextTheme);
    applyTheme(nextTheme);
}
// -------------------- AUTH --------------------


async function registerUser() {
    await requestJson(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            email: emailInput.value.trim(),
            password: passwordInput.value,
            full_name: fullNameInput.value.trim(),
        }),
    });

    showAuthMessage("Регистрация прошла успешно. Теперь войдите.", "success");
    setAuthMode("login");
}

async function loginUser() {
    const data = await requestJson(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            email: emailInput.value.trim(),
            password: passwordInput.value,
        }),
    });

    saveToken(data.access_token);

    const user = await getCurrentUser();

    showAppPage(user);
    await loadDashboardData();
}

async function getCurrentUser() {
    return await requestJson(`${API_URL}/auth/me`, {
        method: "GET",
        headers: getAuthHeaders(),
    });
}

async function checkAuthOnStart() {
    const token = getToken();

    if (!token) {
        showAuthScreen();
        return;
    }

    try {
        const user = await getCurrentUser();

        showAppPage(user);
        await loadDashboardData();
    } catch (error) {
        console.error(error);
        removeToken();
        showAuthScreen();
    }
}

// -------------------- WORKSPACE / PROJECT --------------------

async function loadDashboardData() {
    currentWorkspace = await getOrCreateWorkspace();
    currentProject = await getOrCreateProject(currentWorkspace.id);

    workspaceContext.innerText = `${currentWorkspace.name} · ${currentProject.name}`;

    await loadTasks();
    await loadClientsFromApi();
}

async function getOrCreateWorkspace() {
    const data = await requestJson(`${API_URL}/workspaces`, {
        method: "GET",
        headers: getAuthHeaders(),
    });

    const workspaces = normalizeList(data);

    if (workspaces.length > 0) {
        return workspaces[0];
    }

    return await requestJson(`${API_URL}/workspaces`, {
        method: "POST",
        headers: getJsonAuthHeaders(),
        body: JSON.stringify({
            name: "Личное рабочее пространство",
        }),
    });
}

async function getOrCreateProject(workspaceId) {
    const data = await requestJson(`${API_URL}/projects?workspace_id=${workspaceId}`, {
        method: "GET",
        headers: getAuthHeaders(),
    });

    const projects = normalizeList(data);

    if (projects.length > 0) {
        return projects[0];
    }

    return await requestJson(`${API_URL}/projects`, {
        method: "POST",
        headers: getJsonAuthHeaders(),
        body: JSON.stringify({
            workspace_id: workspaceId,
            name: "Основной проект",
            description: "Первый проект в TaskFlow CRM",
        }),
    });
}

// -------------------- TASKS --------------------

async function loadTasks() {
    if (!currentProject) {
        return;
    }

    const data = await requestJson(`${API_URL}/tasks?project_id=${currentProject.id}`, {
        method: "GET",
        headers: getAuthHeaders(),
    });

    const tasks = normalizeList(data);

    renderTasks(tasks);
}

async function createTaskFromForm() {
    if (!currentProject) {
        alert("Проект ещё не загружен");
        return;
    }

    const createdTask = await requestJson(`${API_URL}/tasks`, {
        method: "POST",
        headers: getJsonAuthHeaders(),
        body: JSON.stringify({
            project_id: currentProject.id,
            title: taskTitleInput.value.trim(),
            description: taskDescriptionInput.value.trim(),
            priority: taskPriorityInput.value,
            assignee_id: null,
            due_date: null,
        }),
    });

    renderTaskCard(createdTask);
    updateColumnCounters();
    updateStats();
    filterTasks();
}

function getTaskCards() {
    return document.querySelectorAll(".task-card");
}

function getColumns() {
    return document.querySelectorAll(".column");
}

function getColumnByStatus(status) {
    return document.querySelector(`.column[data-status="${status}"]`);
}

function clearTaskCards() {
    const cards = getTaskCards();

    cards.forEach(function (card) {
        card.remove();
    });
}

function renderTasks(tasks) {
    clearTaskCards();

    tasks.forEach(function (task) {
        renderTaskCard(task);
    });

    updateColumnCounters();
    updateStats();
    filterTasks();
}

function renderTaskCard(task) {
    const status = task.status || "todo";
    const column = getColumnByStatus(status);

    if (!column) {
        console.warn("Не найдена колонка для статуса:", status);
        return;
    }

    const taskCard = document.createElement("article");
    const color = getTaskColorByPriority(task.priority);

    taskCard.className = `task-card ${color}`;
    taskCard.dataset.priority = task.priority || "medium";
    taskCard.dataset.taskId = task.id;

    taskCard.innerHTML = `
        <div class="task-category">${getPriorityLabel(task.priority)}</div>
        <h3>${escapeHtml(task.title)}</h3>
        <p>${escapeHtml(task.description || "Без описания")}</p>

        <div class="task-progress">
            <span>Статус</span>
            <span>${getStatusLabel(status)}</span>
        </div>

        <div class="progress-line">
            <div style="width: ${getProgressByStatus(status)}%;"></div>
        </div>

        <div class="task-meta">
            <span>${formatDate(task.due_date)}</span>
            <span>ID: ${task.id}</span>
        </div>
    `;

    const addButton = column.querySelector(".add-column-button");

    column.insertBefore(taskCard, addButton);
}

function getTaskColorByPriority(priority) {
    if (priority === "high") {
        return "red";
    }

    if (priority === "low") {
        return "blue";
    }

    return "yellow";
}

function getPriorityLabel(priority) {
    if (priority === "high") {
        return "Высокий";
    }

    if (priority === "medium") {
        return "Средний";
    }

    if (priority === "low") {
        return "Низкий";
    }

    return "Средний";
}

function getStatusLabel(status) {
    if (status === "todo") {
        return "Очередь";
    }

    if (status === "in_progress") {
        return "В работе";
    }

    if (status === "done") {
        return "Выполнено";
    }

    if (status === "cancelled") {
        return "Отменено";
    }

    return status;
}

function getProgressByStatus(status) {
    if (status === "todo") {
        return 10;
    }

    if (status === "in_progress") {
        return 50;
    }

    if (status === "done") {
        return 100;
    }

    if (status === "cancelled") {
        return 0;
    }

    return 10;
}

function formatDate(dateValue) {
    if (!dateValue) {
        return "Без срока";
    }

    return String(dateValue).slice(0, 10);
}

/*
    escapeHtml защищает интерфейс.
    Если пользователь введёт HTML-код в название задачи,
    мы покажем его как текст, а не выполним как код.
*/
function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

// -------------------- MODAL --------------------

function openTaskModal() {
    taskModal.classList.remove("hidden");
    taskTitleInput.focus();
}

function closeTaskModal() {
    taskModal.classList.add("hidden");
    taskForm.reset();
}

// -------------------- FILTERS / STATS --------------------

function filterTasks() {
    const searchValue = searchInput.value.toLowerCase().trim();
    const taskCards = getTaskCards();

    taskCards.forEach(function (taskCard) {
        const taskText = taskCard.innerText.toLowerCase();
        const taskPriority = taskCard.dataset.priority;

        const matchesSearch = taskText.includes(searchValue);
        const matchesPriority =
            activePriority === "all" || taskPriority === activePriority;

        if (matchesSearch && matchesPriority) {
            taskCard.style.display = "block";
        } else {
            taskCard.style.display = "none";
        }
    });
}

function updateColumnCounters() {
    const columns = getColumns();

    columns.forEach(function (column) {
        const tasks = column.querySelectorAll(".task-card");
        const counter = column.querySelector(".column-header span");

        counter.innerText = tasks.length;
    });
}

function updateStats() {
    const allTasks = getTaskCards();
    const doneTasks = document.querySelectorAll('.column[data-status="done"] .task-card');
    const inProgressTasks = document.querySelectorAll('.column[data-status="in_progress"] .task-card');

    const statValues = document.querySelectorAll(".stat-value");
    const statTexts = document.querySelectorAll(".stat-text");

    const total = allTasks.length;
    const done = doneTasks.length;
    const inProgress = inProgressTasks.length;

    const percent = total > 0 ? Math.round((done / total) * 100) : 0;

    if (statValues[0]) {
        statValues[0].innerText = `${percent}%`;
    }

    if (statTexts[0]) {
        statTexts[0].innerText = `${done} из ${total} задач выполнено`;
    }

    if (statValues[1]) {
        statValues[1].innerText = `${inProgress}`;
    }

    if (statTexts[1]) {
        statTexts[1].innerText = "Задач сейчас в работе";
    }

    if (statValues[2]) {
        statValues[2].innerText = `${total}`;
    }

    if (statTexts[2]) {
        statTexts[2].innerText = "Всего задач в проекте";
    }
}
// -------------------- CLIENTS --------------------

function normalizeClientStatusForApi(status) {
    if (status === "in_work") {
        return "in_progress";
    }

    if (status === "loyal") {
        return "active";
    }

    return status || "new";
}

function normalizeClientStatusForFrontend(status) {
    if (status === "in_work") {
        return "in_progress";
    }

    if (status === "loyal") {
        return "active";
    }

    return status || "new";
}

function normalizeClientFromApi(client) {
    return {
        id: client.id,
        workspaceId: client.workspace_id,
        fullName: client.full_name,
        company: client.company,
        phone: client.phone,
        email: client.email,
        source: client.source,
        status: normalizeClientStatusForFrontend(client.status),
        note: client.note,
        responsibleId: client.responsible_id,
        createdById: client.created_by_id,
        createdAt: client.created_at,
        updatedAt: client.updated_at,
    };
}

async function loadClientsFromApi() {
    if (!currentWorkspace) {
        clients = [];
        renderClients();
        return;
    }

    const data = await requestJson(
        `${API_URL}/clients?workspace_id=${currentWorkspace.id}&limit=100&sort_by=created_at&sort_order=desc`,
        {
            method: "GET",
            headers: getAuthHeaders(),
        }
    );

    clients = normalizeList(data).map(function (client) {
        return normalizeClientFromApi(client);
    });

    renderClients();
}

function openClientModal() {
    if (!clientModal) {
        return;
    }

    clientModal.classList.remove("hidden");
    clientFullNameInput.focus();
}

function closeClientModal() {
    if (!clientModal || !clientForm) {
        return;
    }

    clientModal.classList.add("hidden");
    clientForm.reset();
}

function getClientStatusLabel(status) {
    if (status === "new") {
        return "Новый";
    }

    if (status === "in_progress" || status === "in_work") {
        return "В работе";
    }

    if (status === "active" || status === "loyal") {
        return "Активный";
    }

    if (status === "lost") {
        return "Потерянный";
    }

    return "Новый";
}

function getClientAvatarLetter(fullName) {
    if (!fullName) {
        return "?";
    }

    return fullName.trim().slice(0, 1).toUpperCase();
}

async function createClientFromForm() {
    if (!currentWorkspace) {
        alert("Рабочее пространство ещё не загружено");
        return;
    }

    const createdClient = await requestJson(`${API_URL}/clients`, {
        method: "POST",
        headers: getJsonAuthHeaders(),
        body: JSON.stringify({
            workspace_id: currentWorkspace.id,
            full_name: clientFullNameInput.value.trim(),
            company: clientCompanyInput.value.trim() || null,
            phone: clientPhoneInput.value.trim() || null,
            email: clientEmailInput.value.trim() || null,
            source: clientSourceInput.value || null,
            status: normalizeClientStatusForApi(clientStatusInput.value),
            note: clientNoteInput.value.trim() || null,
            responsible_id: null,
        }),
    });

    clients.unshift(normalizeClientFromApi(createdClient));
    renderClients();
}

function renderClients() {
    if (!clientsList) {
        return;
    }

    const searchValue = clientSearchInput ? clientSearchInput.value.toLowerCase().trim() : "";
    const statusValue = clientStatusFilter
        ? normalizeClientStatusForFrontend(clientStatusFilter.value)
        : "all";

    const filteredClients = clients.filter(function (client) {
        const clientText = [
            client.fullName,
            client.company,
            client.phone,
            client.email,
            client.source,
            getClientStatusLabel(client.status),
        ].join(" ").toLowerCase();

        const matchesSearch = clientText.includes(searchValue);
        const matchesStatus = statusValue === "all" || client.status === statusValue;

        return matchesSearch && matchesStatus;
    });

    if (filteredClients.length === 0) {
        clientsList.innerHTML = `
            <div class="empty-state">
                <h3>Клиенты не найдены</h3>
                <p>Попробуйте изменить поиск или добавьте нового клиента.</p>
            </div>
        `;
    } else {
        clientsList.innerHTML = filteredClients
            .map(function (client) {
                return `
                    <article class="client-card">
                        <div class="client-main">
                            <div class="client-avatar">${escapeHtml(getClientAvatarLetter(client.fullName))}</div>

                            <div>
                                <div class="client-name">${escapeHtml(client.fullName)}</div>
                                <div class="client-company">${escapeHtml(client.company || "Компания не указана")}</div>
                            </div>
                        </div>

                        <div class="client-contact">
                            <div><strong>Телефон:</strong> ${escapeHtml(client.phone || "Не указан")}</div>
                            <div><strong>Email:</strong> ${escapeHtml(client.email || "Не указан")}</div>
                            <div><strong>Источник:</strong> ${escapeHtml(client.source || "Не указан")}</div>
                        </div>

                        <div class="client-status client-status--${client.status}">
                            ${escapeHtml(getClientStatusLabel(client.status))}
                        </div>

                        <p class="client-note">${escapeHtml(client.note || "Заметка пока не добавлена")}</p>
                    </article>
                `;
            })
            .join("");
    }

    updateClientStats();
}

function updateClientStats() {
    const total = clients.length;

    const active = clients.filter(function (client) {
        return client.status === "in_progress";
    }).length;

    const newest = clients.filter(function (client) {
        return client.status === "new";
    }).length;

    const lost = clients.filter(function (client) {
        return client.status === "lost";
    }).length;

    if (clientTotalCount) {
        clientTotalCount.innerText = total;
    }

    if (clientActiveCount) {
        clientActiveCount.innerText = active;
    }

    if (clientNewCount) {
        clientNewCount.innerText = newest;
    }

    if (clientLostCount) {
        clientLostCount.innerText = lost;
    }
}

// -------------------- EVENTS --------------------

loginTab.addEventListener("click", function () {
    setAuthMode("login");
});

registerTab.addEventListener("click", function () {
    setAuthMode("register");
});

authForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    clearAuthMessage();

    try {
        if (authMode === "register") {
            await registerUser();
        } else {
            await loginUser();
        }
    } catch (error) {
        showAuthMessage(error.message);
    }
});

logoutButton.addEventListener("click", function () {
    removeToken();
    currentWorkspace = null;
    currentProject = null;
    clearTaskCards();
    showAuthScreen();
});

if (themeToggleButton) {
    themeToggleButton.addEventListener("click", function () {
        toggleTheme();
    });
}

createTaskButton.addEventListener("click", function () {
    openTaskModal();
});

if (createCard) {
    createCard.addEventListener("click", function () {
        openTaskModal();
    });
}

const addColumnButtons = document.querySelectorAll(".add-column-button");

addColumnButtons.forEach(function (button) {
    button.addEventListener("click", function () {
        openTaskModal();
    });
});

closeModalButton.addEventListener("click", function () {
    closeTaskModal();
});

cancelTaskButton.addEventListener("click", function () {
    closeTaskModal();
});

taskModal.addEventListener("click", function (event) {
    if (event.target === taskModal) {
        closeTaskModal();
    }
});

taskForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    try {
        await createTaskFromForm();
        closeTaskModal();
    } catch (error) {
        alert(error.message);
    }
});

searchInput.addEventListener("input", function () {
    filterTasks();
});

filterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
        filterButtons.forEach(function (item) {
            item.classList.remove("active");
        });

        button.classList.add("active");

        const buttonText = button.innerText.toLowerCase();

        if (buttonText === "все") {
            activePriority = "all";
        }

        if (buttonText === "высокий") {
            activePriority = "high";
        }

        if (buttonText === "средний") {
            activePriority = "medium";
        }

        if (buttonText === "низкий") {
            activePriority = "low";
        }

        filterTasks();
    });
});
function showCrmSection(sectionName) {
    crmSections.forEach(function (section) {
        if (section.dataset.sectionPage === sectionName) {
            section.classList.add("active");
        } else {
            section.classList.remove("active");
        }
    });
}

sidebarLinks.forEach(function (link) {
    link.addEventListener("click", function () {
        sidebarLinks.forEach(function (item) {
            item.classList.remove("active");
        });

        link.classList.add("active");

        const sectionName = link.dataset.section;

        showCrmSection(sectionName);

        console.log("Открыт раздел CRM:", sectionName);
    });
});

if (openClientModalButton) {
    openClientModalButton.addEventListener("click", function () {
        openClientModal();
    });
}

if (closeClientModalButton) {
    closeClientModalButton.addEventListener("click", function () {
        closeClientModal();
    });
}

if (cancelClientButton) {
    cancelClientButton.addEventListener("click", function () {
        closeClientModal();
    });
}

if (clientModal) {
    clientModal.addEventListener("click", function (event) {
        if (event.target === clientModal) {
            closeClientModal();
        }
    });
}

if (clientForm) {
    clientForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        try {
            await createClientFromForm();
            closeClientModal();
        } catch (error) {
            alert(error.message);
        }
    });
}

if (clientSearchInput) {
    clientSearchInput.addEventListener("input", function () {
        renderClients();
    });
}

if (clientStatusFilter) {
    clientStatusFilter.addEventListener("change", function () {
        renderClients();
    });
}


// -------------------- START --------------------

applyTheme(getSavedTheme());
setAuthMode("login");
updateColumnCounters();
updateStats();
updateClientStats();
checkAuthOnStart();