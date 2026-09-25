/* =========================================
   Reno Site Manager - Data Layer + Tasks
   ========================================= */

const STORAGE_KEY = "renoSiteManager_v1";

// ---------- Default data ----------
const defaultData = {
  currentProjectId: "p1",
  projects: [
    {
      id: "p1",
      name: "Hillside Residence",
      phase: "Phase 2 · Interior renovation",
      status: "On track",
      progress: 68,
      team: 6,
      due: "2025-10-24",
      owner: "JM"
    },
    {
      id: "p2",
      name: "The Maple House",
      phase: "Phase 1 · Structural",
      status: "On track",
      progress: 42,
      team: 4,
      due: "2025-11-15",
      owner: "AL"
    },
    {
      id: "p3",
      name: "88 Jalan Aman",
      phase: "Finishes",
      status: "On track",
      progress: 85,
      team: 5,
      due: "2025-09-30",
      owner: "SK"
    }
  ],
  tasks: [
    {
      id: "t1",
      projectId: "p1",
      title: "Install kitchen cabinetry",
      location: "Carpentry · Level 1 Kitchen",
      contractor: "Mason Co.",
      due: "2025-09-07",
      priority: "High",
      status: "todo",          // todo | inprogress | review | approved
      photos: 4,
      approval: "Awaiting approval"
    },
    {
      id: "t2",
      projectId: "p1",
      title: "Electrical rough-in",
      location: "Electrical · Level 2 Bedrooms",
      contractor: "Bright Wire",
      due: "2025-09-06",
      priority: "High",
      status: "inprogress",
      photos: 2,
      approval: "Awaiting approval"
    },
    {
      id: "t3",
      projectId: "p1",
      title: "Waterproof shower recess",
      location: "Waterproofing · Master ensuite",
      contractor: "SealPro",
      due: "2025-09-05",
      priority: "Normal",
      status: "review",
      photos: 3,
      approval: "Awaiting approval"
    },
    {
      id: "t4",
      projectId: "p1",
      title: "Demolish old pantry wall",
      location: "Demolition · Level 1",
      contractor: "BuildRight",
      due: "2025-09-04",
      priority: "Normal",
      status: "approved",
      photos: 5,
      approval: "Approved"
    }
  ],
  proofs: [],
  measurements: []
};

// ---------- Data helpers ----------
function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
    return structuredClone(defaultData);
  }
  return JSON.parse(raw);
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

let data = loadData();

// ---------- Simple ID generator ----------
function generateId(prefix) {
  return prefix + Date.now() + Math.floor(Math.random() * 1000);
}

// ---------- Convert file to base64 (for localStorage) ----------
function fileToBase64(file) {
  return new Promise((resolve) => {
    if (!file) return resolve(null);
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

// ---------- Toast ----------
const toast = document.getElementById("toast");
function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2200);
}

// ---------- Modal helpers ----------
function openModal(id) {
  document.getElementById(id).classList.add("open");
}
function closeModal(element) {
  element.classList.remove("open");
}

// ---------- Tab switching ----------
document.querySelectorAll(".tab").forEach((tab) => {
  tab.onclick = () => {
    document.querySelectorAll(".tab").forEach((item) =>
      item.classList.toggle("active", item === tab)
    );
    document.querySelectorAll(".page").forEach((page) =>
      page.classList.toggle("active", page.id === tab.dataset.page)
    );
  };
});

// ---------- Sidebar (Projects) ----------
const sidebar = document.createElement("aside");
sidebar.className = "project-sidebar";
document.body.prepend(sidebar);

const expandButton = document.createElement("button");
expandButton.className = "sidebar-toggle";
expandButton.textContent = "Menu";
document.body.prepend(expandButton);

function setSidebarCollapsed(value) {
  sidebar.classList.toggle("collapsed", value);
  document.body.classList.toggle("sidebar-is-collapsed", value);
}
if (innerWidth < 900) setSidebarCollapsed(true);
expandButton.onclick = () => setSidebarCollapsed(false);

function renderSidebar() {
  const current = data.projects.find((p) => p.id === data.currentProjectId);

  sidebar.innerHTML = `
    <div class="side-brand">
      <b>R</b><span>reno.</span>
      <button class="sidebar-close">Close</button>
    </div>
    <p>YOUR PROJECTS</p>
    ${data.projects
      .map(
        (p) => `
      <button class="project-item ${p.id === data.currentProjectId ? "active" : ""}" data-id="${p.id}">
        ${p.name}
        <small>${p.progress}% complete</small>
      </button>`
      )
      .join("")}
    <button class="new-project">+ New project</button>
  `;

  sidebar.querySelector(".sidebar-close").onclick = () => setSidebarCollapsed(true);

  sidebar.querySelectorAll(".project-item").forEach((btn) => {
    btn.onclick = () => {
  data.currentProjectId = btn.dataset.id;
  saveData(data);
  renderSidebar();
  renderProjectHeader();
  renderTasks();
  renderProofs();
  renderMeasurements();
  showToast("Switched to " + btn.childNodes[0].textContent.trim());
    };
  });

  sidebar.querySelector(".new-project").onclick = () => openModal("projectModal");
}

function renderProjectHeader() {
  const p = data.projects.find((p) => p.id === data.currentProjectId);
  if (!p) return;

  document.querySelector(".current-project").textContent = p.name;
  document.querySelector("#projects h1").textContent = p.name;

  const hero = document.querySelector("#projects .hero");
  hero.innerHTML = `
    <span>${p.phase}</span>
    <b>${p.status}</b>
    <h2>${p.progress}% complete</h2>
    <div class="bar"><i style="width: ${p.progress}%"></i></div>
    <p>${p.team} site team members · Due ${p.due}</p>
  `;
}

// ---------- Project modal ----------
const projectModal = document.createElement("div");
projectModal.id = "projectModal";
projectModal.className = "backdrop";
projectModal.innerHTML = `
  <form class="modal" id="projectForm">
    <button type="button" class="close form-close">×</button>
    <p class="eyebrow">PROJECT SETUP</p>
    <h2>Create a new project</h2>
    <label>Project name<input id="projectName" required></label>
    <label>Client / owner name<input id="projectOwner" required></label>
    <label>Address / Phase<input id="projectPhase" required placeholder="e.g. Phase 1 · Structural"></label>
    <div class="project-dates">
      <label>Start date<input id="projectStart" type="date" required></label>
      <label>Due date<input id="projectDue" type="date" required></label>
    </div>
    <div class="modal-actions">
      <button type="button" class="cancel-project">Cancel</button>
      <button class="save">Save project</button>
    </div>
  </form>
`;
document.body.append(projectModal);

function closeProjectForm() {
  closeModal(projectModal);
  projectForm.reset();
}
projectModal.querySelector(".form-close").onclick = closeProjectForm;
projectModal.querySelector(".cancel-project").onclick = closeProjectForm;
projectModal.onclick = (e) => {
  if (e.target === projectModal) closeProjectForm();
};

projectForm.onsubmit = (e) => {
  e.preventDefault();
  const newProject = {
    id: "p" + Date.now(),
    name: projectName.value,
    phase: projectPhase.value,
    status: "New project",
    progress: 0,
    team: 0,
    due: projectDue.value,
    owner: projectOwner.value
  };
  data.projects.push(newProject);
  data.currentProjectId = newProject.id;
  saveData(data);
  closeProjectForm();
  renderSidebar();
  renderProjectHeader();
  renderTasks();
  showToast("Project created");
};

// ---------- Tasks ----------
const taskPage = document.getElementById("tasks");

const statusMap = {
  todo: "To do",
  inprogress: "In progress",
  review: "Review",
  approved: "Approved"
};

function renderTasks() {
  const projectTasks = data.tasks.filter(
    (t) => t.projectId === data.currentProjectId
  );

  const columns = ["todo", "inprogress", "review", "approved"];

  taskPage.innerHTML = `
    <div class="heading">
      <div>
        <p class="eyebrow">WORKFLOW BOARD</p>
        <h1>Tasks</h1>
      </div>
      <button class="primary" id="addTaskBtn">+ Add task</button>
    </div>
    <div class="board">
      ${columns
        .map((status) => {
          const cards = projectTasks.filter((t) => t.status === status);
          return `
          <section class="board-column ${status === "approved" ? "approved-column" : ""}" data-status="${status}">
            <header>
              <h2>${statusMap[status]} <span>${cards.length}</span></h2>
            </header>
            <div class="drop-zone">
              ${cards.map((t) => taskCardHTML(t)).join("")}
            </div>
          </section>`;
        })
        .join("")}
    </div>
  `;

  // Drag and drop
  let draggedId = null;

  taskPage.querySelectorAll(".task-card").forEach((card) => {
    card.ondragstart = () => {
      draggedId = card.dataset.id;
    };
  });

  taskPage.querySelectorAll(".drop-zone").forEach((zone) => {
    zone.ondragover = (e) => e.preventDefault();
    zone.ondrop = (e) => {
      e.preventDefault();
      const newStatus = zone.closest(".board-column").dataset.status;
      const task = data.tasks.find((t) => t.id === draggedId);
      if (task) {
        task.status = newStatus;
        if (newStatus === "approved") {
          task.approval = "Approved";
        }
        saveData(data);
        renderTasks();
        showToast("Task moved");
      }
    };
  });

  // Add task button
document.getElementById("addTaskBtn").onclick = () => {
  openTaskModal();   // no argument = Add mode
};

  // Edit / Delete buttons
  taskPage.querySelectorAll(".edit-task").forEach((btn) => {
    btn.onclick = (e) => {
      e.stopPropagation();
      openTaskModal(btn.dataset.id);
    };
  });

  taskPage.querySelectorAll(".delete-task").forEach((btn) => {
    btn.onclick = (e) => {
      e.stopPropagation();
      if (confirm("Delete this task?")) {
        data.tasks = data.tasks.filter((t) => t.id !== btn.dataset.id);
        saveData(data);
        renderTasks();
        showToast("Task deleted");
      }
    };
  });
}

function taskCardHTML(task) {
  const isApproved = task.status === "approved";
  return `
    <article class="task-card" draggable="true" data-id="${task.id}">
      <span class="priority ${task.priority.toLowerCase()}">${task.priority}</span>
      <h3>${task.title}</h3>
      <p>${task.location}</p>
      <div>Contractor: ${task.contractor}<b>${task.due}</b></div>
      <footer>
        Photos: ${task.photos || 0}
        <em>${task.approval}</em>
      </footer>
      ${isApproved ? '<div class="payment">Eligible for payment</div>' : ""}
      <div style="margin-top:8px; display:flex; gap:6px;">
        <button class="edit-task" data-id="${task.id}" style="font-size:10px; padding:4px 8px;">Edit</button>
        <button class="delete-task" data-id="${task.id}" style="font-size:10px; padding:4px 8px; color:#c25b35;">Delete</button>
      </div>
    </article>
  `;
}

/* =========================================
   WORK PROOF
   ========================================= */

function renderProofs() {
  const page = document.getElementById("proof");
  const projectProofs = data.proofs.filter(
    (p) => p.projectId === data.currentProjectId
  );

  page.innerHTML = `
    <div class="heading">
      <div>
        <p class="eyebrow">SITE DOCUMENTATION</p>
        <h1>Work proof</h1>
      </div>
      <button class="primary" id="addProofBtn">+ Add proof</button>
    </div>

    ${
      projectProofs.length === 0
        ? `<p style="color:var(--muted); margin-top:20px;">No work proofs yet. Click “+ Add proof” to start.</p>`
        : projectProofs
            .map(
              (p) => `
      <article class="proof-card">
        <span class="chip ${p.status === "Approved" ? "confirmed" : "pending"}">
          ${p.status}
        </span>
        <h3>${p.title}</h3>
        <p>${p.date} · ${p.location}</p>
        <div class="photos">
          <div style="background-image:url('${p.before || ""}'); background-size:cover; background-position:center;">
            ${p.before ? "" : "BEFORE"}
          </div>
          <div style="background-image:url('${p.after || ""}'); background-size:cover; background-position:center;">
            ${p.after ? "" : "AFTER"}
          </div>
        </div>
        <p>${p.notes || ""}</p>
        <div style="display:flex; gap:8px; margin-top:10px;">
          <button class="approval request-approval" data-id="${p.id}">
            ${p.status === "Approved" ? "Approved" : "Request owner approval"}
          </button>
          <button class="delete-proof" data-id="${p.id}" style="font-size:11px; color:#c25b35;">Delete</button>
        </div>
      </article>`
            )
            .join("")
    }
  `;

  // Add button
  document.getElementById("addProofBtn").onclick = () => {
    document.getElementById("proofForm").reset();
    openModal("proofModal");
  };

  // Request approval
  page.querySelectorAll(".request-approval").forEach((btn) => {
    btn.onclick = () => {
      const proof = data.proofs.find((p) => p.id === btn.dataset.id);
      if (proof && proof.status !== "Approved") {
        proof.status = "Approved";
        saveData(data);
        renderProofs();
        showToast("Marked as approved");
      }
    };
  });

  // Delete
  page.querySelectorAll(".delete-proof").forEach((btn) => {
    btn.onclick = () => {
      if (confirm("Delete this work proof?")) {
        data.proofs = data.proofs.filter((p) => p.id !== btn.dataset.id);
        saveData(data);
        renderProofs();
        showToast("Work proof deleted");
      }
    };
  });
}

// Handle measurement form submit
document.getElementById("measurementForm").onsubmit = async (e) => {
  e.preventDefault();

  const form = e.target;
  const nameInput = form.querySelector('input[placeholder*="Guest"]');
  const length = Number(document.getElementById("length").value) || 0;
  const width = Number(document.getElementById("width").value) || 0;

  // Height is the 3rd number input
  const numberInputs = form.querySelectorAll('input[type="number"]');
  const height = Number(numberInputs[2]?.value) || 0;

  // Site photo
  const photoInput = form.querySelector('input[type="file"]');
  const photoBase64 = await fileToBase64(photoInput?.files[0]);

  const newMeasurement = {
    id: generateId("m"),
    projectId: data.currentProjectId,
    name: nameInput.value,
    length: length,
    width: width,
    height: height,
    photo: photoBase64,          // ← save the photo
    status: "Pending",
    location: ""
  };

  data.measurements.push(newMeasurement);
  saveData(data);
  closeModal(document.getElementById("measurementModal"));
  renderMeasurements();
  showToast("Measurement saved");
};

/* =========================================
   MEASUREMENTS (Improved)
   ========================================= */

// Convert any unit to metres
function toMetres(value, unit) {
  const v = Number(value) || 0;
  if (unit === "cm") return v / 100;
  if (unit === "inch") return v * 0.0254;
  if (unit === "ft") return v * 0.3048;
  return v; // already metres
}

// Format metres nicely for display
function formatDim(metres) {
  if (!metres || metres === 0) return null;
  return metres.toFixed(2) + "m";
}

function renderMeasurements() {
  const page = document.getElementById("measurements");
  const list = data.measurements.filter(m => m.projectId === data.currentProjectId);
  const pendingCount = list.filter(m => m.status === "Pending").length;

  page.innerHTML = `
    <div class="heading">
      <div>
        <p class="eyebrow">SITE DIMENSIONS</p>
        <h1>Measurements</h1>
      </div>
      <button class="primary" id="addMeasurementBtn">+ Add measure</button>
    </div>

    <div class="summary">
      <b>${list.length}</b> recorded measurements
      <span>${pendingCount} pending confirmation</span>
    </div>

    <div id="measurementList">
      ${list.length === 0
        ? `<p style="color:var(--muted);">No measurements yet.</p>`
        : list.map(m => {
            const parts = [];
            if (m.length) parts.push(`L ${formatDim(m.length)}`);
            if (m.width)  parts.push(`W ${formatDim(m.width)}`);
            if (m.height) parts.push(`H ${formatDim(m.height)}`);
            const dimText = parts.join("  ·  ") || "No dimensions";

            return `
            <article class="measure-card" style="display:grid; grid-template-columns: 90px 1fr; gap:12px; align-items:start; margin-bottom:12px;">
              <div style="width:90px; height:70px; border-radius:8px; background:#e8eeec; overflow:hidden; display:flex; align-items:center; justify-content:center;">
                ${m.photo
                  ? `<img src="${m.photo}" style="width:100%; height:100%; object-fit:cover;">`
                  : `<span style="font-size:10px; color:#9aa8a5;">No photo</span>`}
              </div>

              <div>
                <span class="chip ${m.status === "Confirmed" ? "confirmed" : "pending"}">${m.status}</span>
                <h3 style="margin:4px 0 2px;">${m.name}</h3>
                <p style="margin:0; font-size:13px; font-weight:bold; color:var(--ink);">${dimText}</p>

                <div style="margin-top:8px; display:flex; gap:8px;">
                  ${m.status === "Pending"
                    ? `<button class="confirm-measure" data-id="${m.id}" style="font-size:11px;">Confirm</button>`
                    : ""}
                  <button class="delete-measure" data-id="${m.id}" style="font-size:11px; color:#c25b35;">Delete</button>
                </div>
              </div>
            </article>`;
          }).join("")
      }
    </div>
  `;

  // Add button
  document.getElementById("addMeasurementBtn").onclick = () => {
    document.getElementById("measurementForm").reset();
    openModal("measurementModal");
  };

  // Confirm
  page.querySelectorAll(".confirm-measure").forEach(btn => {
    btn.onclick = () => {
      const m = data.measurements.find(item => item.id === btn.dataset.id);
      if (m) {
        m.status = "Confirmed";
        saveData(data);
        renderMeasurements();
        showToast("Measurement confirmed");
      }
    };
  });

  // Delete
  page.querySelectorAll(".delete-measure").forEach(btn => {
    btn.onclick = () => {
      if (confirm("Delete this measurement?")) {
        data.measurements = data.measurements.filter(m => m.id !== btn.dataset.id);
        saveData(data);
        renderMeasurements();
        showToast("Measurement deleted");
      }
    };
  });
}

// Save measurement
document.getElementById("measurementForm").onsubmit = async (e) => {
  e.preventDefault();

  const unit = document.getElementById("measureUnit").value;
  const photoFile = document.getElementById("measurePhoto").files[0];
  const photoBase64 = await fileToBase64(photoFile);

  const newMeasurement = {
    id: generateId("m"),
    projectId: data.currentProjectId,
    name: document.getElementById("measureName").value,
    length: toMetres(document.getElementById("length").value, unit),
    width:  toMetres(document.getElementById("width").value, unit),
    height: toMetres(document.getElementById("height").value, unit),
    photo: photoBase64,
    status: "Pending"
  };

  data.measurements.push(newMeasurement);
  saveData(data);
  closeModal(document.getElementById("measurementModal"));
  renderMeasurements();
  showToast("Measurement saved");
};

// Live area calculation (already existed, keep it)
const lengthInput = document.getElementById("length");
const widthInput = document.getElementById("width");
const areaValue = document.getElementById("areaValue");

function calculateArea() {
  const area = (Number(lengthInput.value) || 0) * (Number(widthInput.value) || 0);
  areaValue.textContent = area.toFixed(2) + " m²";
}
if (lengthInput && widthInput) {
  lengthInput.oninput = calculateArea;
  widthInput.oninput = calculateArea;
}

// Handle measurement form submit
document.getElementById("measurementForm").onsubmit = (e) => {
  e.preventDefault();

  const length = Number(document.getElementById("length").value) || 0;
  const width = Number(document.getElementById("width").value) || 0;
  const height = Number(document.querySelector('#measurementForm input[type="number"]:nth-of-type(3)')?.value) || 0;

  const newMeasurement = {
    id: generateId("m"),
    projectId: data.currentProjectId,
    name: document.querySelector('#measurementForm input[placeholder*="Guest"]').value,
    location: "", // can enhance later
    length,
    width,
    height,
    area: length * width,
    status: "Pending"
  };

  data.measurements.push(newMeasurement);
  saveData(data);
  closeModal(document.getElementById("measurementModal"));
  renderMeasurements();
  showToast("Measurement saved");
};

// ---------- Task Modal ----------
const taskModal = document.createElement("div");
taskModal.id = "taskModal";
taskModal.className = "backdrop";
taskModal.innerHTML = `
  <form class="modal" id="taskForm">
    <button type="button" class="close form-close">×</button>
    <p class="eyebrow">TASK</p>
    <h2 id="taskModalTitle">Add task</h2>
    <input type="hidden" id="taskId">
    <label>Title<input id="taskTitle" required></label>
    <label>Location / Trade<input id="taskLocation" required placeholder="e.g. Carpentry · Level 1 Kitchen"></label>
    <label>Contractor<input id="taskContractor" required></label>
    <label>Due date<input id="taskDue" type="date" required></label>
    <label>Priority
      <select id="taskPriority">
        <option>High</option>
        <option selected>Normal</option>
        <option>Low</option>
      </select>
    </label>
    <label>Status
      <select id="taskStatus">
        <option value="todo">To do</option>
        <option value="inprogress">In progress</option>
        <option value="review">Review</option>
        <option value="approved">Approved</option>
      </select>
    </label>
    <div class="modal-actions">
      <button type="button" class="cancel-task">Cancel</button>
      <button class="save">Save task</button>
    </div>
  </form>
`;
document.body.append(taskModal);

function openTaskModal(editId = null) {
  const form = document.getElementById("taskForm");
  form.reset();

  const idInput = document.getElementById("taskId");
  const titleEl = document.getElementById("taskModalTitle");

  if (editId) {
    const task = data.tasks.find((t) => t.id === editId);
    if (!task) return;

    titleEl.textContent = "Edit task";
    idInput.value = task.id;
    document.getElementById("taskTitle").value = task.title;
    document.getElementById("taskLocation").value = task.location;
    document.getElementById("taskContractor").value = task.contractor;
    document.getElementById("taskDue").value = task.due;
    document.getElementById("taskPriority").value = task.priority;
    document.getElementById("taskStatus").value = task.status;
  } else {
    titleEl.textContent = "Add task";
    idInput.value = "";
  }

  openModal("taskModal");
}

function closeTaskForm() {
  closeModal(taskModal);
}

taskModal.querySelector(".form-close").onclick = closeTaskForm;
taskModal.querySelector(".cancel-task").onclick = closeTaskForm;
taskModal.onclick = (e) => {
  if (e.target === taskModal) closeTaskForm();
};

document.getElementById("taskForm").onsubmit = (e) => {
  e.preventDefault();

  const id = document.getElementById("taskId").value;

  const payload = {
    title: document.getElementById("taskTitle").value,
    location: document.getElementById("taskLocation").value,
    contractor: document.getElementById("taskContractor").value,
    due: document.getElementById("taskDue").value,
    priority: document.getElementById("taskPriority").value,
    status: document.getElementById("taskStatus").value,
    photos: 0,
    approval:
      document.getElementById("taskStatus").value === "approved"
        ? "Approved"
        : "Awaiting approval",
    projectId: data.currentProjectId
  };

  if (id) {
    // Edit existing task
    const task = data.tasks.find((t) => t.id === id);
    Object.assign(task, payload);
    showToast("Task updated");
  } else {
    // Add new task
    data.tasks.push({
      id: "t" + Date.now(),
      ...payload
    });
    showToast("Task added");
  }

  saveData(data);
  closeTaskForm();
  renderTasks();
};

// ---------- Init ----------
renderSidebar();
renderProjectHeader();
renderTasks();
renderProofs();
renderMeasurements();

// Keep old modal close buttons working
document.querySelectorAll(".close").forEach((button) => {
  button.onclick = () => closeModal(button.closest(".backdrop"));
});
document.querySelectorAll(".backdrop").forEach((modal) => {
  modal.onclick = (event) => {
    if (event.target === modal) closeModal(modal);
  };
});