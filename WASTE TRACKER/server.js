const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory Mock Database
let companyData = {
  companyName: "EcoTech Enterprises",
  kpiGoals: {
    targetRecyclePercentage: 80,
    targetReductionKg: 5000,
  },
  wasteLogs: [
    { id: 1, date: "2026-09-01", type: "Recycled", weightKg: 1200, properlyProcessed: true },
    { id: 2, date: "2026-09-05", type: "Reused", weightKg: 450, properlyProcessed: true },
    { id: 3, date: "2026-09-10", type: "Landfill", weightKg: 350, properlyProcessed: false },
    { id: 4, date: "2026-09-14", type: "Composted", weightKg: 600, properlyProcessed: true }
  ]
};

// Helper Functions for Calculating KPIs
function calculateMetrics() {
  const logs = companyData.wasteLogs;
  let totalWaste = 0;
  let sustainableWaste = 0; // Recycled, Reused, Composted
  let properlyProcessedWaste = 0;

  logs.forEach(log => {
    totalWaste += log.weightKg;
    
    if (log.type !== "Landfill") {
      sustainableWaste += log.weightKg;
    }
    
    if (log.properlyProcessed) {
      properlyProcessedWaste += log.weightKg;
    }
  });

  const recyclePercentage = totalWaste > 0 ? ((sustainableWaste / totalWaste) * 100).toFixed(1) : 0;
  const properProcessPercentage = totalWaste > 0 ? ((properlyProcessedWaste / totalWaste) * 100).toFixed(1) : 0;

  // Green Score (out of 100) calculated based on process accuracy and recycling goals
  const greenScore = Math.min(100, Math.round((recyclePercentage * 0.6) + (properProcessPercentage * 0.4)));

  return {
    totalWasteKg: totalWaste,
    sustainableWasteKg: sustainableWaste,
    recyclePercentage: parseFloat(recyclePercentage),
    properProcessPercentage: parseFloat(properProcessPercentage),
    greenScore: greenScore
  };
}

// REST API Endpoints

// Get Dashboard Overview Metrics
app.get('/api/dashboard', (req, res) => {
  const metrics = calculateMetrics();
  res.json({
    companyName: companyData.companyName,
    kpiGoals: companyData.kpiGoals,
    metrics: metrics
  });
});

// Get all logged waste entries
app.get('/api/waste-logs', (req, res) => {
  res.json(companyData.wasteLogs);
});

// Add a new waste entry
app.post('/api/waste-logs', (req, res) => {
  const { date, type, weightKg, properlyProcessed } = req.body;

  if (!date || !type || !weightKg) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const newLog = {
    id: Date.now(),
    date,
    type,
    weightKg: parseFloat(weightKg),
    properlyProcessed: Boolean(properlyProcessed)
  };

  companyData.wasteLogs.push(newLog);
  res.status(201).json({ message: "Waste log added successfully", log: newLog });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
