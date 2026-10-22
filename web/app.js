/* =========================================================
   NEOBANK MANAGEMENT SYSTEM - FRONTEND APP LOGIC
   Seamlessly integrated with Java Backend API
   ========================================================= */

// API Configuration: automatically uses same-origin or localhost:8080
const API_BASE = window.location.origin.includes('8080')
    ? window.location.origin
    : 'http://localhost:8080';

// State Management
let accounts = [];
let activeAccount = null;
let isBackendConnected = false;

// Default demo account (mirrors Java backend seed)
const DEMO_FALLBACK_ACCOUNTS = [
    {
        accountNumber: "1001",
        accountHolder: "Mariya Sharma",
        balance: 5500.0,
        dailyWithdrawalLimit: 10000.0,
        withdrawnToday: 500.0,
        remainingLimit: 9500.0,
        transactionCount: 3,
        transactions: [
            "Account opened: Rs. 5000.00",
            "Deposit +Rs. 1000.00 | Balance Rs. 6000.00",
            "Withdrawal -Rs. 500.00 | Balance Rs. 5500.00"
        ]
    }
];

// Initialize on DOM load
document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initCalendar();
    refreshBackendData();
    // Poll backend every 10 seconds to keep UI live
    setInterval(refreshBackendData, 10000);
});

// ==================== THEME MANAGEMENT ====================
function initTheme() {
    const savedTheme = localStorage.getItem("neobank_theme") || "dark";
    setTheme(savedTheme);
}

function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("neobank_theme", theme);

    const lightBtn = document.getElementById("themeLightBtn");
    const darkBtn = document.getElementById("themeDarkBtn");

    if (theme === "light") {
        lightBtn.classList.add("active");
        darkBtn.classList.remove("active");
    } else {
        darkBtn.classList.add("active");
        lightBtn.classList.remove("active");
    }
}

// ==================== CALENDAR WIDGET ====================
function initCalendar() {
    const now = new Date();
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    const dateStr = `${months[now.getMonth()]}, ${now.getDate()} ${days[now.getDay()]}`;
    const dateEl = document.getElementById("calendarDateText");
    if (dateEl) dateEl.textContent = dateStr;

    // Highlight current day in mini calendar
    const currentDayNum = now.getDate();
    const grid = document.getElementById("calDaysGrid");
    if (grid) {
        const spans = grid.querySelectorAll("span:not(.muted)");
        spans.forEach(span => {
            if (parseInt(span.textContent, 10) === currentDayNum) {
                span.classList.add("today-highlight");
            }
        });
    }
}

// ==================== BACKEND INTEGRATION ====================
async function checkBackendStatus() {
    try {
        const res = await fetch(`${API_BASE}/api/status`, { cache: 'no-store' });
        if (res.ok) {
            const data = await res.json();
            setBackendStatus(true, `🟢 Java Backend: Online (${data.accountsCount} Accs)`);
            return true;
        }
    } catch (err) {
        setBackendStatus(false, "🟡 Offline (Local Storage Mode)");
        return false;
    }
    return false;
}

function setBackendStatus(connected, message) {
    isBackendConnected = connected;
    const dot = document.getElementById("statusDot");
    const text = document.getElementById("backendStatusText");
    if (text) text.textContent = message;
    if (dot) {
        if (connected) {
            dot.classList.remove("offline");
            dot.classList.add("pulse");
        } else {
            dot.classList.add("offline");
            dot.classList.remove("pulse");
        }
    }
}

async function refreshBackendData() {
    try {
        const online = await checkBackendStatus();
        if (online) {
            const res = await fetch(`${API_BASE}/api/accounts`, { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                accounts = data;
                saveLocalCache(accounts);
            }
        } else {
            loadLocalCache();
        }
    } catch (err) {
        console.warn("Backend fetch failed, using cached accounts:", err);
        loadLocalCache();
    }

    if (accounts.length === 0) {
        accounts = JSON.parse(JSON.stringify(DEMO_FALLBACK_ACCOUNTS));
    }

    // Preserve active account or select first
    if (!activeAccount || !accounts.find(a => a.accountNumber === activeAccount.accountNumber)) {
        activeAccount = accounts[0];
    } else {
        activeAccount = accounts.find(a => a.accountNumber === activeAccount.accountNumber);
    }

    renderAll();
}

function saveLocalCache(accList) {
    localStorage.setItem("neobank_accounts", JSON.stringify(accList));
}

function loadLocalCache() {
    const cached = localStorage.getItem("neobank_accounts");
    if (cached) {
        try {
            accounts = JSON.parse(cached);
        } catch (e) {
            accounts = JSON.parse(JSON.stringify(DEMO_FALLBACK_ACCOUNTS));
        }
    } else {
        accounts = JSON.parse(JSON.stringify(DEMO_FALLBACK_ACCOUNTS));
    }
}

// ==================== RENDERING UI ====================
function renderAll() {
    renderAccountDropdown();
    renderActiveAccountData();
    renderAccountsTable();
}

function renderAccountDropdown() {
    const select = document.getElementById("accountDropdown");
    const depositSelect = document.getElementById("depositAccNumber");
    const withdrawSelect = document.getElementById("withdrawAccNumber");

    if (!select) return;

    let html = "";
    accounts.forEach(acc => {
        const isSelected = activeAccount && acc.accountNumber === activeAccount.accountNumber ? "selected" : "";
        html += `<option value="${acc.accountNumber}" ${isSelected}>#${acc.accountNumber} — ${acc.accountHolder}</option>`;
    });

    select.innerHTML = html;
    if (depositSelect) depositSelect.innerHTML = html;
    if (withdrawSelect) withdrawSelect.innerHTML = html;

    updateWithdrawalLimitsDisplay();
}

function onSelectAccount(accNum) {
    const found = accounts.find(a => a.accountNumber === accNum);
    if (found) {
        activeAccount = found;
        renderActiveAccountData();
    }
}

function renderActiveAccountData() {
    if (!activeAccount) return;

    const acc = activeAccount;
    const balance = acc.balance || 0;
    const limit = acc.dailyWithdrawalLimit || 10000;
    const withdrawn = acc.withdrawnToday || 0;
    const remaining = typeof acc.remainingLimit === 'number' ? acc.remainingLimit : Math.max(0, limit - withdrawn);

    // Hero Greeting
    const greetingEl = document.getElementById("welcomeGreeting");
    if (greetingEl) {
        const firstName = acc.accountHolder.split(" ")[0];
        greetingEl.textContent = `Good morning, ${firstName}`;
    }

    // Profile Right Card
    const profileGreet = document.getElementById("profileGreetText");
    const profileSub = document.getElementById("profileSubText");
    const profileInitials = document.getElementById("profileAvatarInitials");
    if (profileGreet) profileGreet.textContent = `Good morning, ${acc.accountHolder.split(" ")[0]}`;
    if (profileSub) profileSub.textContent = `Account #${acc.accountNumber} • Active`;
    if (profileInitials) {
        const parts = acc.accountHolder.split(" ");
        profileInitials.textContent = parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0].slice(0, 2).toUpperCase();
    }

    // Stat Cards
    const statBal = document.getElementById("statBalance");
    const statLimit = document.getElementById("statDailyLimit");
    const statWithdrawn = document.getElementById("statWithdrawnToday");
    if (statBal) statBal.textContent = formatCurrency(balance);
    if (statLimit) statLimit.textContent = formatCurrency(limit);
    if (statWithdrawn) statWithdrawn.textContent = formatCurrency(withdrawn);

    // Weekly Bars Header & Wave marker
    const barTotal = document.getElementById("barWeeklyTotal");
    const waveMarker = document.getElementById("waveActiveLabel");
    if (barTotal) barTotal.textContent = formatCurrency(balance);
    if (waveMarker) waveMarker.textContent = formatCurrency(balance);

    // Circular Gauge
    const percentLeft = Math.round((remaining / limit) * 100);
    const donutCircle = document.getElementById("donutProgressCircle");
    const donutPctText = document.getElementById("donutPercentText");
    const legendRemaining = document.getElementById("legendRemainingText");
    const legendUsed = document.getElementById("legendUsedText");

    if (donutPctText) donutPctText.textContent = `${percentLeft}%`;
    if (legendRemaining) legendRemaining.textContent = `Remaining: ${formatCurrency(remaining)}`;
    if (legendUsed) legendUsed.textContent = `Used: ${formatCurrency(withdrawn)}`;

    if (donutCircle) {
        // Circumference for r=40 is 2 * PI * 40 = 251.32
        const c = 251.32;
        const offset = c - (percentLeft / 100) * c;
        donutCircle.style.strokeDashoffset = offset;
    }

    // Details Modal Fields
    const detailAvatar = document.getElementById("detailAvatarInitials");
    const detailHolder = document.getElementById("detailHolderName");
    const detailNum = document.getElementById("detailAccountNumber");
    const detailBal = document.getElementById("detailBalance");
    const detailLim = document.getElementById("detailLimit");
    const detailWith = document.getElementById("detailWithdrawnToday");
    const detailRem = document.getElementById("detailRemainingLimit");

    if (detailAvatar && profileInitials) detailAvatar.textContent = profileInitials.textContent;
    if (detailHolder) detailHolder.textContent = acc.accountHolder;
    if (detailNum) detailNum.textContent = `Account #${acc.accountNumber}`;
    if (detailBal) detailBal.textContent = formatCurrency(balance);
    if (detailLim) detailLim.textContent = formatCurrency(limit);
    if (detailWith) detailWith.textContent = formatCurrency(withdrawn);
    if (detailRem) detailRem.textContent = formatCurrency(remaining);

    // Recent Transactions in Center Card
    renderTransactionsList(acc);
}

function renderTransactionsList(acc) {
    const listEl = document.getElementById("recentTransactionsList");
    const fullListEl = document.getElementById("txHistoryFullList");
    const titleEl = document.getElementById("txHistoryAccTitle");

    if (titleEl) titleEl.textContent = `#${acc.accountNumber} — ${acc.accountHolder}`;

    const txs = acc.transactions || [];

    if (!listEl) return;

    if (txs.length === 0) {
        listEl.innerHTML = `<div style="padding: 10px; font-size: 11.5px; color: var(--text-muted);">No transactions recorded yet.</div>`;
        if (fullListEl) fullListEl.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--text-muted);">No transactions found for this account.</div>`;
        return;
    }

    // Render Recent (up to 3 items)
    let recentHtml = "";
    const recentTxs = txs.slice(-3).reverse();
    recentTxs.forEach(tx => {
        let iconType = "deposit-icon";
        let iconSvg = `<line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>`;
        let title = "Transaction";

        if (tx.includes("Deposit")) {
            iconType = "deposit-icon";
            title = "Cash Deposit";
            iconSvg = `<line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>`;
        } else if (tx.includes("Withdrawal")) {
            iconType = "withdraw-icon";
            title = "Withdrawal";
            iconSvg = `<line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>`;
        } else if (tx.includes("opened")) {
            iconType = "create-icon";
            title = "Account Opened";
            iconSvg = `<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>`;
        }

        recentHtml += `
            <div class="tx-item" onclick="openModal('transactionsModal')">
                <div class="tx-icon-box ${iconType}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${iconSvg}</svg>
                </div>
                <div class="tx-details">
                    <span class="tx-title">${title}</span>
                    <span class="tx-time">${escapeHtml(tx)}</span>
                </div>
                <div class="tx-arrow">&rsaquo;</div>
            </div>
        `;
    });
    listEl.innerHTML = recentHtml;

    // Render Full List for Modal
    if (fullListEl) {
        let fullHtml = "";
        [...txs].reverse().forEach((tx, idx) => {
            let badgeClass = "opened";
            if (tx.includes("Deposit")) badgeClass = "deposit";
            if (tx.includes("Withdrawal")) badgeClass = "withdrawal";

            fullHtml += `
                <div class="tx-log-row">
                    <div>
                        <span class="tx-log-type ${badgeClass}">● ${badgeClass.toUpperCase()}</span>
                        <div style="margin-top: 4px; color: var(--text-primary); font-size: 13px;">${escapeHtml(tx)}</div>
                    </div>
                    <span style="font-size: 11px; color: var(--text-muted);">#${txs.length - idx}</span>
                </div>
            `;
        });
        fullListEl.innerHTML = fullHtml;
    }
}

function renderAccountsTable() {
    const tbody = document.getElementById("accountsTableBody");
    if (!tbody) return;

    let html = "";
    accounts.forEach(acc => {
        html += `
            <tr>
                <td><strong>#${acc.accountNumber}</strong></td>
                <td>${escapeHtml(acc.accountHolder)}</td>
                <td><strong class="accent-text">${formatCurrency(acc.balance)}</strong></td>
                <td>${formatCurrency(acc.dailyWithdrawalLimit || 10000)}</td>
                <td>${formatCurrency(acc.withdrawnToday || 0)}</td>
                <td>
                    <button class="table-btn" onclick="selectAndCloseAccounts('${acc.accountNumber}')">Select</button>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

function selectAndCloseAccounts(accNum) {
    onSelectAccount(accNum);
    closeModal("accountsModal");
    showToast(`Switched to account #${accNum}`, "info");
}

function updateWithdrawalLimitsDisplay() {
    const select = document.getElementById("withdrawAccNumber");
    if (!select) return;
    const accNum = select.value;
    const acc = accounts.find(a => a.accountNumber === accNum) || activeAccount;

    const modalBal = document.getElementById("withdrawModalBalance");
    const modalRem = document.getElementById("withdrawModalRemaining");

    if (acc && modalBal && modalRem) {
        const remaining = typeof acc.remainingLimit === 'number'
            ? acc.remainingLimit
            : Math.max(0, (acc.dailyWithdrawalLimit || 10000) - (acc.withdrawnToday || 0));
        modalBal.textContent = formatCurrency(acc.balance);
        modalRem.textContent = formatCurrency(remaining);
    }
}

// ==================== BANKING FORM HANDLERS ====================

// 1. Create Account
async function handleCreateAccount(e) {
    e.preventDefault();
    const number = document.getElementById("createAccNumber").value.trim();
    const holder = document.getElementById("createAccHolder").value.trim();
    const balance = parseFloat(document.getElementById("createAccBalance").value);

    if (!number || !holder) {
        showToast("Account number and holder name are required.", "error");
        return;
    }
    if (isNaN(balance) || balance < 0) {
        showToast("Opening balance must be 0 or greater.", "error");
        return;
    }

    const submitBtn = document.getElementById("createAccountSubmitBtn");
    submitBtn.disabled = true;

    if (isBackendConnected) {
        try {
            const res = await fetch(`${API_BASE}/api/accounts`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    accountNumber: number,
                    accountHolder: holder,
                    openingBalance: balance
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                showToast("Account created successfully in Java Backend!", "success");
                closeModal("createAccountModal");
                document.getElementById("createAccountForm").reset();
                await refreshBackendData();
                onSelectAccount(number);
            } else {
                showToast(data.message || "Failed to create account", "error");
            }
        } catch (err) {
            showToast("Server error: " + err.message, "error");
        } finally {
            submitBtn.disabled = false;
        }
    } else {
        // Local Mode Fallback
        if (accounts.some(a => a.accountNumber === number)) {
            showToast("Account number already exists.", "error");
            submitBtn.disabled = false;
            return;
        }

        const newAcc = {
            accountNumber: number,
            accountHolder: holder,
            balance: balance,
            dailyWithdrawalLimit: 10000.0,
            withdrawnToday: 0.0,
            remainingLimit: 10000.0,
            transactionCount: 1,
            transactions: [`Account opened: Rs. ${balance.toFixed(2)}`]
        };

        accounts.push(newAcc);
        saveLocalCache(accounts);
        activeAccount = newAcc;
        renderAll();
        closeModal("createAccountModal");
        document.getElementById("createAccountForm").reset();
        showToast("Account created in local mode!", "success");
        submitBtn.disabled = false;
    }
}

// 2. Deposit Money
async function handleDeposit(e) {
    e.preventDefault();
    const number = document.getElementById("depositAccNumber").value;
    const amount = parseFloat(document.getElementById("depositAmount").value);

    if (!number) {
        showToast("Please select an account.", "error");
        return;
    }
    if (isNaN(amount) || amount <= 0) {
        showToast("Deposit amount must be greater than zero.", "error");
        return;
    }

    const submitBtn = document.getElementById("depositSubmitBtn");
    submitBtn.disabled = true;

    if (isBackendConnected) {
        try {
            const res = await fetch(`${API_BASE}/api/deposit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    accountNumber: number,
                    amount: amount
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                showToast(`Successfully deposited ${formatCurrency(amount)}!`, "success");
                closeModal("depositModal");
                document.getElementById("depositForm").reset();
                await refreshBackendData();
                onSelectAccount(number);
            } else {
                showToast(data.message || "Deposit failed", "error");
            }
        } catch (err) {
            showToast("Server error: " + err.message, "error");
        } finally {
            submitBtn.disabled = false;
        }
    } else {
        // Local Mode
        const acc = accounts.find(a => a.accountNumber === number);
        if (!acc) {
            showToast("Account not found", "error");
            submitBtn.disabled = false;
            return;
        }

        acc.balance += amount;
        acc.transactions = acc.transactions || [];
        acc.transactions.push(`Deposit +Rs. ${amount.toFixed(2)} | Balance Rs. ${acc.balance.toFixed(2)}`);
        saveLocalCache(accounts);
        renderAll();
        closeModal("depositModal");
        document.getElementById("depositForm").reset();
        showToast(`Deposited ${formatCurrency(amount)} locally!`, "success");
        submitBtn.disabled = false;
    }
}

// 3. Withdraw Money
async function handleWithdraw(e) {
    e.preventDefault();
    const number = document.getElementById("withdrawAccNumber").value;
    const amount = parseFloat(document.getElementById("withdrawAmount").value);

    if (!number) {
        showToast("Please select an account.", "error");
        return;
    }
    if (isNaN(amount) || amount <= 0) {
        showToast("Withdrawal amount must be greater than zero.", "error");
        return;
    }

    const submitBtn = document.getElementById("withdrawSubmitBtn");
    submitBtn.disabled = true;

    if (isBackendConnected) {
        try {
            const res = await fetch(`${API_BASE}/api/withdraw`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    accountNumber: number,
                    amount: amount
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                showToast(`Successfully withdrew ${formatCurrency(amount)}!`, "success");
                closeModal("withdrawModal");
                document.getElementById("withdrawForm").reset();
                await refreshBackendData();
                onSelectAccount(number);
            } else {
                showToast(data.message || "Withdrawal failed", "error");
            }
        } catch (err) {
            showToast("Server error: " + err.message, "error");
        } finally {
            submitBtn.disabled = false;
        }
    } else {
        // Local Mode
        const acc = accounts.find(a => a.accountNumber === number);
        if (!acc) {
            showToast("Account not found", "error");
            submitBtn.disabled = false;
            return;
        }

        if (amount > acc.balance) {
            showToast(`Insufficient balance. Current balance: ${formatCurrency(acc.balance)}`, "error");
            submitBtn.disabled = false;
            return;
        }

        const remainingLimit = (acc.dailyWithdrawalLimit || 10000) - (acc.withdrawnToday || 0);
        if (amount > remainingLimit) {
            showToast(`Daily withdrawal limit exceeded! Remaining limit today: ${formatCurrency(remainingLimit)}`, "error");
            submitBtn.disabled = false;
            return;
        }

        acc.balance -= amount;
        acc.withdrawnToday = (acc.withdrawnToday || 0) + amount;
        acc.remainingLimit = Math.max(0, (acc.dailyWithdrawalLimit || 10000) - acc.withdrawnToday);
        acc.transactions = acc.transactions || [];
        acc.transactions.push(`Withdrawal -Rs. ${amount.toFixed(2)} | Balance Rs. ${acc.balance.toFixed(2)}`);

        saveLocalCache(accounts);
        renderAll();
        closeModal("withdrawModal");
        document.getElementById("withdrawForm").reset();
        showToast(`Withdrew ${formatCurrency(amount)} locally!`, "success");
        submitBtn.disabled = false;
    }
}

// ==================== SEARCH & NAVIGATION ====================
function handleSearch(query) {
    query = query.toLowerCase().trim();
    if (!query) return;

    const matched = accounts.find(a =>
        a.accountNumber.toLowerCase().includes(query) ||
        a.accountHolder.toLowerCase().includes(query)
    );

    if (matched) {
        onSelectAccount(matched.accountNumber);
        document.getElementById("accountDropdown").value = matched.accountNumber;
    }
}

function switchNav(viewName) {
    document.querySelectorAll(".nav-item").forEach(item => {
        item.classList.remove("active");
        if (item.getAttribute("data-view") === viewName) {
            item.classList.add("active");
        }
    });

    if (viewName === "accounts") {
        openModal("accountsModal");
    } else if (viewName === "tracking" || viewName === "dashboard" || viewName === "analytics") {
        showToast(`Switched to ${viewName.toUpperCase()} view`, "info");
    }
}

// ==================== MODAL HELPERS ====================
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add("active");
        if (modalId === "withdrawModal") updateWithdrawalLimitsDisplay();
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove("active");
    }
}

// Close modal when clicking outside modal-card
window.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal-overlay")) {
        e.target.classList.remove("active");
    }
});

// Close modal on ESC key
window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        document.querySelectorAll(".modal-overlay.active").forEach(m => m.classList.remove("active"));
    }
});

// ==================== UTILITIES ====================
function formatCurrency(amount) {
    return `₹${parseFloat(amount || 0).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}

function escapeHtml(str) {
    if (!str) return "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function showToast(message, type = "info") {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;

    let icon = "ℹ️";
    if (type === "success") icon = "✅";
    if (type === "error") icon = "⚠️";

    toast.innerHTML = `<span>${icon}</span><span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(20px)";
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}
