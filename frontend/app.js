console.log("MarsDesk JS loaded");

const API_URL = "http://127.0.0.1:8000/api/v1";

const RUB_FORMATTER = new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
});

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
const clientResponsibleInput = document.querySelector("#client-responsible");
const clientNoteInput = document.querySelector("#client-note");
const clientModalTitle = document.querySelector("#client-modal-title");
const clientModalSubtitle = document.querySelector("#client-modal-subtitle");
const clientSubmitButton = document.querySelector("#client-submit-button");
const clientSearchInput = document.querySelector("#client-search-input");
const clientStatusFilter = document.querySelector("#client-status-filter");
const clientResponsibleFilter = document.querySelector("#client-responsible-filter");
const clientsList = document.querySelector("#clients-list");

const clientTotalCount = document.querySelector("#client-total-count");
const clientActiveCount = document.querySelector("#client-active-count");
const clientNewCount = document.querySelector("#client-new-count");
const clientLostCount = document.querySelector("#client-lost-count");

// Раздел команды
const teamSearchInput = document.querySelector("#team-search-input");
const teamRoleFilter = document.querySelector("#team-role-filter");
const teamList = document.querySelector("#team-list");
const teamTotalCount = document.querySelector("#team-total-count");
const teamManagerCount = document.querySelector("#team-manager-count");
const teamMemberCount = document.querySelector("#team-member-count");
const teamAssignedCount = document.querySelector("#team-assigned-count");

// Раздел сделок
const openDealModalButton = document.querySelector("#open-deal-modal-button");
const dealModal = document.querySelector("#deal-modal");
const closeDealModalButton = document.querySelector("#close-deal-modal-button");
const cancelDealButton = document.querySelector("#cancel-deal-button");
const dealForm = document.querySelector("#deal-form");

const dealTitleInput = document.querySelector("#deal-title");
const dealClientInput = document.querySelector("#deal-client");
const dealAmountInput = document.querySelector("#deal-amount");
const dealStageInput = document.querySelector("#deal-stage");
const dealResponsibleInput = document.querySelector("#deal-responsible");
const dealNoteInput = document.querySelector("#deal-note");
const dealModalTitle = document.querySelector("#deal-modal-title");
const dealModalSubtitle = document.querySelector("#deal-modal-subtitle");
const dealSubmitButton = document.querySelector("#deal-submit-button");

const dealSearchInput = document.querySelector("#deal-search-input");
const dealResponsibleFilter = document.querySelector("#deal-responsible-filter");
const dealsBoard = document.querySelector("#deals-board");

const dealTotalCount = document.querySelector("#deal-total-count");
const dealPipelineAmount = document.querySelector("#deal-pipeline-amount");
const dealWonAmount = document.querySelector("#deal-won-amount");
const dealLostCount = document.querySelector("#deal-lost-count");

// Состояние приложения
let authMode = "login";
let activePriority = "all";
let currentWorkspace = null;
let currentProject = null;
let clients = [];
let workspaceMembers = [];
let deals = [];
let editingClientId = null;
let editingDealId = null;
let dashboardLoadPromise = null;

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

function debounce(callback, delay = 180) {
    let timeoutId = null;

    return function (...args) {
        clearTimeout(timeoutId);

        timeoutId = setTimeout(function () {
            callback(...args);
        }, delay);
    };
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
    if (dashboardLoadPromise) {
        return dashboardLoadPromise;
    }

    dashboardLoadPromise = (async function () {
        currentWorkspace = await getOrCreateWorkspace();
        currentProject = await getOrCreateProject(currentWorkspace.id);

        workspaceContext.innerText = `${currentWorkspace.name} · ${currentProject.name}`;

        await Promise.all([
            loadTasks(),
            loadWorkspaceMembers(false),
            loadClientsFromApi(false),
            loadDealsFromApi(false),
        ]);

        refreshResponsibleControls();
        renderClients();
        renderDeals();
        renderTeam();
    })();

    try {
        await dashboardLoadPromise;
    } finally {
        dashboardLoadPromise = null;
    }
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
            description: "Первый проект в MarsDesk CRM",
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

function normalizeWorkspaceMember(member) {
    return {
        id: member.id,
        workspaceId: member.workspace_id,
        userId: member.user_id,
        role: member.role,
        fullName: member.full_name,
        email: member.email,
        createdAt: member.created_at,
    };
}

function getWorkspaceMemberLabel(member) {
    if (!member) {
        return "Не назначен";
    }

    return member.fullName || member.email || `Пользователь #${member.userId}`;
}

function getWorkspaceMemberByUserId(userId) {
    if (userId === null || userId === undefined) {
        return null;
    }

    return workspaceMembers.find(function (member) {
        return member.userId === Number(userId);
    }) || null;
}

function getResponsibleLabel(userId) {
    return getWorkspaceMemberLabel(getWorkspaceMemberByUserId(userId));
}

function parseResponsibleId(value) {
    if (value === "" || value === null || value === undefined) {
        return null;
    }

    const responsibleId = Number(value);

    return Number.isInteger(responsibleId) && responsibleId > 0
        ? responsibleId
        : null;
}

function buildResponsibleOptions(selectedUserId = null, mode = "form") {
    const selectedValue = selectedUserId === null || selectedUserId === undefined
        ? ""
        : String(selectedUserId);

    let options = "";

    if (mode === "filter") {
        options += '<option value="all">Все ответственные</option>';
        options += '<option value="unassigned">Не назначен</option>';
    } else {
        options += `<option value="" ${selectedValue === "" ? "selected" : ""}>Не назначен</option>`;
    }

    options += workspaceMembers
        .map(function (member) {
            const value = String(member.userId);
            const selected = value === selectedValue ? "selected" : "";
            const label = getWorkspaceMemberLabel(member);

            return `<option value="${value}" ${selected}>${escapeHtml(label)}</option>`;
        })
        .join("");

    return options;
}

function refreshResponsibleControls() {
    if (clientResponsibleInput) {
        const selectedValue = clientResponsibleInput.value || "";
        clientResponsibleInput.innerHTML = buildResponsibleOptions(
            parseResponsibleId(selectedValue),
            "form"
        );
    }

    if (clientResponsibleFilter) {
        const selectedValue = clientResponsibleFilter.value || "all";
        clientResponsibleFilter.innerHTML = buildResponsibleOptions(null, "filter");

        const hasSelectedOption = Array.from(clientResponsibleFilter.options)
            .some(function (option) {
                return option.value === selectedValue;
            });

        clientResponsibleFilter.value = hasSelectedOption
            ? selectedValue
            : "all";
    }

    if (dealResponsibleInput) {
        const selectedValue = dealResponsibleInput.value || "";
        dealResponsibleInput.innerHTML = buildResponsibleOptions(
            parseResponsibleId(selectedValue),
            "form"
        );
    }

    if (dealResponsibleFilter) {
        const selectedValue = dealResponsibleFilter.value || "all";
        dealResponsibleFilter.innerHTML = buildResponsibleOptions(null, "filter");

        const hasSelectedOption = Array.from(dealResponsibleFilter.options)
            .some(function (option) {
                return option.value === selectedValue;
            });

        dealResponsibleFilter.value = hasSelectedOption
            ? selectedValue
            : "all";
    }
}

async function loadWorkspaceMembers(shouldRender = true) {
    if (!currentWorkspace) {
        workspaceMembers = [];

        if (shouldRender) {
            refreshResponsibleControls();
            renderTeam();
        }

        return;
    }

    const data = await requestJson(
        `${API_URL}/workspaces/${currentWorkspace.id}/members`,
        {
            method: "GET",
            headers: getAuthHeaders(),
        }
    );

    workspaceMembers = normalizeList(data)
        .map(function (member) {
            return normalizeWorkspaceMember(member);
        })
        .sort(function (firstMember, secondMember) {
            return getWorkspaceMemberLabel(firstMember)
                .localeCompare(getWorkspaceMemberLabel(secondMember), "ru");
        });

    if (shouldRender) {
        refreshResponsibleControls();
        renderClients();
        renderDeals();
        renderTeam();
    }
}

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

async function loadClientsFromApi(shouldRender = true) {
    if (!currentWorkspace) {
        clients = [];

        if (shouldRender) {
            renderClients();
            renderTeam();
            renderDeals();
        }

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

    if (shouldRender) {
        renderClients();
        renderTeam();
        renderDeals();
    }
}

function openClientModal(client = null) {
    if (!clientModal || !clientForm) {
        return;
    }

    clientForm.reset();

    if (client) {
        editingClientId = client.id;

        clientModalTitle.innerText = "Изменить клиента";
        clientModalSubtitle.innerText = "Обновите данные клиента и сохраните изменения";
        clientSubmitButton.innerText = "Сохранить изменения";

        clientFullNameInput.value = client.fullName || "";
        clientCompanyInput.value = client.company || "";
        clientPhoneInput.value = client.phone || "";
        clientEmailInput.value = client.email || "";
        clientSourceInput.value = client.source || "Сайт";
        clientStatusInput.value = client.status || "new";
        clientResponsibleInput.innerHTML = buildResponsibleOptions(
            client.responsibleId,
            "form"
        );
        clientResponsibleInput.value = client.responsibleId === null
            ? ""
            : String(client.responsibleId);
        clientNoteInput.value = client.note || "";
    } else {
        editingClientId = null;

        clientModalTitle.innerText = "Добавить клиента";
        clientModalSubtitle.innerText = "Заполните основные данные клиента для CRM-базы";
        clientSubmitButton.innerText = "Сохранить клиента";

        clientSourceInput.value = "Сайт";
        clientStatusInput.value = "new";
        clientResponsibleInput.innerHTML = buildResponsibleOptions(null, "form");
        clientResponsibleInput.value = "";
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

    editingClientId = null;

    clientModalTitle.innerText = "Добавить клиента";
    clientModalSubtitle.innerText = "Заполните основные данные клиента для CRM-базы";
    clientSubmitButton.innerText = "Сохранить клиента";
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
            responsible_id: parseResponsibleId(clientResponsibleInput.value),
        }),
    });

    clients.unshift(normalizeClientFromApi(createdClient));
    renderClients();
    renderTeam();
    renderDeals();
}

async function updateClientFromForm(clientId) {
    const updatedClient = await requestJson(`${API_URL}/clients/${clientId}`, {
        method: "PATCH",
        headers: getJsonAuthHeaders(),
        body: JSON.stringify({
            full_name: clientFullNameInput.value.trim(),
            company: clientCompanyInput.value.trim() || null,
            phone: clientPhoneInput.value.trim() || null,
            email: clientEmailInput.value.trim() || null,
            source: clientSourceInput.value || null,
            status: normalizeClientStatusForApi(clientStatusInput.value),
            note: clientNoteInput.value.trim() || null,
            responsible_id: parseResponsibleId(clientResponsibleInput.value),
        }),
    });

    const normalizedClient = normalizeClientFromApi(updatedClient);

    clients = clients.map(function (client) {
        if (client.id === clientId) {
            return normalizedClient;
        }

        return client;
    });

    renderClients();
    renderTeam();
    renderDeals();
}

async function updateClientStatus(clientId, status) {
    const updatedClient = await requestJson(
        `${API_URL}/clients/${clientId}/status`,
        {
            method: "PATCH",
            headers: getJsonAuthHeaders(),
            body: JSON.stringify({
                status: normalizeClientStatusForApi(status),
            }),
        }
    );

    const normalizedClient = normalizeClientFromApi(updatedClient);

    clients = clients.map(function (client) {
        if (client.id === clientId) {
            return normalizedClient;
        }

        return client;
    });

    renderClients();
}

async function updateClientResponsible(clientId, responsibleId) {
    const updatedClient = await requestJson(
        `${API_URL}/clients/${clientId}/responsible`,
        {
            method: "PATCH",
            headers: getJsonAuthHeaders(),
            body: JSON.stringify({
                responsible_id: responsibleId,
            }),
        }
    );

    const normalizedClient = normalizeClientFromApi(updatedClient);

    clients = clients.map(function (client) {
        if (client.id === clientId) {
            return normalizedClient;
        }

        return client;
    });

    renderClients();
    renderTeam();
}

async function deleteClient(clientId) {
    const confirmed = confirm("Удалить клиента? Это действие нельзя отменить.");

    if (!confirmed) {
        return;
    }

    await requestJson(`${API_URL}/clients/${clientId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
    });

    clients = clients.filter(function (client) {
        return client.id !== clientId;
    });

    renderClients();
    renderTeam();
    renderDeals();
}

function renderClients() {
    if (!clientsList) {
        return;
    }

    const searchValue = clientSearchInput
        ? clientSearchInput.value.toLowerCase().trim()
        : "";

    const statusValue = clientStatusFilter
        ? normalizeClientStatusForFrontend(clientStatusFilter.value)
        : "all";

    const responsibleValue = clientResponsibleFilter
        ? clientResponsibleFilter.value
        : "all";

    const filteredClients = clients.filter(function (client) {
        const responsibleLabel = getResponsibleLabel(client.responsibleId);

        const clientText = [
            client.fullName,
            client.company,
            client.phone,
            client.email,
            client.source,
            responsibleLabel,
            getClientStatusLabel(client.status),
        ].join(" ").toLowerCase();

        const matchesSearch = clientText.includes(searchValue);
        const matchesStatus = statusValue === "all" || client.status === statusValue;

        let matchesResponsible = true;

        if (responsibleValue === "unassigned") {
            matchesResponsible = client.responsibleId === null;
        } else if (responsibleValue !== "all") {
            matchesResponsible = client.responsibleId === Number(responsibleValue);
        }

        return matchesSearch && matchesStatus && matchesResponsible;
    });

    if (filteredClients.length === 0) {
        clientsList.innerHTML = `
            <div class="empty-state md-animate-in">
                <h3>Клиенты не найдены</h3>
                <p>Попробуйте изменить фильтры или добавьте нового клиента.</p>
            </div>
        `;
    } else {
        clientsList.innerHTML = filteredClients
            .map(function (client) {
                const responsibleName = getResponsibleLabel(client.responsibleId);

                return `
                    <article class="client-card md-animate-in">
                        <div class="client-main">
                            <div class="client-avatar">
                                ${escapeHtml(getClientAvatarLetter(client.fullName))}
                            </div>

                            <div class="client-identity">
                                <div class="client-name">${escapeHtml(client.fullName)}</div>
                                <div class="client-company">
                                    ${escapeHtml(client.company || "Компания не указана")}
                                </div>
                            </div>
                        </div>

                        <div class="client-contact">
                            <div>
                                <strong>Телефон</strong>
                                <span>${escapeHtml(client.phone || "Не указан")}</span>
                            </div>
                            <div>
                                <strong>Email</strong>
                                <span>${escapeHtml(client.email || "Не указан")}</span>
                            </div>
                            <div>
                                <strong>Источник</strong>
                                <span>${escapeHtml(client.source || "Не указан")}</span>
                            </div>
                        </div>

                        <div class="client-controls">
                            <label class="client-control">
                                <span>Статус</span>
                                <select
                                    class="client-status-select client-status--${client.status}"
                                    data-client-id="${client.id}"
                                    aria-label="Статус клиента"
                                >
                                    <option value="new" ${client.status === "new" ? "selected" : ""}>
                                        Новый
                                    </option>
                                    <option value="in_progress" ${client.status === "in_progress" ? "selected" : ""}>
                                        В работе
                                    </option>
                                    <option value="active" ${client.status === "active" ? "selected" : ""}>
                                        Активный
                                    </option>
                                    <option value="lost" ${client.status === "lost" ? "selected" : ""}>
                                        Потерянный
                                    </option>
                                </select>
                            </label>

                            <label class="client-control">
                                <span>Ответственный</span>
                                <select
                                    class="client-responsible-select"
                                    data-client-id="${client.id}"
                                    aria-label="Ответственный сотрудник"
                                    title="${escapeHtml(responsibleName)}"
                                >
                                    ${buildResponsibleOptions(client.responsibleId, "form")}
                                </select>
                            </label>
                        </div>

                        <p class="client-note">
                            ${escapeHtml(client.note || "Заметка пока не добавлена")}
                        </p>

                        <div class="client-actions">
                            <button
                                class="ghost-button client-edit-button"
                                type="button"
                                data-client-id="${client.id}"
                            >
                                Изменить
                            </button>

                            <button
                                class="ghost-button client-delete-button"
                                type="button"
                                data-client-id="${client.id}"
                            >
                                Удалить
                            </button>
                        </div>
                    </article>
                `;
            })
            .join("");
    }

    updateClientStats();
    bindClientActionButtons();
}

function bindClientActionButtons() {
    const editButtons = document.querySelectorAll(".client-edit-button");
    const statusSelects = document.querySelectorAll(".client-status-select");
    const responsibleSelects = document.querySelectorAll(".client-responsible-select");
    const deleteButtons = document.querySelectorAll(".client-delete-button");

    editButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            const clientId = Number(button.dataset.clientId);

            const client = clients.find(function (item) {
                return item.id === clientId;
            });

            if (!client) {
                alert("Клиент не найден");
                return;
            }

            openClientModal(client);
        });
    });

    statusSelects.forEach(function (select) {
        select.addEventListener("change", async function () {
            const clientId = Number(select.dataset.clientId);
            const newStatus = select.value;

            select.disabled = true;

            try {
                await updateClientStatus(clientId, newStatus);
            } catch (error) {
                alert(error.message);
                await loadClientsFromApi();
            }
        });
    });

    responsibleSelects.forEach(function (select) {
        select.addEventListener("change", async function () {
            const clientId = Number(select.dataset.clientId);
            const responsibleId = parseResponsibleId(select.value);

            select.disabled = true;

            try {
                await updateClientResponsible(clientId, responsibleId);
            } catch (error) {
                alert(error.message);
                await loadClientsFromApi();
            }
        });
    });

    deleteButtons.forEach(function (button) {
        button.addEventListener("click", async function () {
            const clientId = Number(button.dataset.clientId);

            try {
                await deleteClient(clientId);
            } catch (error) {
                alert(error.message);
            }
        });
    });
}


// -------------------- DEALS --------------------

const DEAL_STAGES = [
    "new",
    "negotiation",
    "proposal",
    "payment",
    "won",
    "lost",
];

function normalizeDealFromApi(deal) {
    return {
        id: deal.id,
        workspaceId: deal.workspace_id,
        clientId: deal.client_id,
        title: deal.title,
        amount: Number(deal.amount || 0),
        stage: deal.stage || "new",
        responsibleId: deal.responsible_id,
        note: deal.note,
        createdById: deal.created_by_id,
        createdAt: deal.created_at,
        updatedAt: deal.updated_at,
    };
}

function getDealStageLabel(stage) {
    if (stage === "new") {
        return "Новая заявка";
    }

    if (stage === "negotiation") {
        return "Переговоры";
    }

    if (stage === "proposal") {
        return "Предложение";
    }

    if (stage === "payment") {
        return "Оплата";
    }

    if (stage === "won") {
        return "Успешно";
    }

    if (stage === "lost") {
        return "Проиграно";
    }

    return stage || "Новая заявка";
}

function getClientById(clientId) {
    if (clientId === null || clientId === undefined) {
        return null;
    }

    return clients.find(function (client) {
        return client.id === Number(clientId);
    }) || null;
}

function getDealClientLabel(clientId) {
    const client = getClientById(clientId);

    if (!client) {
        return "Без клиента";
    }

    return client.company
        ? `${client.fullName} · ${client.company}`
        : client.fullName;
}

function buildDealClientOptions(selectedClientId = null) {
    const selectedValue = selectedClientId === null || selectedClientId === undefined
        ? ""
        : String(selectedClientId);

    let options = `<option value="" ${selectedValue === "" ? "selected" : ""}>Без клиента</option>`;

    options += clients
        .map(function (client) {
            const value = String(client.id);
            const selected = value === selectedValue ? "selected" : "";
            const label = client.company
                ? `${client.fullName} · ${client.company}`
                : client.fullName;

            return `<option value="${value}" ${selected}>${escapeHtml(label)}</option>`;
        })
        .join("");

    return options;
}

function parseOptionalPositiveId(value) {
    if (value === "" || value === null || value === undefined) {
        return null;
    }

    const parsedValue = Number(value);

    return Number.isInteger(parsedValue) && parsedValue > 0
        ? parsedValue
        : null;
}

function formatMoney(value) {
    const amount = Number(value || 0);

    return RUB_FORMATTER.format(
        Number.isFinite(amount)
            ? amount
            : 0
    );
}

async function loadDealsFromApi(shouldRender = true) {
    if (!currentWorkspace) {
        deals = [];

        if (shouldRender) {
            renderDeals();
        }

        return;
    }

    const data = await requestJson(
        `${API_URL}/deals?workspace_id=${currentWorkspace.id}&limit=100&sort_by=created_at&sort_order=desc`,
        {
            method: "GET",
            headers: getAuthHeaders(),
        }
    );

    deals = normalizeList(data).map(function (deal) {
        return normalizeDealFromApi(deal);
    });

    if (shouldRender) {
        renderDeals();
    }
}

function openDealModal(deal = null, initialStage = "new") {
    if (!dealModal || !dealForm) {
        return;
    }

    dealForm.reset();
    dealClientInput.innerHTML = buildDealClientOptions(
        deal ? deal.clientId : null
    );
    dealResponsibleInput.innerHTML = buildResponsibleOptions(
        deal ? deal.responsibleId : null,
        "form"
    );

    if (deal) {
        editingDealId = deal.id;

        dealModalTitle.innerText = "Изменить сделку";
        dealModalSubtitle.innerText = "Обновите данные сделки и сохраните изменения";
        dealSubmitButton.innerText = "Сохранить изменения";

        dealTitleInput.value = deal.title || "";
        dealClientInput.value = deal.clientId === null
            ? ""
            : String(deal.clientId);
        dealAmountInput.value = String(deal.amount || 0);
        dealStageInput.value = deal.stage || "new";
        dealResponsibleInput.value = deal.responsibleId === null
            ? ""
            : String(deal.responsibleId);
        dealNoteInput.value = deal.note || "";
    } else {
        editingDealId = null;

        dealModalTitle.innerText = "Добавить сделку";
        dealModalSubtitle.innerText = "Заполните данные сделки и выберите этап воронки";
        dealSubmitButton.innerText = "Сохранить сделку";

        dealClientInput.value = "";
        dealAmountInput.value = "0";
        dealStageInput.value = DEAL_STAGES.includes(initialStage)
            ? initialStage
            : "new";
        dealResponsibleInput.value = "";
        dealNoteInput.value = "";
    }

    dealModal.classList.remove("hidden");
    dealTitleInput.focus();
}

function closeDealModal() {
    if (!dealModal || !dealForm) {
        return;
    }

    dealModal.classList.add("hidden");
    dealForm.reset();
    editingDealId = null;

    dealModalTitle.innerText = "Добавить сделку";
    dealModalSubtitle.innerText = "Заполните данные сделки и выберите этап воронки";
    dealSubmitButton.innerText = "Сохранить сделку";
}

async function createDealFromForm() {
    if (!currentWorkspace) {
        alert("Рабочее пространство ещё не загружено");
        return;
    }

    const createdDeal = await requestJson(`${API_URL}/deals`, {
        method: "POST",
        headers: getJsonAuthHeaders(),
        body: JSON.stringify({
            workspace_id: currentWorkspace.id,
            client_id: parseOptionalPositiveId(dealClientInput.value),
            title: dealTitleInput.value.trim(),
            amount: dealAmountInput.value || "0",
            stage: dealStageInput.value,
            responsible_id: parseResponsibleId(dealResponsibleInput.value),
            note: dealNoteInput.value.trim() || null,
        }),
    });

    deals.unshift(normalizeDealFromApi(createdDeal));
    renderDeals();
}

async function updateDealFromForm(dealId) {
    const updatedDeal = await requestJson(`${API_URL}/deals/${dealId}`, {
        method: "PATCH",
        headers: getJsonAuthHeaders(),
        body: JSON.stringify({
            client_id: parseOptionalPositiveId(dealClientInput.value),
            title: dealTitleInput.value.trim(),
            amount: dealAmountInput.value || "0",
            stage: dealStageInput.value,
            responsible_id: parseResponsibleId(dealResponsibleInput.value),
            note: dealNoteInput.value.trim() || null,
        }),
    });

    const normalizedDeal = normalizeDealFromApi(updatedDeal);

    deals = deals.map(function (deal) {
        return deal.id === dealId
            ? normalizedDeal
            : deal;
    });

    renderDeals();
}

async function updateDealStage(dealId, stage) {
    const updatedDeal = await requestJson(
        `${API_URL}/deals/${dealId}/stage`,
        {
            method: "PATCH",
            headers: getJsonAuthHeaders(),
            body: JSON.stringify({
                stage: stage,
            }),
        }
    );

    const normalizedDeal = normalizeDealFromApi(updatedDeal);

    deals = deals.map(function (deal) {
        return deal.id === dealId
            ? normalizedDeal
            : deal;
    });

    renderDeals();
}

async function updateDealResponsible(dealId, responsibleId) {
    const updatedDeal = await requestJson(
        `${API_URL}/deals/${dealId}/responsible`,
        {
            method: "PATCH",
            headers: getJsonAuthHeaders(),
            body: JSON.stringify({
                responsible_id: responsibleId,
            }),
        }
    );

    const normalizedDeal = normalizeDealFromApi(updatedDeal);

    deals = deals.map(function (deal) {
        return deal.id === dealId
            ? normalizedDeal
            : deal;
    });

    renderDeals();
}

async function deleteDeal(dealId) {
    const confirmed = confirm("Удалить сделку? Это действие нельзя отменить.");

    if (!confirmed) {
        return;
    }

    await requestJson(`${API_URL}/deals/${dealId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
    });

    deals = deals.filter(function (deal) {
        return deal.id !== dealId;
    });

    renderDeals();
}

function updateDealStats() {
    const total = deals.length;

    const pipelineAmount = deals
        .filter(function (deal) {
            return !["won", "lost"].includes(deal.stage);
        })
        .reduce(function (sum, deal) {
            return sum + Number(deal.amount || 0);
        }, 0);

    const wonAmount = deals
        .filter(function (deal) {
            return deal.stage === "won";
        })
        .reduce(function (sum, deal) {
            return sum + Number(deal.amount || 0);
        }, 0);

    const lost = deals.filter(function (deal) {
        return deal.stage === "lost";
    }).length;

    if (dealTotalCount) {
        dealTotalCount.innerText = total;
    }

    if (dealPipelineAmount) {
        dealPipelineAmount.innerText = formatMoney(pipelineAmount);
    }

    if (dealWonAmount) {
        dealWonAmount.innerText = formatMoney(wonAmount);
    }

    if (dealLostCount) {
        dealLostCount.innerText = lost;
    }
}

function renderDeals() {
    updateDealStats();

    if (!dealsBoard) {
        return;
    }

    const searchValue = dealSearchInput
        ? dealSearchInput.value.toLowerCase().trim()
        : "";

    const responsibleValue = dealResponsibleFilter
        ? dealResponsibleFilter.value
        : "all";

    const filteredDeals = deals.filter(function (deal) {
        const dealText = [
            deal.title,
            deal.note,
            getDealClientLabel(deal.clientId),
            getResponsibleLabel(deal.responsibleId),
            getDealStageLabel(deal.stage),
        ].join(" ").toLowerCase();

        const matchesSearch = dealText.includes(searchValue);

        let matchesResponsible = true;

        if (responsibleValue === "unassigned") {
            matchesResponsible = deal.responsibleId === null;
        } else if (responsibleValue !== "all") {
            matchesResponsible = deal.responsibleId === Number(responsibleValue);
        }

        return matchesSearch && matchesResponsible;
    });

    const dealsByStage = {};

    DEAL_STAGES.forEach(function (stage) {
        dealsByStage[stage] = [];
    });

    filteredDeals.forEach(function (deal) {
        if (dealsByStage[deal.stage]) {
            dealsByStage[deal.stage].push(deal);
        }
    });

    DEAL_STAGES.forEach(function (stage) {
        const list = document.querySelector(`[data-deal-list="${stage}"]`);
        const counter = document.querySelector(`[data-deal-counter="${stage}"]`);

        if (!list) {
            return;
        }

        const stageDeals = dealsByStage[stage];

        if (counter) {
            counter.innerText = stageDeals.length;
        }

        if (stageDeals.length === 0) {
            list.innerHTML = `
                <div class="deal-column-empty">
                    Нет сделок
                </div>
            `;
            return;
        }

        list.innerHTML = stageDeals
            .map(function (deal) {
                const clientLabel = getDealClientLabel(deal.clientId);
                const responsibleLabel = getResponsibleLabel(deal.responsibleId);

                return `
                    <article class="deal-card md-animate-in" data-deal-id="${deal.id}">
                        <div class="deal-card-top">
                            <span class="deal-card-id">#${deal.id}</span>
                            <strong>${escapeHtml(formatMoney(deal.amount))}</strong>
                        </div>

                        <h4>${escapeHtml(deal.title)}</h4>

                        <div class="deal-card-meta">
                            <span>Клиент</span>
                            <strong>${escapeHtml(clientLabel)}</strong>
                        </div>

                        <label class="deal-card-control">
                            <span>Этап</span>
                            <select
                                class="deal-stage-select deal-stage-select--${deal.stage}"
                                data-deal-id="${deal.id}"
                            >
                                <option value="new" ${deal.stage === "new" ? "selected" : ""}>Новая заявка</option>
                                <option value="negotiation" ${deal.stage === "negotiation" ? "selected" : ""}>Переговоры</option>
                                <option value="proposal" ${deal.stage === "proposal" ? "selected" : ""}>Предложение</option>
                                <option value="payment" ${deal.stage === "payment" ? "selected" : ""}>Оплата</option>
                                <option value="won" ${deal.stage === "won" ? "selected" : ""}>Успешно</option>
                                <option value="lost" ${deal.stage === "lost" ? "selected" : ""}>Проиграно</option>
                            </select>
                        </label>

                        <label class="deal-card-control">
                            <span>Ответственный</span>
                            <select
                                class="deal-responsible-select"
                                data-deal-id="${deal.id}"
                                title="${escapeHtml(responsibleLabel)}"
                            >
                                ${buildResponsibleOptions(deal.responsibleId, "form")}
                            </select>
                        </label>

                        <p>${escapeHtml(deal.note || "Заметка не добавлена")}</p>

                        <div class="deal-card-actions">
                            <button
                                class="ghost-button deal-edit-button"
                                type="button"
                                data-deal-id="${deal.id}"
                            >
                                Изменить
                            </button>

                            <button
                                class="ghost-button deal-delete-button"
                                type="button"
                                data-deal-id="${deal.id}"
                            >
                                Удалить
                            </button>
                        </div>
                    </article>
                `;
            })
            .join("");
    });

    bindDealActionButtons();
}

function bindDealActionButtons() {
    const editButtons = document.querySelectorAll(".deal-edit-button");
    const deleteButtons = document.querySelectorAll(".deal-delete-button");
    const stageSelects = document.querySelectorAll(".deal-stage-select");
    const responsibleSelects = document.querySelectorAll(".deal-responsible-select");

    editButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            const dealId = Number(button.dataset.dealId);

            const deal = deals.find(function (item) {
                return item.id === dealId;
            });

            if (!deal) {
                alert("Сделка не найдена");
                return;
            }

            openDealModal(deal);
        });
    });

    deleteButtons.forEach(function (button) {
        button.addEventListener("click", async function () {
            const dealId = Number(button.dataset.dealId);

            try {
                await deleteDeal(dealId);
            } catch (error) {
                alert(error.message);
            }
        });
    });

    stageSelects.forEach(function (select) {
        select.addEventListener("change", async function () {
            const dealId = Number(select.dataset.dealId);
            const stage = select.value;

            select.disabled = true;

            try {
                await updateDealStage(dealId, stage);
            } catch (error) {
                alert(error.message);
                await loadDealsFromApi();
            }
        });
    });

    responsibleSelects.forEach(function (select) {
        select.addEventListener("change", async function () {
            const dealId = Number(select.dataset.dealId);
            const responsibleId = parseResponsibleId(select.value);

            select.disabled = true;

            try {
                await updateDealResponsible(dealId, responsibleId);
            } catch (error) {
                alert(error.message);
                await loadDealsFromApi();
            }
        });
    });
}


// -------------------- TEAM --------------------

function getWorkspaceRoleLabel(role) {
    if (role === "owner") {
        return "Владелец";
    }

    if (role === "admin") {
        return "Администратор";
    }

    if (role === "member") {
        return "Участник";
    }

    if (role === "viewer") {
        return "Наблюдатель";
    }

    return role || "Без роли";
}

function getWorkspaceRoleClass(role) {
    const allowedRoles = ["owner", "admin", "member", "viewer"];

    return allowedRoles.includes(role)
        ? role
        : "member";
}

function getAssignedClientsCount(userId) {
    return clients.filter(function (client) {
        return client.responsibleId === Number(userId);
    }).length;
}

function getTeamMemberAvatarLetter(member) {
    return getClientAvatarLetter(getWorkspaceMemberLabel(member));
}

function updateTeamStats() {
    const total = workspaceMembers.length;

    const managers = workspaceMembers.filter(function (member) {
        return member.role === "owner" || member.role === "admin";
    }).length;

    const members = workspaceMembers.filter(function (member) {
        return member.role === "member" || member.role === "viewer";
    }).length;

    const assignedClients = clients.filter(function (client) {
        return client.responsibleId !== null;
    }).length;

    if (teamTotalCount) {
        teamTotalCount.innerText = total;
    }

    if (teamManagerCount) {
        teamManagerCount.innerText = managers;
    }

    if (teamMemberCount) {
        teamMemberCount.innerText = members;
    }

    if (teamAssignedCount) {
        teamAssignedCount.innerText = assignedClients;
    }
}

function renderTeam() {
    updateTeamStats();

    if (!teamList) {
        return;
    }

    const searchValue = teamSearchInput
        ? teamSearchInput.value.toLowerCase().trim()
        : "";

    const roleValue = teamRoleFilter
        ? teamRoleFilter.value
        : "all";

    const filteredMembers = workspaceMembers.filter(function (member) {
        const memberText = [
            member.fullName,
            member.email,
            getWorkspaceRoleLabel(member.role),
        ].join(" ").toLowerCase();

        const matchesSearch = memberText.includes(searchValue);
        const matchesRole = roleValue === "all" || member.role === roleValue;

        return matchesSearch && matchesRole;
    });

    if (filteredMembers.length === 0) {
        teamList.innerHTML = `
            <div class="empty-state md-animate-in">
                <h3>Сотрудники не найдены</h3>
                <p>Измените поиск или фильтр по роли.</p>
            </div>
        `;
        return;
    }

    teamList.innerHTML = filteredMembers
        .map(function (member) {
            const memberName = getWorkspaceMemberLabel(member);
            const roleLabel = getWorkspaceRoleLabel(member.role);
            const roleClass = getWorkspaceRoleClass(member.role);
            const assignedClients = getAssignedClientsCount(member.userId);

            return `
                <article class="team-member-card md-animate-in">
                    <div class="team-member-main">
                        <div class="team-member-avatar">
                            ${escapeHtml(getTeamMemberAvatarLetter(member))}
                        </div>

                        <div class="team-member-identity">
                            <h3>${escapeHtml(memberName)}</h3>
                            <p>${escapeHtml(member.email || "Email не указан")}</p>
                        </div>
                    </div>

                    <div class="team-role-badge team-role--${roleClass}">
                        ${escapeHtml(roleLabel)}
                    </div>

                    <div class="team-member-metrics">
                        <div>
                            <span>Назначено клиентов</span>
                            <strong>${assignedClients}</strong>
                        </div>

                        <div>
                            <span>Добавлен</span>
                            <strong>${escapeHtml(formatDate(member.createdAt))}</strong>
                        </div>
                    </div>
                </article>
            `;
        })
        .join("");
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

const debouncedTaskSearch = debounce(filterTasks);
const debouncedClientSearch = debounce(renderClients);
const debouncedTeamSearch = debounce(renderTeam);
const debouncedDealSearch = debounce(renderDeals);

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
    clients = [];
    workspaceMembers = [];
    deals = [];
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
    debouncedTaskSearch();
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
            if (editingClientId === null) {
                await createClientFromForm();
            } else {
                await updateClientFromForm(editingClientId);
            }

            closeClientModal();
        } catch (error) {
            alert(error.message);
        }
    });
}

if (clientSearchInput) {
    clientSearchInput.addEventListener("input", function () {
        debouncedClientSearch();
    });
}

if (clientStatusFilter) {
    clientStatusFilter.addEventListener("change", function () {
        renderClients();
    });
}

if (clientResponsibleFilter) {
    clientResponsibleFilter.addEventListener("change", function () {
        renderClients();
    });
}

if (teamSearchInput) {
    teamSearchInput.addEventListener("input", function () {
        debouncedTeamSearch();
    });
}

if (teamRoleFilter) {
    teamRoleFilter.addEventListener("change", function () {
        renderTeam();
    });
}

if (openDealModalButton) {
    openDealModalButton.addEventListener("click", function () {
        openDealModal();
    });
}

document.querySelectorAll(".deal-add-button").forEach(function (button) {
    button.addEventListener("click", function () {
        openDealModal(null, button.dataset.dealStage || "new");
    });
});

if (closeDealModalButton) {
    closeDealModalButton.addEventListener("click", function () {
        closeDealModal();
    });
}

if (cancelDealButton) {
    cancelDealButton.addEventListener("click", function () {
        closeDealModal();
    });
}

if (dealModal) {
    dealModal.addEventListener("click", function (event) {
        if (event.target === dealModal) {
            closeDealModal();
        }
    });
}

if (dealForm) {
    dealForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        try {
            if (editingDealId === null) {
                await createDealFromForm();
            } else {
                await updateDealFromForm(editingDealId);
            }

            closeDealModal();
        } catch (error) {
            alert(error.message);
        }
    });
}

if (dealSearchInput) {
    dealSearchInput.addEventListener("input", function () {
        debouncedDealSearch();
    });
}

if (dealResponsibleFilter) {
    dealResponsibleFilter.addEventListener("change", function () {
        renderDeals();
    });
}


// -------------------- START --------------------

applyTheme(getSavedTheme());
setAuthMode("login");
updateColumnCounters();
updateStats();
updateClientStats();
updateDealStats();
renderTeam();
renderDeals();
checkAuthOnStart();