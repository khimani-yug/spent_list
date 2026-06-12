const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxh4MKET1DQa9y8fBu01zHTM414RXvIkvn1ifnlVPmEr8GLMCXsPQ1EHMf9hfei8p-v4Q/exec";

// Saved session token generated during system access unlock
let sessionAuthHash = "";
let lastEntryDate = null;

// DOM UI Element Selectors
const loginScreen = document.getElementById("loginScreen");
const dashboardContent = document.getElementById("dashboardContent");
const modalOverlay = document.getElementById("modalOverlay");
const openModalBtn = document.getElementById("openModalBtn");
const closeModalBtn = document.getElementById("closeModalBtn");

// --- Modal Open/Close Controls ---
openModalBtn.addEventListener("click", () => modalOverlay.classList.add("active"));
closeModalBtn.addEventListener("click", () => modalOverlay.classList.remove("active"));
modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) modalOverlay.classList.remove("active");
});

// --- 1. HANDLE MASTER PORTAL ACCESS LOCK SUBMISSION ---
document.getElementById("loginForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  const inputPassword = document.getElementById("masterPassword").value;
  const unlockBtn = document.getElementById("unlockBtn");
  const passwordInput = document.getElementById("masterPassword");

  // Disable inputs and show loading state
  unlockBtn.disabled = true;
  unlockBtn.innerText = "Unlocking...";
  passwordInput.disabled = true;

  // Immediately generate a secure SHA-256 string out of input text
  sessionAuthHash = CryptoJS.SHA256(inputPassword).toString();

  // Fire system load initialization routine using current cipher key signature
  const success = await initPortal();

  // If validation failed, re-enable form controls
  if (!success) {
    unlockBtn.disabled = false;
    unlockBtn.innerText = "Unlock System";
    passwordInput.disabled = false;
    passwordInput.focus();
  }
});

// --- 2. RUN PORTAL INITIALIZATION ROUTINE ---
async function initPortal() {
  const statusBox = document.getElementById("statusBox");
  const dateInput = document.getElementById("date");
  const submitBtn = document.getElementById("submitBtn");

  try {
    // Send signature to backend via secure API query string parameters validation checkpoint
    const response = await fetch(`${SCRIPT_URL}?authHash=${sessionAuthHash}`);
    const data = await response.json();

    // Handle login reject anomalies gracefully
    if (data.status === "error") {
      alert("❌ Security Verification Refused: Incorrect Access Key.");
      sessionAuthHash = ""; // Clear out broken memory signature string
      document.getElementById("masterPassword").value = ""; // Reset box
      return false;
    }

    // If valid: Hide login cover sheet element dynamically
    loginScreen.style.opacity = "0";
    setTimeout(() => loginScreen.style.display = "none", 250);
    
    // Reveal main data wrapper elements
    dashboardContent.classList.add("authorized");

    // Build out rows inside dashboard ledger table component
    if (data.history && data.history.length > 0) {
      renderTable(data.history);
    } else {
      document.getElementById("ledgerBody").innerHTML =
        `<tr><td colspan="5" style="text-align: center; color: #888; padding: 20px;">No transactions logged yet.</td></tr>`;
    }

    // Apply timeline locking mechanisms onto calendar form field input bounding targets
    if (data.lastDate) {
      lastEntryDate = new Date(data.lastDate);

      if (lastEntryDate && !isNaN(lastEntryDate.getTime())) {
        lastEntryDate.setHours(0, 0, 0, 0);
        statusBox.innerText = `Last locked entry date: ${data.lastDate}`;

        const year = lastEntryDate.getFullYear();
        const month = String(lastEntryDate.getMonth() + 1).padStart(2, "0");
        const day = String(lastEntryDate.getDate()).padStart(2, "0");
        dateInput.min = `${year}-${month}-${day}`;
      }
    } else {
      statusBox.innerText = "Ready for initial row baseline registration.";
    }

    dateInput.disabled = false;
    submitBtn.disabled = false;
    return true;
  } catch (err) {
    alert("❌ Network Error: Unable to complete authentication loop handshake routing.");
    console.error(err);
    document.getElementById("masterPassword").value = ""; // Reset box
    return false;
  }
}

// Process transaction data mapping cleanly onto DOM elements
function renderTable(history) {
  const tbody = document.getElementById("ledgerBody");
  tbody.innerHTML = "";

  history.forEach((row) => {
    const tr = document.createElement("tr");

    function cleanAndParse(value) {
      if (!value || value === "—" || value.toString().trim() === "") return null;
      const cleanNum = parseFloat(value.toString().replace(/[^\d.-]/g, ""));
      return isNaN(cleanNum) ? null : cleanNum;
    }

    const creditNum = cleanAndParse(row.credit);
    const debitNum = cleanAndParse(row.debit);
    const balanceNum = cleanAndParse(row.balance);

    const creditDisplay = creditNum !== null ? `<span class="credit-text">₹${creditNum.toFixed(2)}</span>` : "—";
    const debitDisplay = debitNum !== null ? `<span class="debit-text">₹${Math.abs(debitNum).toFixed(2)}</span>` : "—";
    const balanceDisplay = balanceNum !== null ? `<span class="balance-text">₹${balanceNum.toFixed(2)}</span>` : "—";

    tr.innerHTML = `
          <td><b>${row.date}</b></td>
          <td>${row.details}</td>
          <td>${creditDisplay}</td>
          <td>${debitDisplay}</td>
          <td>${balanceDisplay}</td>
      `;
    tbody.appendChild(tr);
  });
}

// Check transaction dates against database logs timeline in real-time
document.getElementById("date").addEventListener("change", function () {
  if (!lastEntryDate) return;

  const chosenDate = new Date(this.value);
  chosenDate.setHours(0, 0, 0, 0);

  const errorMsg = document.getElementById("dateError");
  const submitBtn = document.getElementById("submitBtn");

  if (chosenDate < lastEntryDate) {
    errorMsg.style.display = "block";
    submitBtn.disabled = true;
  } else {
    errorMsg.style.display = "none";
    submitBtn.disabled = false;
  }
});

// --- 3. SUBMIT TRANSACTION PAYLOAD WITH RE-PASSED TOKEN KEY ---
document.getElementById("transactionForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const submitBtn = document.getElementById("submitBtn");
  submitBtn.disabled = true;
  submitBtn.innerText = "Pushing data...";

  const payload = {
    date: document.getElementById("date").value,
    type: document.getElementById("type").value,
    title: document.getElementById("title").value,
    amount: parseFloat(document.getElementById("amount").value),
    authHash: sessionAuthHash // 👈 Reuses the token saved during system startup authorization!
  };

  try {
    const response = await fetch(SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const result = await response.json();

    if (result.status === "success") {
      alert("🎉 Row appended and statement calculation refreshed!");
      location.reload();
    } else {
      alert("Refused: " + result.message);
      submitBtn.innerText = "Save Transaction";
      submitBtn.disabled = false;
    }
  } catch (err) {
    alert("Network communications transmission error.");
    submitBtn.innerText = "Save Transaction";
    submitBtn.disabled = false;
  }
});
