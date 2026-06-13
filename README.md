# Spent Report Dashboard

A secure, high-performance financial transaction ledger dashboard. The application provides an interactive client-side dashboard for tracking ledger transactions (Credits and Debits) connected to a Google Sheets backend via Google Apps Script.

## Features

- **🔒 Secure Access Control**: Master Password security panel hashes credentials client-side using `CryptoJS` (SHA-256) before transmitting validation tokens to the backend.
- **📊 Interactive Transaction Ledger**: Live transaction matrix showing transaction dates, details, credits, debits, and running balance calculation.
- **📄 Export to PDF**: Premium client-side reporting system that compiles the ledger table into a printable PDF report.
  - **Auto-calculation**: Sums all credits (inflow) and debits (outflow) to display a summary header block.
  - **Sleek Layout**: Columns are styled (amount columns right-aligned, dates centered) with alternating zebra row striping.
  - **Dynamic Footer**: Formats multi-page exports with page numbering (e.g., "Page X of Y") and confidentiality labeling.
- **⚡ Offline-first / Static Deployment**: Pure HTML/CSS/JS architecture that runs directly in any modern browser without complex local environments.

## Tech Stack

- **Frontend**: Semantic HTML5, Vanilla CSS3 (Custom Variables, Flexbox, Micro-animations), and modern ES6 Javascript.
- **Libraries**:
  - `CryptoJS`: For hashing credentials client-side.
  - `jsPDF` (v2.5.1): For generating PDFs client-side.
  - `jsPDF-AutoTable` (v3.5.25): Custom layout engine for exporting styled tabular reports.
- **Backend API**: Google Apps Script (handling secure persistence, date-validations, and spreadsheet sync).

## Getting Started

1. Clone this repository to your local machine:
   ```bash
   git clone <repository-url>
   ```
2. Open `index.html` in any web browser to run the application.
3. Enter your system access Master Password to unlock the ledger database.
