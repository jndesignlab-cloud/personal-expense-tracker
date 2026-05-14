const API_URL = "https://script.google.com/macros/s/AKfycbykue9-R8zFxfd4v04PxCUOZUYmf_wvOxh_w41jfLnSlkVaCbbx59dQE_aJ2fzMeH1i/exec";

let dashboardData = null;

document.addEventListener("DOMContentLoaded", () => {
  setDefaultDates();
  loadDashboard();
});

function setDefaultDates() {
  const today = new Date().toISOString().split("T")[0];

  ["expenseDate", "transferDate", "addMoneyDate"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = today;
  });
}

function peso(value) {
  const amount = Number(value) || 0;

  return amount.toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP"
  });
}

async function apiRequest(action, payload = {}) {
  const response = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({ action, payload })
  });

  return await response.json();
}

async function loadDashboard() {
  const data = await apiRequest("getDashboardData");
  renderDashboard(data);
}

function renderDashboard(data) {
  dashboardData = data;

  document.getElementById("totalMoneyOwned").textContent =
    peso(data.stats.totalMoneyOwned);

  document.getElementById("totalMoneyOwnedSub").textContent =
    `Wallets: ${peso(data.stats.totalWalletBalance)} + Investments: ${peso(data.stats.totalInvested)}`;

  document.getElementById("todayRemaining").textContent =
    peso(data.stats.todayRemaining);

  document.getElementById("todaySpent").textContent =
    `Spent today: ${peso(data.stats.todaySpent)} / ${peso(data.stats.dailyBudget)}`;

  document.getElementById("transportRemaining").textContent =
    peso(data.stats.todayTransportRemaining);

  document.getElementById("transportSpent").textContent =
    `Spent: ${peso(data.stats.todayTransportSpent)} / ${peso(data.settings.dailyTransport)}`;

  document.getElementById("foodRemaining").textContent =
    peso(data.stats.todayFoodRemaining);

  document.getElementById("foodSpent").textContent =
    `Spent: ${peso(data.stats.todayFoodSpent)} / ${peso(data.settings.dailyFood)}`;

  document.getElementById("weekRemaining").textContent =
    peso(data.stats.weekRemaining);

  document.getElementById("weekSpent").textContent =
    `Spent this week: ${peso(data.stats.weekSpent)} / ${peso(data.stats.weeklyBudget)}`;

  document.getElementById("budgetDaysThisMonth").textContent =
    `${data.stats.budgetDaysThisMonth} days`;

  document.getElementById("totalWalletBalance").textContent =
    peso(data.stats.totalWalletBalance);

  document.getElementById("totalInvested").textContent =
    peso(data.stats.totalInvested);

  document.getElementById("debtReceivable").textContent =
    `${peso(data.stats.totalDebts)} / ${peso(data.stats.totalReceivables)}`;

  renderWallets(data.wallets);
  renderWalletDropdowns(data.wallets);
  renderExpenses(data.recentExpenses);
}

function renderWallets(wallets) {
  const container = document.getElementById("walletList");
  container.innerHTML = "";

  if (!wallets.length) {
    container.innerHTML = `<p class="subtext">No wallets yet.</p>`;
    return;
  }

  wallets.forEach(wallet => {
    const item = document.createElement("div");
    item.className = "wallet-item";

    item.innerHTML = `
      <div>
        <strong>${wallet.name}</strong>
        <span>${wallet.type}${wallet.notes ? " · " + wallet.notes : ""}</span>
      </div>

      <div class="wallet-actions">
        <div class="amount">${peso(wallet.balance)}</div>
        <button class="delete-btn" onclick="deleteWallet('${wallet.id}')">Delete</button>
      </div>
    `;

    container.appendChild(item);
  });
}

function renderWalletDropdowns(wallets) {
  const dropdownIds = [
    "expenseWallet",
    "fromWallet",
    "toWallet",
    "addMoneyWallet",
    "adjustWallet"
  ];

  dropdownIds.forEach(id => {
    const select = document.getElementById(id);
    if (!select) return;

    select.innerHTML = `<option value="">Select wallet</option>`;

    wallets.forEach(wallet => {
      const option = document.createElement("option");
      option.value = wallet.id;
      option.textContent = `${wallet.name} — ${peso(wallet.balance)}`;
      select.appendChild(option);
    });
  });
}

function renderExpenses(expenses) {
  const container = document.getElementById("expenseList");
  container.innerHTML = "";

  if (!expenses.length) {
    container.innerHTML = `<p class="subtext">No expenses yet.</p>`;
    return;
  }

  expenses.forEach(exp => {
    const item = document.createElement("div");
    item.className = "transaction-item";

    const budgetTag =
      exp.deductBudget === "Yes"
        ? `Budget: ${exp.budgetType}`
        : "Not deducted from budget";

    item.innerHTML = `
      <div>
        <strong>${exp.category}</strong>
        <span>${exp.description || "No description"} · ${exp.walletName} · ${budgetTag}</span>
      </div>

      <div class="amount">-${peso(exp.totalAmount)}</div>
    `;

    container.appendChild(item);
  });
}

function openModal(id) {
  document.getElementById(id).classList.add("active");
}

function closeModal(id) {
  document.getElementById(id).classList.remove("active");
}

function toggleBudgetType() {
  const checked = document.getElementById("deductBudget").checked;
  const wrap = document.getElementById("budgetTypeWrap");

  if (checked) {
    wrap.classList.remove("hidden");
    document.getElementById("budgetType").required = true;
  } else {
    wrap.classList.add("hidden");
    document.getElementById("budgetType").required = false;
    document.getElementById("budgetType").value = "";
  }
}

async function submitExpense(event) {
  event.preventDefault();

  const data = {
    date: document.getElementById("expenseDate").value,
    category: document.getElementById("expenseCategory").value,
    description: document.getElementById("expenseDescription").value,
    amount: Number(document.getElementById("expenseAmount").value),
    taxAmount: Number(document.getElementById("expenseTax").value) || 0,
    walletId: document.getElementById("expenseWallet").value,
    deductBudget: document.getElementById("deductBudget").checked,
    budgetType: document.getElementById("budgetType").value
  };

  const updatedData = await apiRequest("addExpense", data);
  renderDashboard(updatedData);

  event.target.reset();
  setDefaultDates();
  toggleBudgetType();
  closeModal("expenseModal");
}

async function submitTransfer(event) {
  event.preventDefault();

  const fromWalletId = document.getElementById("fromWallet").value;
  const toWalletId = document.getElementById("toWallet").value;

  if (fromWalletId === toWalletId) {
    alert("From wallet and To wallet cannot be the same.");
    return;
  }

  const data = {
    date: document.getElementById("transferDate").value,
    fromWalletId,
    toWalletId,
    amount: Number(document.getElementById("transferAmount").value),
    notes: document.getElementById("transferNotes").value
  };

  const updatedData = await apiRequest("transferWallet", data);
  renderDashboard(updatedData);

  event.target.reset();
  setDefaultDates();
  closeModal("transferModal");
}

async function submitAddMoney(event) {
  event.preventDefault();

  const data = {
    date: document.getElementById("addMoneyDate").value,
    walletId: document.getElementById("addMoneyWallet").value,
    amount: Number(document.getElementById("addMoneyAmount").value),
    source: document.getElementById("addMoneySource").value,
    notes: document.getElementById("addMoneyNotes").value
  };

  const updatedData = await apiRequest("addMoney", data);
  renderDashboard(updatedData);

  event.target.reset();
  setDefaultDates();
  closeModal("addMoneyModal");
}

async function submitWallet(event) {
  event.preventDefault();

  const data = {
    walletName: document.getElementById("walletName").value,
    walletType: document.getElementById("walletType").value,
    balance: Number(document.getElementById("walletBalance").value) || 0,
    notes: document.getElementById("walletNotes").value
  };

  const updatedData = await apiRequest("addWallet", data);
  renderDashboard(updatedData);

  event.target.reset();
  closeModal("walletModal");
}

async function submitBalanceCorrection(event) {
  event.preventDefault();

  const data = {
    walletId: document.getElementById("adjustWallet").value,
    actualBalance: Number(document.getElementById("adjustAmount").value),
    reason: document.getElementById("adjustReason").value
  };

  const updatedData = await apiRequest("adjustWalletBalance", data);
  renderDashboard(updatedData);

  event.target.reset();
  closeModal("adjustWalletModal");
}

async function deleteWallet(walletId) {
  const confirmed = confirm("Delete this wallet?");
  if (!confirmed) return;

  const updatedData = await apiRequest("deleteWallet", { walletId });
  renderDashboard(updatedData);
}
