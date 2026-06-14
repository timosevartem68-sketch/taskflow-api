const createTaskButton = document.querySelector("#create-task-button");
const searchInput = document.querySelector(".search-input");
const filterButtons = document.querySelectorAll(".filter-button");
const firstColumn = document.querySelector(".column");

let activePriority = "all";

function getTaskCards() {
    return document.querySelectorAll(".task-card");
}

function createTaskCard() {
    const taskCard = document.createElement("article");

    taskCard.className = "task-card yellow";
    taskCard.dataset.priority = "medium";

    taskCard.innerHTML = `
        <div class="task-category">Новая задача</div>
        <h3>Новая задача TaskFlow</h3>
        <p>Эта карточка добавлена через JavaScript без перезагрузки страницы.</p>

        <div class="task-progress">
            <span>Чек-лист</span>
            <span>0 из 3</span>
        </div>

        <div class="progress-line">
            <div style="width: 10%;"></div>
        </div>

        <div class="task-meta">
            <span>2026-06-22</span>
            <span>0 / 8 ч.</span>
        </div>
    `;

    const addButton = firstColumn.querySelector(".add-column-button");

    firstColumn.insertBefore(taskCard, addButton);

    updateColumnCounters();
    filterTasks();
}

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
    const columns = document.querySelectorAll(".column");

    columns.forEach(function (column) {
        const tasks = column.querySelectorAll(".task-card");
        const counter = column.querySelector(".column-header span");

        counter.innerText = tasks.length;
    });
}

createTaskButton.addEventListener("click", function () {
    createTaskCard();
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

updateColumnCounters();