const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxh4MKET1DQa9y8fBu01zHTM414RXvIkvn1ifnlVPmEr8GLMCXsPQ1EHMf9hfei8p-v4Q/exec";

// Saved session token generated during system access unlock
let sessionAuthHash = "";
let lastEntryDate = null;
let transactionHistory = [];

// DOM UI Element Selectors
const loginScreen = document.getElementById("loginScreen");
const dashboardContent = document.getElementById("dashboardContent");
const modalOverlay = document.getElementById("modalOverlay");
const openModalBtn = document.getElementById("openModalBtn");
const closeModalBtn = document.getElementById("closeModalBtn");
const exportPdfBtn = document.getElementById("exportPdfBtn");

// --- Modal Open/Close Controls ---
openModalBtn.addEventListener("click", () => modalOverlay.classList.add("active"));
closeModalBtn.addEventListener("click", () => modalOverlay.classList.remove("active"));
modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) modalOverlay.classList.remove("active");
});
exportPdfBtn.addEventListener("click", exportToPDF);

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
      transactionHistory = data.history;
      renderTable(data.history);
    } else {
      transactionHistory = [];
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

// --- 4. EXPORT TRANSACTIONS TO PDF REPORT ---
async function exportToPDF() {
  if (!transactionHistory || transactionHistory.length === 0) {
    alert("No transaction data available to export.");
    return;
  }

  const exportBtn = document.getElementById("exportPdfBtn");
  const originalText = exportBtn.innerText;
  exportBtn.disabled = true;
  exportBtn.innerText = "⏳ Generating PDF...";

  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("p", "pt", "a4");

    // Load custom fonts from cdnjs to support Unicode Rupee symbol (₹)
    const fontRegularUrl = "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.12/fonts/Roboto/Roboto-Regular.ttf";
    const fontBoldUrl = "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.12/fonts/Roboto/Roboto-Medium.ttf";

    async function loadAndRegisterFont(url, name, style) {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`Failed to load font from ${url}`);
      const buf = await resp.arrayBuffer();
      const binaryString = new Uint8Array(buf).reduce((data, byte) => data + String.fromCharCode(byte), '');
      const base64String = btoa(binaryString);
      const vfsName = `${name}-${style}.ttf`;
      doc.addFileToVFS(vfsName, base64String);
      doc.addFont(vfsName, name, style);
    }

    // Load both regular and bold fonts asynchronously
    await loadAndRegisterFont(fontRegularUrl, "Roboto", "normal");
    await loadAndRegisterFont(fontBoldUrl, "Roboto", "bold");

    // Set default font to Roboto
    doc.setFont("Roboto", "normal");

    // Get dynamic page boundaries and grid dimensions
    const pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
    const margin = 40;

    // Compute stats metrics dynamically
    let totalCredit = 0;
    let totalDebit = 0;
    let finalBalance = 0;

    function cleanAndParse(value) {
      if (!value || value === "—" || value.toString().trim() === "") return null;
      const cleanNum = parseFloat(value.toString().replace(/[^\d.-]/g, ""));
      return isNaN(cleanNum) ? null : cleanNum;
    }

    transactionHistory.forEach((row) => {
      const cr = cleanAndParse(row.credit);
      const db = cleanAndParse(row.debit);
      if (cr !== null) totalCredit += cr;
      if (db !== null) totalDebit += Math.abs(db);
    });

    if (transactionHistory.length > 0) {
      const lastRow = transactionHistory[transactionHistory.length - 1];
      const lastBal = cleanAndParse(lastRow.balance);
      if (lastBal !== null) {
        finalBalance = lastBal;
      }
    }

    // --- DRAW PREMIUM HEADER ---
    doc.setFont("Roboto", "bold");
    doc.setFontSize(22);
    doc.setTextColor(34, 34, 34); // #222
    doc.text("Spent Report Ledger", margin, 50);

    doc.setFont("Roboto", "normal");
    doc.setFontSize(10);
    doc.setTextColor(119, 119, 119); // #777
    const timeString = new Date().toLocaleString();
    doc.text(`Generated on: ${timeString}`, margin, 68);

    doc.setDrawColor(224, 224, 224); // #e0e0e0
    doc.setLineWidth(1);
    doc.line(margin, 78, pageWidth - margin, 78);

    // --- SUMMARY METRICS CARD ---
    const cardY = 90;
    const cardHeight = 50;
    const cardWidth = pageWidth - margin * 2;

    // Background Box
    doc.setFillColor(248, 249, 250); // #f8f9fa
    doc.roundedRect(margin, cardY, cardWidth, cardHeight, 6, 6, "F");

    const colWidth = cardWidth / 3;

    // Inflows (Credits)
    doc.setFont("Roboto", "bold");
    doc.setFontSize(9);
    doc.setTextColor(102, 102, 102); // #666
    doc.text("TOTAL CREDITS (+)", margin + 15, cardY + 18);
    doc.setFont("Roboto", "bold");
    doc.setFontSize(12);
    doc.setTextColor(40, 167, 69); // --success (#28a745)
    doc.text(`₹${totalCredit.toFixed(2)}`, margin + 15, cardY + 38);

    // Outflows (Debits)
    doc.setFont("Roboto", "bold");
    doc.setFontSize(9);
    doc.setTextColor(102, 102, 102);
    doc.text("TOTAL DEBITS (-)", margin + colWidth + 15, cardY + 18);
    doc.setFont("Roboto", "bold");
    doc.setFontSize(12);
    doc.setTextColor(220, 53, 69); // --danger (#dc3545)
    doc.text(`₹${totalDebit.toFixed(2)}`, margin + colWidth + 15, cardY + 38);

    // Net Position
    doc.setFont("Roboto", "bold");
    doc.setFontSize(9);
    doc.setTextColor(102, 102, 102);
    doc.text("NET BALANCE", margin + colWidth * 2 + 15, cardY + 18);
    doc.setFont("Roboto", "bold");
    doc.setFontSize(12);
    doc.setTextColor(34, 34, 34); // #222
    doc.text(`₹${finalBalance.toFixed(2)}`, margin + colWidth * 2 + 15, cardY + 38);

    // --- TABULAR STATEMENT DATA ---
    const tableHeaders = [["Date", "Details", "Credit (+)", "Debit (-)", "Balance"]];
    const tableData = transactionHistory.map((row) => {
      const cr = cleanAndParse(row.credit);
      const db = cleanAndParse(row.debit);
      const bal = cleanAndParse(row.balance);

      return [
        row.date,
        row.details,
        cr !== null ? `₹${cr.toFixed(2)}` : "—",
        db !== null ? `₹${Math.abs(db).toFixed(2)}` : "—",
        bal !== null ? `₹${bal.toFixed(2)}` : "—"
      ];
    });

    doc.autoTable({
      head: tableHeaders,
      body: tableData,
      startY: cardY + cardHeight + 20,
      margin: { left: margin, right: margin },
      styles: {
        font: "Roboto",
        fontSize: 9,
        cellPadding: 7,
        valign: "middle"
      },
      headStyles: {
        fillColor: [74, 144, 226], // Matches var(--primary) #4a90e2
        textColor: 255,
        fontStyle: "bold",
      },
      columnStyles: {
        0: { cellWidth: 75, halign: "center" }, // Date
        1: { cellWidth: "auto", halign: "left" }, // Details
        2: { cellWidth: 85, halign: "right" }, // Credit
        3: { cellWidth: 85, halign: "right" }, // Debit
        4: { cellWidth: 95, halign: "right" }  // Balance
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252] // Sleek zebra shading
      }
    });

    // Add page numbers at the very end
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont("Roboto", "normal");
      doc.setFontSize(8);
      doc.setTextColor(153, 153, 153);
      doc.text(
        `Page ${i} of ${totalPages}`,
        pageWidth - margin - 50,
        pageHeight - 20
      );
      doc.text(
        "Confidential Financial Document",
        margin,
        pageHeight - 20
      );
    }

    const fileNameDate = new Date().toISOString().split("T")[0];
    doc.save(`spent-report-${fileNameDate}.pdf`);

  } catch (err) {
    console.error("PDF export failed:", err);
    alert("❌ Error: Unable to fetch PDF font packages or generate file.");
  } finally {
    exportBtn.disabled = false;
    exportBtn.innerText = originalText;
  }
}
