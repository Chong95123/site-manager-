/* =========================================
   Reno Site Manager - Complete Working Version
   ========================================= */

const STORAGE_KEY = "renoSiteManager_v1";

const defaultData = {
  currentProjectId: "p1",
  projects: [
    { id: "p1", name: "Hillside Residence", phase: "Phase 2 · Interior renovation", status: "On track", progress: 68, team: 6, due: "2025-10-24", owner: "JM" },
    { id: "p2", name: "The Maple House", phase: "Phase 1 · Structural", status: "On track", progress: 42, team: 4, due: "2025-11-15", owner: "AL" },
    { id: "p3", name: "88 Jalan Aman", phase: "Finishes", status: "On track", progress: 85, team: 5, due: "2025-09-30", owner: "SK" }
  ],
  tasks: [
    { id: "t1", projectId: "p1", title: "Install kitchen cabinetry", location: "Carpentry · Level 1 Kitchen", contractor: "Mason Co.", due: "2025-09-07", priority: "High", status: "todo", photos: 4, approval: "Awaiting approval" },
    { id: "t2", projectId: "p1", title: "Electrical rough-in", location: "Electrical · Level 2 Bedrooms", contractor: "Bright Wire", due: "2025-09-06", priority: "High", status: "inprogress", photos: 2, approval: "Awaiting approval" },
    { id: "t3", projectId: "p1", title: "Waterproof shower recess", location: "Waterproofing · Master ensuite", contractor: "SealPro", due: "2025-09-05", priority: "Normal", status: "review", photos: 3, approval: "Awaiting approval" },
    { id: "t4", projectId: "p1", title: "Demolish old pantry wall", location: "Demolition · Level 1", contractor: "BuildRight", due: "2025-09-04", priority: "Normal", status: "approved", photos: 5, approval: "Approved" }
  ],
  proofs: [],
  measurements: []
};

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

function generateId(prefix) {
  return prefix + Date.now() + Math.floor(Math.random() * 1000);
}

function fileToBase64(file) {
  return new Promise((resolve) => {
    if (!file) return resolve(null);
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

function toMetres(value, unit) {
  const v = Number(value) || 0;
  if (unit === "cm") return v / 100;
  if (unit === "inch") return v * 0.0254;
  if (unit === "ft") return v * 0.3048;
  return v;
}

function formatDim(metres) {
  if (!metres) return null;
  return metres.toFixed(2) + "m";
}

/* ---------- Toast & Modal ---------- */
const toast = document.getElementById("toast");
function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2200);
}

function openModal(id) {
  document.getElementById(id).classList.add("open");
}
function closeModal(el) {
  el.classList.remove("open");
}

/* ---------- Tabs ---------- */
document.querySelectorAll(".tab").forEach((tab) => {
  tab.onclick = () => {
    document.querySelectorAll(".tab").forEach((item) => item.classList.toggle("active", item === tab));
    document.querySelectorAll(".page").forEach((page) => page.classList.toggle("active", page.id === tab.dataset.page));
  };
});

/* ---------- Sidebar ---------- */
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
  sidebar.innerHTML = `
    <div class="side-brand"><b>R</b><span>reno.</span><button class="sidebar-close">Close</button></div>
    <p>YOUR PROJECTS</p>
    ${data.projects.map(p => `
      <button class="project-item ${p.id === data.currentProjectId ? "active" : ""}" data-id="${p.id}">
        ${p.name}<small>${p.progress}% complete</small>
      </button>`).join("")}
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
      renderMaterials();
      showToast("Switched to " + btn.childNodes[0].textContent.trim());
    };
  });

  sidebar.querySelector(".new-project").onclick = () => openModal("projectModal");
}

function renderProjectHeader() {
  const p = data.projects.find(p => p.id === data.currentProjectId);
  if (!p) return;
  document.querySelector(".current-project").textContent = p.name;
  document.querySelector("#projects h1").textContent = p.name;
  document.querySelector("#projects .hero").innerHTML = `
    <span>${p.phase}</span>
    <b>${p.status}</b>
    <h2>${p.progress}% complete</h2>
    <div class="bar"><i style="width:${p.progress}%"></i></div>
    <p>${p.team} site team members · Due ${p.due}</p>
  `;
}

/* ---------- Project Modal ---------- */
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
    <label>Phase / Address<input id="projectPhase" required></label>
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
  document.getElementById("projectForm").reset();
}
projectModal.querySelector(".form-close").onclick = closeProjectForm;
projectModal.querySelector(".cancel-project").onclick = closeProjectForm;
projectModal.onclick = (e) => { if (e.target === projectModal) closeProjectForm(); };

document.getElementById("projectForm").onsubmit = (e) => {
  e.preventDefault();
  const newProject = {
    id: "p" + Date.now(),
    name: document.getElementById("projectName").value,
    phase: document.getElementById("projectPhase").value,
    status: "New project",
    progress: 0,
    team: 0,
    due: document.getElementById("projectDue").value,
    owner: document.getElementById("projectOwner").value
  };
  data.projects.push(newProject);
  data.currentProjectId = newProject.id;
  saveData(data);
  closeProjectForm();
  renderSidebar();
  renderProjectHeader();
  renderTasks();
  renderProofs();
  renderMeasurements();
  renderPlans();
  renderHandover();
  showToast("Project created");
};

/* ---------- Tasks ---------- */
const statusMap = { todo: "To do", inprogress: "In progress", review: "Review", approved: "Approved" };

function renderTasks() {
  const page = document.getElementById("tasks");
  const projectTasks = data.tasks.filter(t => t.projectId === data.currentProjectId);
  const columns = ["todo", "inprogress", "review", "approved"];

  page.innerHTML = `
    <div class="heading">
      <div><p class="eyebrow">WORKFLOW BOARD</p><h1>Tasks</h1></div>
      <button class="primary" id="addTaskBtn">+ Add task</button>
    </div>
    <div class="board">
      ${columns.map(status => {
        const cards = projectTasks.filter(t => t.status === status);
        return `
          <section class="board-column ${status === "approved" ? "approved-column" : ""}" data-status="${status}">
            <header><h2>${statusMap[status]} <span>${cards.length}</span></h2></header>
            <div class="drop-zone">${cards.map(t => taskCardHTML(t)).join("")}</div>
          </section>`;
      }).join("")}
    </div>
  `;

  let draggedId = null;
  page.querySelectorAll(".task-card").forEach(card => {
    card.ondragstart = () => { draggedId = card.dataset.id; };
  });
  page.querySelectorAll(".drop-zone").forEach(zone => {
    zone.ondragover = e => e.preventDefault();
    zone.ondrop = e => {
      e.preventDefault();
      const newStatus = zone.closest(".board-column").dataset.status;
      const task = data.tasks.find(t => t.id === draggedId);
      if (task) {
        task.status = newStatus;
        task.approval = newStatus === "approved" ? "Approved" : "Awaiting approval";
        saveData(data);
        renderTasks();
        showToast("Task moved");
      }
    };
  });

  document.getElementById("addTaskBtn").onclick = () => openTaskModal();
  page.querySelectorAll(".edit-task").forEach(btn => {
    btn.onclick = e => { e.stopPropagation(); openTaskModal(btn.dataset.id); };
  });
  page.querySelectorAll(".delete-task").forEach(btn => {
    btn.onclick = e => {
      e.stopPropagation();
      if (confirm("Delete this task?")) {
        data.tasks = data.tasks.filter(t => t.id !== btn.dataset.id);
        saveData(data);
        renderTasks();
        showToast("Task deleted");
      }
    };
  });
}

function taskCardHTML(task) {
  return `
    <article class="task-card" draggable="true" data-id="${task.id}">
      <span class="priority ${task.priority.toLowerCase()}">${task.priority}</span>
      <h3>${task.title}</h3>
      <p>${task.location}</p>
      <div>Contractor: ${task.contractor}<b>${task.due}</b></div>
      <footer>Photos: ${task.photos || 0} <em>${task.approval}</em></footer>
      ${task.status === "approved" ? '<div class="payment">Eligible for payment</div>' : ""}
      <div style="margin-top:8px; display:flex; gap:6px;">
        <button class="edit-task" data-id="${task.id}" style="font-size:10px; padding:4px 8px;">Edit</button>
        <button class="delete-task" data-id="${task.id}" style="font-size:10px; padding:4px 8px; color:#c25b35;">Delete</button>
      </div>
    </article>`;
}

/* Task Modal */
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
    <label>Location / Trade<input id="taskLocation" required></label>
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
  document.getElementById("taskForm").reset();
  const idInput = document.getElementById("taskId");
  const titleEl = document.getElementById("taskModalTitle");

  if (editId) {
    const task = data.tasks.find(t => t.id === editId);
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

function closeTaskForm() { closeModal(taskModal); }
taskModal.querySelector(".form-close").onclick = closeTaskForm;
taskModal.querySelector(".cancel-task").onclick = closeTaskForm;
taskModal.onclick = e => { if (e.target === taskModal) closeTaskForm(); };

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
    approval: document.getElementById("taskStatus").value === "approved" ? "Approved" : "Awaiting approval",
    projectId: data.currentProjectId
  };

  if (id) {
    const task = data.tasks.find(t => t.id === id);
    Object.assign(task, payload);
    showToast("Task updated");
  } else {
    data.tasks.push({ id: "t" + Date.now(), ...payload });
    showToast("Task added");
  }
  saveData(data);
  closeTaskForm();
  renderTasks();
};

/* ---------- Work Proof ---------- */
function renderProofs() {
  const page = document.getElementById("proof");
  const list = data.proofs.filter(p => p.projectId === data.currentProjectId);

  page.innerHTML = `
    <div class="heading">
      <div><p class="eyebrow">SITE DOCUMENTATION</p><h1>Work proof</h1></div>
      <button class="primary" id="addProofBtn">+ Add proof</button>
    </div>
    ${list.length === 0
      ? `<p style="color:var(--muted); margin-top:20px;">No work proofs yet.</p>`
      : list.map(p => `
        <article class="proof-card">
          <span class="chip ${p.status === "Approved" ? "confirmed" : "pending"}">${p.status}</span>
          <h3>${p.title}</h3>
          <p>${p.date} · ${p.location}</p>
          <div class="photos">
            <div style="background-image:url('${p.before || ""}'); background-size:cover; background-position:center;">${p.before ? "" : "BEFORE"}</div>
            <div style="background-image:url('${p.after || ""}'); background-size:cover; background-position:center;">${p.after ? "" : "AFTER"}</div>
          </div>
          <p>${p.notes || ""}</p>
          <div style="display:flex; gap:8px; margin-top:10px;">
            <button class="approval request-approval" data-id="${p.id}">${p.status === "Approved" ? "Approved" : "Request owner approval"}</button>
            <button class="delete-proof" data-id="${p.id}" style="font-size:11px; color:#c25b35;">Delete</button>
          </div>
        </article>`).join("")}
  `;

  document.getElementById("addProofBtn").onclick = () => {
    document.getElementById("proofForm").reset();
    openModal("proofModal");
  };

  page.querySelectorAll(".request-approval").forEach(btn => {
    btn.onclick = () => {
      const proof = data.proofs.find(p => p.id === btn.dataset.id);
      if (proof && proof.status !== "Approved") {
        proof.status = "Approved";
        saveData(data);
        renderProofs();
        showToast("Marked as approved");
      }
    };
  });

  page.querySelectorAll(".delete-proof").forEach(btn => {
    btn.onclick = () => {
      if (confirm("Delete this work proof?")) {
        data.proofs = data.proofs.filter(p => p.id !== btn.dataset.id);
        saveData(data);
        renderProofs();
        showToast("Work proof deleted");
      }
    };
  });
}

document.getElementById("proofForm").onsubmit = async (e) => {
  e.preventDefault();
  const form = e.target;
  const files = form.querySelectorAll('input[type="file"]');
  const beforeBase64 = await fileToBase64(files[0]?.files[0]);
  const afterBase64 = await fileToBase64(files[1]?.files[0]);

  data.proofs.push({
    id: generateId("pr"),
    projectId: data.currentProjectId,
    title: form.querySelector("select").value,
    location: "Site",
    date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
    notes: form.querySelector("textarea").value,
    status: "Awaiting approval",
    before: beforeBase64,
    after: afterBase64
  });
  saveData(data);
  closeModal(document.getElementById("proofModal"));
  renderProofs();
  showToast("Work proof saved");
};

/* ---------- Measurements ---------- */
function renderMeasurements() {
  const page = document.getElementById("measurements");
  const list = data.measurements.filter(m => m.projectId === data.currentProjectId);
  const pendingCount = list.filter(m => m.status === "Pending").length;

  page.innerHTML = `
    <div class="heading">
      <div><p class="eyebrow">SITE DIMENSIONS</p><h1>Measurements</h1></div>
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
                <p style="margin:0; font-size:13px; font-weight:bold;">${dimText}</p>
                <div style="margin-top:8px; display:flex; gap:8px;">
                  ${m.status === "Pending" ? `<button class="confirm-measure" data-id="${m.id}" style="font-size:11px;">Confirm</button>` : ""}
                  <button class="delete-measure" data-id="${m.id}" style="font-size:11px; color:#c25b35;">Delete</button>
                </div>
              </div>
            </article>`;
          }).join("")}
    </div>
  `;

  document.getElementById("addMeasurementBtn").onclick = () => {
    document.getElementById("measurementForm").reset();
    openModal("measurementModal");
  };

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

document.getElementById("measurementForm").onsubmit = async (e) => {
  e.preventDefault();
  const unit = document.getElementById("measureUnit").value;
  const photoFile = document.getElementById("measurePhoto").files[0];
  const photoBase64 = await fileToBase64(photoFile);

  data.measurements.push({
    id: generateId("m"),
    projectId: data.currentProjectId,
    name: document.getElementById("measureName").value,
    length: toMetres(document.getElementById("length").value, unit),
    width:  toMetres(document.getElementById("width").value, unit),
    height: toMetres(document.getElementById("height").value, unit),
    photo: photoBase64,
    status: "Pending"
  });

  saveData(data);
  closeModal(document.getElementById("measurementModal"));
  renderMeasurements();
  showToast("Measurement saved");
};


/* ---------- Materials ---------- */
function renderMaterials() {
  const page = document.getElementById("materials");
  if (!page) return;

  // Make sure materials array exists
  if (!data.materials) data.materials = [];

  const list = data.materials.filter(m => m.projectId === data.currentProjectId);

  const statusOrder = ["To order", "Ordered", "Received", "Installed"];
  const statusCount = {
    "To order": list.filter(i => i.status === "To order").length,
    "Ordered": list.filter(i => i.status === "Ordered").length,
    "Received": list.filter(i => i.status === "Received").length,
    "Installed": list.filter(i => i.status === "Installed").length
  };

  page.innerHTML = `
    <div class="heading">
      <div>
        <p class="eyebrow">PROCUREMENT</p>
        <h1>Materials</h1>
      </div>
      <button class="primary" id="addMaterialBtn">+ Add material</button>
    </div>

    <div class="summary" style="margin-bottom:16px;">
      <b>${list.length}</b> items
      <span>
        To order: ${statusCount["To order"]} · 
        Ordered: ${statusCount["Ordered"]} · 
        Received: ${statusCount["Received"]} · 
        Installed: ${statusCount["Installed"]}
      </span>
    </div>

    <div id="materialList">
      ${list.length === 0
        ? `<p style="color:var(--muted);">No materials yet. Click “+ Add material” to start.</p>`
        : list.map(item => `
          <article class="measure-card" style="display:grid; grid-template-columns: 1fr auto; gap:8px; align-items:center; margin-bottom:10px;">
            <div>
              <span class="chip ${item.status === "Installed" ? "confirmed" : "pending"}">${item.status}</span>
              <h3 style="margin:4px 0 2px;">${item.name}</h3>
              <p style="margin:0; font-size:12px; color:var(--muted);">
                Qty: ${item.qty} ${item.unit || ""} 
                ${item.notes ? "· " + item.notes : ""}
              </p>
            </div>
            <div style="display:flex; flex-direction:column; gap:6px; align-items:flex-end;">
              <select class="material-status" data-id="${item.id}" style="font-size:11px; padding:4px 6px;">
                ${statusOrder.map(s => `<option value="${s}" ${item.status === s ? "selected" : ""}>${s}</option>`).join("")}
              </select>
              <button class="delete-material" data-id="${item.id}" style="font-size:11px; color:#c25b35;">Delete</button>
            </div>
          </article>
        `).join("")}
    </div>
  `;

  // Add button
  document.getElementById("addMaterialBtn").onclick = () => {
    openMaterialModal();
  };

  // Change status
  page.querySelectorAll(".material-status").forEach(select => {
    select.onchange = () => {
      const item = data.materials.find(m => m.id === select.dataset.id);
      if (item) {
        item.status = select.value;
        saveData(data);
        renderMaterials();
        showToast("Status updated");
      }
    };
  });

  // Delete
  page.querySelectorAll(".delete-material").forEach(btn => {
    btn.onclick = () => {
      if (confirm("Delete this material?")) {
        data.materials = data.materials.filter(m => m.id !== btn.dataset.id);
        saveData(data);
        renderMaterials();
        showToast("Material deleted");
      }
    };
  });
}

/* Material Modal */
const materialModal = document.createElement("div");
materialModal.id = "materialModal";
materialModal.className = "backdrop";
materialModal.innerHTML = `
  <form class="modal" id="materialForm">
    <button type="button" class="close form-close">×</button>
    <p class="eyebrow">NEW MATERIAL</p>
    <h2>Add material</h2>
    <label>Item name<input id="materialName" required placeholder="e.g. Tile adhesive, Cabinet handle"></label>
    <label>Quantity<input id="materialQty" type="number" min="1" value="1" required></label>
    <label>Unit
      <select id="materialUnit">
        <option value="">—</option>
        <option>pcs</option>
        <option>box</option>
        <option>bag</option>
        <option>set</option>
        <option>m</option>
        <option>m²</option>
        <option>roll</option>
      </select>
    </label>
    <label>Status
      <select id="materialStatus">
        <option>To order</option>
        <option>Ordered</option>
        <option>Received</option>
        <option>Installed</option>
      </select>
    </label>
    <label>Notes<textarea id="materialNotes" placeholder="Optional notes..."></textarea></label>
    <div class="modal-actions">
      <button type="button" class="cancel-material">Cancel</button>
      <button class="save">Save material</button>
    </div>
  </form>
`;
document.body.append(materialModal);

function openMaterialModal() {
  document.getElementById("materialForm").reset();
  openModal("materialModal");
}

function closeMaterialForm() {
  closeModal(materialModal);
}
materialModal.querySelector(".form-close").onclick = closeMaterialForm;
materialModal.querySelector(".cancel-material").onclick = closeMaterialForm;
materialModal.onclick = e => { if (e.target === materialModal) closeMaterialForm(); };

document.getElementById("materialForm").onsubmit = (e) => {
  e.preventDefault();

  if (!data.materials) data.materials = [];

  data.materials.push({
    id: generateId("mat"),
    projectId: data.currentProjectId,
    name: document.getElementById("materialName").value,
    qty: Number(document.getElementById("materialQty").value) || 1,
    unit: document.getElementById("materialUnit").value,
    status: document.getElementById("materialStatus").value,
    notes: document.getElementById("materialNotes").value
  });

  saveData(data);
  closeMaterialForm();
  renderMaterials();
  showToast("Material added");
};


/* ---------- Plans & Markups (Fixed) ---------- */

function renderPlans() {
  if (!data.pins) data.pins = [];

  const list = data.pins.filter(p => p.projectId === data.currentProjectId);
  const completed = list.filter(p => p.status === "Done").length;

  // Summary
  const summary = document.getElementById("planSummary");
  if (summary) {
    summary.innerHTML = `<b>${list.length}</b> pins · <span>${completed} completed</span>`;
  }

  // Side checklist
  const pinList = document.getElementById("pinList");
  if (pinList) {
    pinList.innerHTML = list.length === 0
      ? `<p style="color:var(--muted); font-size:12px;">No pins yet. Click on the plan to place a pin.</p>`
      : list.map((p, index) => `
        <article class="pin-item" data-id="${p.id}" 
          style="border-left: 3px solid ${p.status === "Done" ? "var(--green)" : "var(--orange)"}; cursor:pointer;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <h3 style="margin:0;">${index + 1}. ${p.title}</h3>
            <span class="chip ${p.status === "Done" ? "confirmed" : "pending"}" style="font-size:9px;">${p.status}</span>
          </div>
          <p style="margin:4px 0 0; font-size:11px;">${p.category}</p>
          ${p.notes ? `<small style="display:block; margin-top:3px;">${p.notes}</small>` : ""}
          <div style="margin-top:8px; display:flex; gap:6px;">
            <button class="toggle-pin" data-id="${p.id}" style="font-size:10px;">
              ${p.status === "Done" ? "Mark Open" : "Mark Done"}
            </button>
            <button class="edit-pin" data-id="${p.id}" style="font-size:10px;">Edit</button>
            <button class="delete-pin" data-id="${p.id}" style="font-size:10px; color:#c25b35;">Delete</button>
          </div>
        </article>
      `).join("");
  }

  // Pins on the plan
  const pinsLayer = document.getElementById("pinsLayer");
  if (pinsLayer) {
    pinsLayer.innerHTML = "";
    list.forEach((p, index) => {
      const btn = document.createElement("button");
      btn.className = "plan-pin";
      btn.textContent = index + 1;
      btn.style.left = p.x + "%";
      btn.style.top = p.y + "%";
      btn.title = p.title + " (" + p.status + ")";
      btn.style.background = p.status === "Done" ? "#39896d" : "#eb7649";
      btn.style.borderColor = "white";

      btn.onclick = (e) => {
        e.stopPropagation();
        openPinModal(p.id);
      };
      pinsLayer.appendChild(btn);
    });
  }

  // Toggle Done / Open
  document.querySelectorAll(".toggle-pin").forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const pin = data.pins.find(p => p.id === btn.dataset.id);
      if (pin) {
        pin.status = pin.status === "Done" ? "Open" : "Done";
        saveData(data);
        renderPlans();
        showToast(pin.status === "Done" ? "Marked as Done" : "Marked as Open");
      }
    };
  });

  // Edit
  document.querySelectorAll(".edit-pin").forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      openPinModal(btn.dataset.id);
    };
  });

  // Delete
  document.querySelectorAll(".delete-pin").forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      if (confirm("Delete this pin?")) {
        data.pins = data.pins.filter(p => p.id !== btn.dataset.id);
        saveData(data);
        renderPlans();
        showToast("Pin deleted");
      }
    };
  });
}

/* Pin Modal */
const pinModal = document.createElement("div");
pinModal.id = "pinModal";
pinModal.className = "backdrop";
pinModal.innerHTML = `
  <form class="modal" id="pinForm">
    <button type="button" class="close form-close">×</button>
    <p class="eyebrow">PLAN PIN</p>
    <h2 id="pinModalTitle">Add pin</h2>
    <input type="hidden" id="pinId">
    <input type="hidden" id="pinX">
    <input type="hidden" id="pinY">

    <label>Title
      <input id="pinTitle" required placeholder="e.g. Confirm power outlet position">
    </label>
    <label>Category
      <select id="pinCategory">
        <option>M&E</option>
        <option>Built-in</option>
        <option>Painting</option>
        <option>Flooring</option>
        <option>Appliance</option>
        <option>Defect</option>
        <option>Other</option>
      </select>
    </label>
    <label>Status
      <select id="pinStatus">
        <option>Open</option>
        <option>In progress</option>
        <option>Done</option>
      </select>
    </label>
    <label>Notes
      <textarea id="pinNotes" placeholder="Instructions or remarks..."></textarea>
    </label>

    <div class="modal-actions">
      <button type="button" class="cancel-pin">Cancel</button>
      <button class="save">Save pin</button>
    </div>
  </form>
`;
document.body.append(pinModal);

function openPinModal(editId = null, x = 50, y = 50) {
  const form = document.getElementById("pinForm");
  form.reset();

  const idInput = document.getElementById("pinId");
  const titleEl = document.getElementById("pinModalTitle");

  if (editId) {
    const pin = data.pins.find(p => p.id === editId);
    if (!pin) return;
    titleEl.textContent = "Edit pin";
    idInput.value = pin.id;
    document.getElementById("pinTitle").value = pin.title;
    document.getElementById("pinCategory").value = pin.category;
    document.getElementById("pinStatus").value = pin.status;
    document.getElementById("pinNotes").value = pin.notes || "";
    document.getElementById("pinX").value = pin.x;
    document.getElementById("pinY").value = pin.y;
  } else {
    titleEl.textContent = "Add pin";
    idInput.value = "";
    document.getElementById("pinX").value = x;
    document.getElementById("pinY").value = y;
  }

  openModal("pinModal");
}

function closePinForm() {
  closeModal(pinModal);
}
pinModal.querySelector(".form-close").onclick = closePinForm;
pinModal.querySelector(".cancel-pin").onclick = closePinForm;
pinModal.onclick = e => { if (e.target === pinModal) closePinForm(); };

document.getElementById("pinForm").onsubmit = (e) => {
  e.preventDefault();

  if (!data.pins) data.pins = [];

  const id = document.getElementById("pinId").value;
  const payload = {
    title: document.getElementById("pinTitle").value,
    category: document.getElementById("pinCategory").value,
    status: document.getElementById("pinStatus").value,
    notes: document.getElementById("pinNotes").value,
    x: Number(document.getElementById("pinX").value),
    y: Number(document.getElementById("pinY").value),
    projectId: data.currentProjectId
  };

  if (id) {
    const pin = data.pins.find(p => p.id === id);
    Object.assign(pin, payload);
    showToast("Pin updated");
  } else {
    data.pins.push({
      id: generateId("pin"),
      ...payload
    });
    showToast("Pin added");
  }

  saveData(data);
  closePinForm();
  renderPlans();
};

/* Click on plan to place pin - FIXED */
const planWorkspace = document.getElementById("planWorkspace");
if (planWorkspace) {
  planWorkspace.addEventListener("click", function(e) {
    // Ignore if clicking on an existing pin
    if (e.target.classList.contains("plan-pin")) return;

    const rect = planWorkspace.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(1);
    const y = ((e.clientY - rect.top) / rect.height * 100).toFixed(1);

    openPinModal(null, x, y);
  });
}

/* Upload plan image */
document.getElementById("planUpload")?.addEventListener("change", function(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function() {
    const plan = document.getElementById("samplePlan");
    plan.style.backgroundImage = `url(${reader.result})`;
    plan.style.backgroundSize = "contain";
    plan.style.backgroundPosition = "center";
    plan.style.backgroundRepeat = "no-repeat";
    plan.innerHTML = "";
    showToast("Plan uploaded");
  };
  reader.readAsDataURL(file);
});

/* Add pin button (places in centre) */
document.getElementById("addPinBtn")?.addEventListener("click", function() {
  openPinModal(null, 50, 50);
});


/* ---------- Handover (with Signature) ---------- */
function renderHandover() {
  const page = document.getElementById("handover");
  if (!page) return;

  if (!data.handover) data.handover = {};

  const projectId = data.currentProjectId;
  if (!data.handover[projectId]) {
    data.handover[projectId] = {
      items: [
        { id: "h1", text: "All keys returned to owner", done: false },
        { id: "h2", text: "Access cards / fobs returned", done: false },
        { id: "h3", text: "Owner manuals & warranties collected", done: false },
        { id: "h4", text: "Appliance documents handed over", done: false },
        { id: "h5", text: "Final cleaning completed", done: false },
        { id: "h6", text: "Snag list cleared / accepted", done: false },
        { id: "h7", text: "Final work proofs reviewed", done: false },
        { id: "h8", text: "Marked-up plans handed over", done: false },
        { id: "h9", text: "Owner walkthrough completed", done: false },
        { id: "h10", text: "Keys & cards signed for by owner", done: false }
      ],
      ownerName: "",
      signedDate: "",
      signature: null,       // base64 of signature drawing
      signed: false,
      notes: ""
    };
    saveData(data);
  }

  const ho = data.handover[projectId];
  const total = ho.items.length;
  const doneCount = ho.items.filter(i => i.done).length;
  const progress = Math.round((doneCount / total) * 100);

  const proofCount = (data.proofs || []).filter(p => p.projectId === projectId).length;
  const pinCount = (data.pins || []).filter(p => p.projectId === projectId).length;
  const pinDone = (data.pins || []).filter(p => p.projectId === projectId && p.status === "Done").length;

  page.innerHTML = `
    <div class="heading">
      <div>
        <p class="eyebrow">PROJECT CLOSEOUT</p>
        <h1>Handover</h1>
      </div>
    </div>

    <div class="summary" style="margin-bottom:18px;">
      <b>${doneCount} / ${total}</b> items complete
      <span>${progress}% ready for handover</span>
    </div>

    <div class="bar" style="margin-bottom:24px; height:8px;">
      <i style="width:${progress}%; background:var(--green);"></i>
    </div>

    <!-- Quick links -->
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:24px;">
      <article style="padding:14px; border:1px solid var(--line); border-radius:12px; background:white;">
        <small style="color:var(--muted);">Work Proofs</small>
        <strong style="display:block; font-size:20px; margin:4px 0;">${proofCount}</strong>
        <p style="margin:0; font-size:11px; color:var(--muted);">photos recorded</p>
      </article>
      <article style="padding:14px; border:1px solid var(--line); border-radius:12px; background:white;">
        <small style="color:var(--muted);">Plans & Pins</small>
        <strong style="display:block; font-size:20px; margin:4px 0;">${pinDone}/${pinCount}</strong>
        <p style="margin:0; font-size:11px; color:var(--muted);">pins completed</p>
      </article>
    </div>

    <!-- Checklist -->
    <h2 style="font-size:16px; margin-bottom:12px;">Handover Checklist</h2>
    <div id="handoverList" style="margin-bottom:28px;">
      ${ho.items.map(item => `
        <label style="display:flex; align-items:center; gap:10px; padding:12px; margin-bottom:8px; border:1px solid var(--line); border-radius:10px; background:white; cursor:pointer;">
          <input type="checkbox" class="ho-check" data-id="${item.id}" ${item.done ? "checked" : ""} style="width:18px; height:18px;">
          <span style="${item.done ? "text-decoration:line-through; color:var(--muted);" : ""}">${item.text}</span>
        </label>
      `).join("")}
    </div>

    <!-- Owner Sign-off -->
    <h2 style="font-size:16px; margin-bottom:12px;">Owner Sign-off</h2>
    <div style="padding:18px; border:1px solid var(--line); border-radius:14px; background:white; margin-bottom:20px;">
      ${ho.signed ? `
        <div style="text-align:center; padding:10px 0;">
          <div style="font-size:28px; color:var(--green); margin-bottom:8px;">✓</div>
          <p style="margin:0; font-weight:bold;">Signed by ${ho.ownerName}</p>
          <p style="margin:4px 0 0; font-size:13px; color:var(--muted);">Sign-off date: ${ho.signedDate}</p>
          ${ho.signature ? `
            <div style="margin:16px auto; max-width:280px; border:1px solid #e2e8e7; border-radius:8px; padding:8px; background:#fafbfb;">
              <img src="${ho.signature}" style="width:100%; height:auto;">
            </div>
          ` : ""}
          ${ho.notes ? `<p style="margin-top:10px; font-size:13px;">Notes: ${ho.notes}</p>` : ""}
          <button id="unsignHandover" style="margin-top:14px; font-size:12px; color:#c25b35;">Undo sign-off</button>
        </div>
      ` : `
        <label>Owner full name
          <input id="ownerName" value="${ho.ownerName || ""}" placeholder="Enter owner name" style="margin-top:6px;">
        </label>

        <label style="margin-top:14px; display:block;">Signature</label>
        <div style="border:1px solid #dce3e2; border-radius:8px; background:#fafbfb; margin-top:6px;">
          <canvas id="signaturePad" width="400" height="140" style="width:100%; height:140px; touch-action:none; cursor:crosshair;"></canvas>
        </div>
        <button type="button" id="clearSignature" style="font-size:11px; margin-top:6px; color:var(--muted);">Clear signature</button>

        <label style="margin-top:14px; display:block;">
          Notes (optional)
          <textarea id="handoverNotes" placeholder="Any final remarks...">${ho.notes || ""}</textarea>
        </label>

        <button class="primary" id="signHandover" style="margin-top:16px; width:100%;">
          Confirm & Sign Handover
        </button>
      `}
    </div>

    <button class="primary" id="generatePdf" style="width:100%; background:var(--ink);">
      Generate Handover PDF
    </button>
  `;

  // Checkbox handlers
  page.querySelectorAll(".ho-check").forEach(cb => {
    cb.onchange = () => {
      const item = ho.items.find(i => i.id === cb.dataset.id);
      if (item) {
        item.done = cb.checked;
        saveData(data);
        renderHandover();
      }
    };
  });

  // Signature pad
  if (!ho.signed) {
    initSignaturePad();
  }

  // Sign off
  const signBtn = document.getElementById("signHandover");
  if (signBtn) {
    signBtn.onclick = () => {
      const name = document.getElementById("ownerName").value.trim();
      if (!name) {
        alert("Please enter owner name");
        return;
      }

      const canvas = document.getElementById("signaturePad");
      const signatureData = canvas.toDataURL("image/png");

      // Check if signature is empty (mostly white)
      if (isCanvasEmpty(canvas)) {
        alert("Please provide a signature");
        return;
      }

      if (doneCount < total) {
        if (!confirm(`Only ${doneCount}/${total} items completed. Still sign off?`)) return;
      }

      ho.ownerName = name;
      ho.notes = document.getElementById("handoverNotes").value;
      ho.signature = signatureData;
      ho.signedDate = new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });
      ho.signed = true;
      saveData(data);
      renderHandover();
      showToast("Handover signed on " + ho.signedDate);
    };
  }

  // Undo sign
  const unsignBtn = document.getElementById("unsignHandover");
  if (unsignBtn) {
    unsignBtn.onclick = () => {
      if (confirm("Undo the sign-off?")) {
        ho.signed = false;
        ho.signature = null;
        ho.signedDate = "";
        saveData(data);
        renderHandover();
      }
    };
  }

  // Generate PDF
  document.getElementById("generatePdf").onclick = () => {
    generateHandoverPDF();
  };
}

function initSignaturePad() {
  const canvas = document.getElementById("signaturePad");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  ctx.strokeStyle = "#20343d";
  ctx.lineWidth = 2.2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  let drawing = false;

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  }

  function start(e) {
    e.preventDefault();
    drawing = true;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  function move(e) {
    if (!drawing) return;
    e.preventDefault();
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }

  function end() {
    drawing = false;
  }

  canvas.addEventListener("mousedown", start);
  canvas.addEventListener("mousemove", move);
  canvas.addEventListener("mouseup", end);
  canvas.addEventListener("mouseleave", end);

  canvas.addEventListener("touchstart", start, { passive: false });
  canvas.addEventListener("touchmove", move, { passive: false });
  canvas.addEventListener("touchend", end);

  document.getElementById("clearSignature").onclick = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };
}

function isCanvasEmpty(canvas) {
  const ctx = canvas.getContext("2d");
  const pixelBuffer = new Uint32Array(
    ctx.getImageData(0, 0, canvas.width, canvas.height).data.buffer
  );
  return !pixelBuffer.some(color => color !== 0);
}

function generateHandoverPDF() {
  const project = data.projects.find(p => p.id === data.currentProjectId);
  const ho = data.handover[data.currentProjectId];
  if (!project || !ho) return;

  const doneCount = ho.items.filter(i => i.done).length;
  const proofCount = (data.proofs || []).filter(p => p.projectId === data.currentProjectId).length;
  const pinCount = (data.pins || []).filter(p => p.projectId === data.currentProjectId).length;

  const win = window.open("", "_blank");
  win.document.write(`
    <html>
    <head>
      <title>Handover - ${project.name}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #20343d; max-width: 700px; margin: 0 auto; }
        h1 { margin-bottom: 4px; }
        .meta { color: #718085; font-size: 13px; margin-bottom: 30px; }
        h2 { font-size: 16px; margin-top: 28px; border-bottom: 1px solid #e2e8e7; padding-bottom: 6px; }
        .item { padding: 8px 0; border-bottom: 1px solid #f0f3f2; font-size: 14px; }
        .done { color: #39896d; }
        .pending { color: #718085; }
        .sign-box { margin-top: 40px; padding: 20px; border: 1px solid #e2e8e7; border-radius: 8px; }
        .signature-img { max-width: 260px; margin-top: 12px; border: 1px solid #eee; }
        .footer { margin-top: 50px; font-size: 11px; color: #9da6a8; text-align: center; }
      </style>
    </head>
    <body>
      <h1>Project Handover</h1>
      <div class="meta">
        <strong>${project.name}</strong><br>
        ${project.phase}<br>
        Generated: ${new Date().toLocaleDateString("en-GB")}
      </div>

      <h2>Summary</h2>
      <p>${doneCount} / ${ho.items.length} checklist items completed</p>
      <p>Work proofs recorded: ${proofCount}</p>
      <p>Plan pins: ${pinCount}</p>

      <h2>Handover Checklist</h2>
      ${ho.items.map(i => `
        <div class="item ${i.done ? "done" : "pending"}">
          ${i.done ? "✓" : "○"} ${i.text}
        </div>
      `).join("")}

      <div class="sign-box">
        <h2 style="margin-top:0;">Owner Confirmation</h2>
        ${ho.signed ? `
          <p><strong>Signed by:</strong> ${ho.ownerName}</p>
          <p><strong>Sign-off date:</strong> ${ho.signedDate}</p>
          ${ho.notes ? `<p><strong>Notes:</strong> ${ho.notes}</p>` : ""}
          ${ho.signature ? `<img class="signature-img" src="${ho.signature}">` : ""}
          <p style="margin-top:16px;">I confirm that keys, access cards, manuals and the completed works have been handed over and accepted.</p>
        ` : `
          <p style="color:#718085;">Not yet signed</p>
        `}
      </div>

      <div class="footer">
        Generated by Reno Site Manager · ${project.name}
      </div>

      <script>window.print();</script>
    </body>
    </html>
  `);
  win.document.close();
}


/* ---------- Init ---------- */
renderSidebar();
renderProjectHeader();
renderTasks();
renderProofs();
renderMeasurements();
renderMaterials();
renderPlans();
renderHandover();

/* Close buttons */
document.querySelectorAll(".close").forEach(btn => {
  btn.onclick = () => closeModal(btn.closest(".backdrop"));
});
document.querySelectorAll(".backdrop").forEach(modal => {
  modal.onclick = e => { if (e.target === modal) closeModal(modal); };
});

/* Keep old report button working */
document.getElementById("viewReport")?.addEventListener("click", () => openModal("reportModal"));