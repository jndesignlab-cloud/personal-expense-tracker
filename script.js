const API_URL = "https://script.google.com/macros/s/AKfycbx-uxb0M6FAePCy1TAddnPTlrFiGXO43dw78famDaQ5YmvJsHC2S2IISOlnQZP18Wg/exec";

let dashboardData = null;

document.addEventListener("DOMContentLoaded", () => {
  setDefaultDates();
  loadDashboard();
});

/* =========================================
   DEFAULT DATES
========================================= */

function setDefaultDates() {
  const today = new Date().toISOString().split("T")[0];

  [
    "expenseDate",
    "transferDate",
    "addMoneyDate",
    "investmentDate"
  ].forEach(id => {
    const el = document.getElementById(id);

    if (el) {
      el.value = today;
    }
  });
}

/* =========================================
   FORMAT
========================================= */

function peso(value) {
  const amount = Number(value) || 0;

  return amount.toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP"
  });
}

/* =========================================
   API REQUEST
========================================= */

async function apiRequest(action, payload = {}) {

  const response = await fetch(API_URL, {
    method: "POST",

    body: JSON.stringify({
      action,
      payload
    })
  });

  return await response.json();
}

/* =========================================
   LOAD DASHBOARD
========================================= */

async function loadDashboard() {

  const data =
    await apiRequest(
      "getDashboardData"
    );

  renderDashboard(data);

}

/* =========================================
   RENDER DASHBOARD
========================================= */

function renderDashboard(data) {

  dashboardData = data;

  /* ======================
     TOTAL MONEY
  ====================== */

  document.getElementById(
    "totalMoneyOwned"
  ).textContent =
    peso(data.stats.totalMoneyOwned);

  document.getElementById(
    "totalMoneyOwnedSub"
  ).textContent =
    `Wallets: ${peso(data.stats.totalWalletBalance)} + Investments: ${peso(data.stats.totalInvested)}`;

  /* ======================
     DAILY
  ====================== */

  document.getElementById(
    "todayRemaining"
  ).textContent =
    peso(data.stats.todayRemaining);

  document.getElementById(
    "todaySpent"
  ).textContent =
    `Spent today: ${peso(data.stats.todaySpent)} / ${peso(data.stats.dailyBudget)}`;

  /* ======================
     TRANSPORT
  ====================== */

  document.getElementById(
    "transportRemaining"
  ).textContent =
    peso(data.stats.todayTransportRemaining);

  document.getElementById(
    "transportSpent"
  ).textContent =
    `Spent: ${peso(data.stats.todayTransportSpent)} / ${peso(data.settings.dailyTransport)}`;

  /* ======================
     FOOD
  ====================== */

  document.getElementById(
    "foodRemaining"
  ).textContent =
    peso(data.stats.todayFoodRemaining);

  document.getElementById(
    "foodSpent"
  ).textContent =
    `Spent: ${peso(data.stats.todayFoodSpent)} / ${peso(data.settings.dailyFood)}`;

  /* ======================
     WEEKLY
  ====================== */

  document.getElementById(
    "weekRemaining"
  ).textContent =
    peso(data.stats.weekRemaining);

  document.getElementById(
    "weekSpent"
  ).textContent =
    `Spent this week: ${peso(data.stats.weekSpent)} / ${peso(data.stats.weeklyBudget)}`;

  /* ======================
     MONTH DAYS
  ====================== */

  document.getElementById(
    "budgetDaysThisMonth"
  ).textContent =
    `${data.stats.budgetDaysThisMonth} days`;

  /* ======================
     WALLET TOTAL
  ====================== */

  document.getElementById(
    "totalWalletBalance"
  ).textContent =
    peso(data.stats.totalWalletBalance);

  /* ======================
     INVESTMENTS
  ====================== */

  document.getElementById(
    "totalInvested"
  ).textContent =
    peso(data.stats.totalInvested);

  /* ======================
     DEBTS
  ====================== */

  document.getElementById(
    "debtReceivable"
  ).textContent =
    `${peso(data.stats.totalDebts)} / ${peso(data.stats.totalReceivables)}`;

  /* ======================
     TABLES
  ====================== */

  renderWallets(data.wallets);

  renderWalletDropdowns(data.wallets);

  renderExpenses(data.recentExpenses);

  renderInvestments(data.investments);

}

/* =========================================
   WALLET TABLE
========================================= */

function renderWallets(wallets) {

  const container =
    document.getElementById(
      "walletList"
    );

  container.innerHTML = "";

  if (!wallets.length) {

    container.innerHTML =
      `<p class="subtext">No wallets yet.</p>`;

    return;

  }

  wallets.forEach(wallet => {

    const item =
      document.createElement("div");

    item.className = "wallet-item";

    item.innerHTML = `
      <div>
        <strong>${wallet.name}</strong>

        <span>
          ${wallet.type}
          ${wallet.notes ? " · " + wallet.notes : ""}
        </span>
      </div>

      <div class="wallet-actions">

        <div class="amount">
          ${peso(wallet.balance)}
        </div>

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

/* =========================================
   WALLET DROPDOWNS
========================================= */

function renderWalletDropdowns(wallets) {

  const dropdownIds = [

    "expenseWallet",
    "fromWallet",
    "toWallet",
    "addMoneyWallet",
    "adjustWallet"

  ];

  dropdownIds.forEach(id => {

    const select =
      document.getElementById(id);

    if (!select) return;

    select.innerHTML =
      `<option value="">Select wallet</option>`;

    wallets.forEach(wallet => {

      const option =
        document.createElement("option");

      option.value = wallet.id;

      option.textContent =
        `${wallet.name} — ${peso(wallet.balance)}`;

      select.appendChild(option);

    });

  });

}

/* =========================================
   EXPENSE TABLE
========================================= */

function renderExpenses(expenses) {

  const container =
    document.getElementById(
      "expenseList"
    );

  container.innerHTML = "";

  if (!expenses.length) {

    container.innerHTML =
      `<p class="subtext">No expenses yet.</p>`;

    return;

  }

  expenses.forEach(exp => {

    const item =
      document.createElement("div");

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
          ·
          ${exp.walletName}
          ·
          ${budgetTag}
        </span>

      </div>

      <div class="amount">
        -${peso(exp.totalAmount)}
      </div>
    `;

    container.appendChild(item);

  });

}

/* =========================================
   INVESTMENTS TABLE
========================================= */

function renderInvestments(investments) {

  const container =
    document.getElementById(
      "investmentList"
    );

  container.innerHTML = "";

  if (!investments || !investments.length) {

    container.innerHTML =
      `<p class="subtext">No investments yet.</p>`;

    return;

  }

  investments.forEach(inv => {

    const item =
      document.createElement("div");

    item.className = "transaction-item";

    item.innerHTML = `
      <div>

        <strong>${inv.platform}</strong>

        <span>
          ${inv.description || "No description"}
        </span>

      </div>

      <div class="amount">
        ${peso(inv.amount)}
      </div>
    `;

    container.appendChild(item);

  });

}

/* =========================================
   MODALS
========================================= */

function openModal(id) {

  document
    .getElementById(id)
    .classList
    .add("active");

}

function closeModal(id) {

  document
    .getElementById(id)
    .classList
    .remove("active");

}

/* =========================================
   TOGGLE BUDGET
========================================= */

function toggleBudgetType() {

  const checked =
    document.getElementById(
      "deductBudget"
    ).checked;

  const wrap =
    document.getElementById(
      "budgetTypeWrap"
    );

  if (checked) {

    wrap.classList.remove("hidden");

    document
      .getElementById("budgetType")
      .required = true;

  } else {

    wrap.classList.add("hidden");

    document
      .getElementById("budgetType")
      .required = false;

    document
      .getElementById("budgetType")
      .value = "";

  }

}

/* =========================================
   SUBMIT EXPENSE
========================================= */

async function submitExpense(event) {

  event.preventDefault();

  const data = {

    date:
      document.getElementById(
        "expenseDate"
      ).value,

    category:
      document.getElementById(
        "expenseCategory"
      ).value,

    description:
      document.getElementById(
        "expenseDescription"
      ).value,

    amount:
      Number(
        document.getElementById(
          "expenseAmount"
        ).value
      ),

    taxAmount:
      Number(
        document.getElementById(
          "expenseTax"
        ).value
      ) || 0,

    walletId:
      document.getElementById(
        "expenseWallet"
      ).value,

    deductBudget:
      document.getElementById(
        "deductBudget"
      ).checked,

    budgetType:
      document.getElementById(
        "budgetType"
      ).value

  };

  const updatedData =
    await apiRequest(
      "addExpense",
      data
    );

  renderDashboard(updatedData);

  event.target.reset();

  setDefaultDates();

  toggleBudgetType();

  closeModal("expenseModal");

}

/* =========================================
   SUBMIT TRANSFER
========================================= */

async function submitTransfer(event) {

  event.preventDefault();

  const fromWalletId =
    document.getElementById(
      "fromWallet"
    ).value;

  const toWalletId =
    document.getElementById(
      "toWallet"
    ).value;

  if (fromWalletId === toWalletId) {

    alert(
      "From wallet and To wallet cannot be the same."
    );

    return;

  }

  const data = {

    date:
      document.getElementById(
        "transferDate"
      ).value,

    fromWalletId,

    toWalletId,

    amount:
      Number(
        document.getElementById(
          "transferAmount"
        ).value
      ),

    notes:
      document.getElementById(
        "transferNotes"
      ).value

  };

  const updatedData =
    await apiRequest(
      "transferWallet",
      data
    );

  renderDashboard(updatedData);

  event.target.reset();

  setDefaultDates();

  closeModal("transferModal");

}

/* =========================================
   ADD MONEY
========================================= */

async function submitAddMoney(event) {

  event.preventDefault();

  const data = {

    date:
      document.getElementById(
        "addMoneyDate"
      ).value,

    walletId:
      document.getElementById(
        "addMoneyWallet"
      ).value,

    amount:
      Number(
        document.getElementById(
          "addMoneyAmount"
        ).value
      ),

    source:
      document.getElementById(
        "addMoneySource"
      ).value,

    notes:
      document.getElementById(
        "addMoneyNotes"
      ).value

  };

  const updatedData =
    await apiRequest(
      "addMoney",
      data
    );

  renderDashboard(updatedData);

  event.target.reset();

  setDefaultDates();

  closeModal("addMoneyModal");

}

/* =========================================
   ADD WALLET
========================================= */

async function submitWallet(event) {

  event.preventDefault();

  const data = {

    walletName:
      document.getElementById(
        "walletName"
      ).value,

    walletType:
      document.getElementById(
        "walletType"
      ).value,

    balance:
      Number(
        document.getElementById(
          "walletBalance"
        ).value
      ) || 0,

    notes:
      document.getElementById(
        "walletNotes"
      ).value

  };

  const updatedData =
    await apiRequest(
      "addWallet",
      data
    );

  renderDashboard(updatedData);

  event.target.reset();

  closeModal("walletModal");

}

/* =========================================
   BALANCE CORRECTION
========================================= */

async function submitBalanceCorrection(event) {

  event.preventDefault();

  const data = {

    walletId:
      document.getElementById(
        "adjustWallet"
      ).value,

    actualBalance:
      Number(
        document.getElementById(
          "adjustAmount"
        ).value
      ),

    reason:
      document.getElementById(
        "adjustReason"
      ).value

  };

  const updatedData =
    await apiRequest(
      "adjustWalletBalance",
      data
    );

  renderDashboard(updatedData);

  event.target.reset();

  closeModal("adjustWalletModal");

}

/* =========================================
   ADD INVESTMENT
========================================= */

async function submitInvestment(event) {

  event.preventDefault();

  const data = {

    date:
      document.getElementById(
        "investmentDate"
      ).value,

    platform:
      document.getElementById(
        "investmentPlatform"
      ).value,

    description:
      document.getElementById(
        "investmentDescription"
      ).value,

    amount:
      Number(
        document.getElementById(
          "investmentAmount"
        ).value
      )

  };

  const updatedData =
    await apiRequest(
      "addInvestment",
      data
    );

  renderDashboard(updatedData);

  event.target.reset();

  setDefaultDates();

  closeModal("investmentModal");

}

/* =========================================
   DELETE WALLET
========================================= */

async function deleteWallet(walletId) {

  const confirmed =
    confirm("Delete this wallet?");

  if (!confirmed) return;

  const updatedData =
    await apiRequest(
      "deleteWallet",
      { walletId }
    );

  renderDashboard(updatedData);

}
