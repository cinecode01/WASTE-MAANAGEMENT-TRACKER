let wasteChart = null;

document.addEventListener('DOMContentLoaded', () => {
  // Set default date picker value to today
  document.getElementById('date').value = new Date().toISOString().split('T')[0];

  // Fetch initial state
  loadDashboard();
  loadLogs();

  // Attach form submit handler
  document.getElementById('wasteForm').addEventListener('submit', handleFormSubmit);
});

// Fetch Dashboard Metrics
// Find this inside public/app.js and update loadDashboard:
async function loadDashboard() {
  try {
    const res = await fetch('/api/dashboard');
    const data = await res.json();

    document.getElementById('greenScore').innerText = `${data.metrics.greenScore} / 100`;
    document.getElementById('properPct').innerText = `${data.metrics.properProcessPercentage}%`;
    document.getElementById('recyclePct').innerText = `${data.metrics.recyclePercentage}%`;
    document.getElementById('totalWaste').innerText = `${data.metrics.totalWasteKg} kg`;

    // Updates the progress bar fill width
    const progressBar = document.getElementById('greenProgressBar');
    if (progressBar) {
      progressBar.style.width = `${data.metrics.greenScore}%`;
    }
  } catch (err) {
    console.error("Error loading dashboard metrics:", err);
  }
}

// Fetch Log Entries & Build Table / Chart
async function loadLogs() {
  try {
    const res = await fetch('/api/waste-logs');
    const logs = await res.json();

    renderTable(logs);
    renderChart(logs);
  } catch (err) {
    console.error("Error loading logs:", err);
  }
}

// Render Table Rows
function renderTable(logs) {
  const tbody = document.querySelector('#logsTable tbody');
  tbody.innerHTML = '';

  logs.forEach(log => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${log.date}</td>
      <td>${log.type}</td>
      <td>${log.weightKg}</td>
      <td>
        <span class="status-badge ${log.properlyProcessed ? 'badge-success' : 'badge-danger'}">
          ${log.properlyProcessed ? '✅ Compliant' : '❌ Non-Compliant'}
        </span>
      </td>
    `;
    tbody.prepend(tr);
  });
}

// Render Doughnut Chart using Chart.js
function renderChart(logs) {
  const totals = { Recycled: 0, Reused: 0, Composted: 0, Landfill: 0 };

  logs.forEach(log => {
    if (totals[log.type] !== undefined) {
      totals[log.type] += log.weightKg;
    }
  });

  const ctx = document.getElementById('wasteChart').getContext('2d');

  if (wasteChart) {
    wasteChart.destroy();
  }

  wasteChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: Object.keys(totals),
      datasets: [{
        data: Object.values(totals),
        backgroundColor: ['#4caf50', '#2196f3', '#ff9800', '#f44336']
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });
}

// Handle Adding Waste Entry
async function handleFormSubmit(e) {
  e.preventDefault();

  const payload = {
    date: document.getElementById('date').value,
    type: document.getElementById('type').value,
    weightKg: parseFloat(document.getElementById('weightKg').value),
    properlyProcessed: document.getElementById('properlyProcessed').checked
  };

  try {
    const res = await fetch('/api/waste-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      document.getElementById('weightKg').value = '';
      // Refresh UI
      await loadDashboard();
      await loadLogs();
    }
  } catch (err) {
    console.error("Error submitting entry:", err);
  }
}
