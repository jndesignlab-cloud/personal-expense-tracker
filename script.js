const API_URL = "https://script.google.com/macros/s/AKfycbxcvPZvoErwwA6pWdCzmwNaH-9I2FkgaGBGmlijmQjXr-19XoegAd1R37fJP3ZDTQmg/exec";

let dashboardData = null;
let moneyChart = null;

document.addEventListener("DOMContentLoaded", () => {
  setDefaultDates();
  loadDashboard();
});

function setDefaultDates() {
  const today = new Date().toISOString().split("T")[0];

  [
    "expenseDate",
    "transferDate",
    "addMoneyDate",
    "investmentDate"
  ].forEach(id => {
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

  document.getElementById("totalWalletBalance").textContent =
    peso(data.stats.totalWalletBalance);

  document.getElementById("totalInvested").textContent =
    peso(data.stats.totalInvested);

  document.getElementById("debtReceivable").textContent =
    `${peso(data.stats.totalDebts)} / ${peso(data.stats.totalReceivables)}`;

  renderWallets(data.wallets);
  renderWalletDropdowns(data.wallets);
  renderExpenses(data.recentExpenses);
  renderInvestments(data.investments);

  renderMoneyChart(
    data.stats.totalWalletBalance,
    data.stats.totalInvested
  );
}

function renderMoneyChart(wallets, investments) {
  const ctx = document.getElementById("moneyChart");

  if (!ctx) return;

  if (moneyChart) {
    moneyChart.destroy();
  }

  moneyChart = new Chart(ctx, {
    type: "doughnut",

    data: {
      labels: ["Wallets", "Investments"],

      datasets: [
        {
          data: [wallets, investments],
          backgroundColor: ["#2f80ff", "#14b8a6"],
          borderWidth: 0,
          borderRadius: 10
        }
      ]
    },

    options: {
      responsive: true,
      cutout: "72%",

      plugins: {
        legend: {
          position: "bottom",

          labels: {
            color: "white",
            padding: 20,
            font: {
              family: "Inter"
            }
          }
        }
      }
    }
  });
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

        <button
          class="delete-btn"
          onclick="deleteWallet('${wallet.id}')"
        >
          Delete
        </button>
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
    "adjustWallet",
    "investmentWallet"
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

        <span>
          ${exp.description || "No description"}
          · ${exp.walletName}
          · ${budgetTag}
        </span>
      </div>

      <div class="amount">
        -${peso(exp.totalAmount)}
      </div>
    `;

    container.appendChild(item);
  });
}

function renderInvestments(investments) {
  const container = document.getElementById("investmentList");
  container.innerHTML = "";

  if (!investments || !investments.length) {
    container.innerHTML = `<p class="subtext">No investments yet.</p>`;
    return;
  }

  investments.forEach(inv => {
    const item = document.createElement("div");
    item.className = "transaction-item";

    item.innerHTML = `
      <div>
        <strong>${inv.platform}</strong>
        <span>${inv.description || "No description"}</span>
      </div>

      <div class="amount">
        ${peso(inv.amount)}
      </div>
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

function toggleInvestmentWallet() {
  const checked = document.getElementById("investmentFromWalletToggle").checked;
  const wrap = document.getElementById("investmentWalletWrap");

  if (checked) {
    wrap.classList.remove("hidden");
    document.getElementById("investmentWallet").required = true;
  } else {
    wrap.classList.add("hidden");
    document.getElementById("investmentWallet").required = false;
    document.getElementById("investmentWallet").value = "";
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

async function submitInvestment(event) {
  event.preventDefault();

  const data = {
    date: document.getElementById("investmentDate").value,
    platform: document.getElementById("investmentPlatform").value,
    description: document.getElementById("investmentDescription").value,
    amount: Number(document.getElementById("investmentAmount").value),

    fundedFromWallet:
      document.getElementById("investmentFromWalletToggle").checked,

    walletId:
      document.getElementById("investmentWallet").value
  };

  const updatedData = await apiRequest("addInvestment", data);

  renderDashboard(updatedData);

  event.target.reset();
  setDefaultDates();
  toggleInvestmentWallet();
  closeModal("investmentModal");
}

async function deleteWallet(walletId) {
  const confirmed = confirm("Delete this wallet?");

  if (!confirmed) return;

  const updatedData = await apiRequest("deleteWallet", {
    walletId
  });

  renderDashboard(updatedData);
}
