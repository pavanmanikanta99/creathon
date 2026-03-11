// ═══════════════════════════════════════════════
//  app.js — Smart Canteen Demand Predictor Logic
// ═══════════════════════════════════════════════

// ── 1. DATA: Menu Items with Base Demand ────────
const MENU_ITEMS = [
    { name: "Rice Meal", base: 120, emoji: "🍛" },
    { name: "Sandwich", base: 80, emoji: "🥪" },
    { name: "Pasta / Noodles", base: 70, emoji: "🍝" },
    { name: "Pizza Slice", base: 60, emoji: "🍕" },
    { name: "Salad Bowl", base: 45, emoji: "🥗" },
    { name: "Soup / Curry", base: 55, emoji: "🍲" },
    { name: "Beverages", base: 100, emoji: "🥤" },
    { name: "Dessert", base: 40, emoji: "🍰" },
    { name: "Veg Thali", base: 90, emoji: "🍱" },
    { name: "Snack Combo", base: 65, emoji: "🍟" },
];

// ── 2. WEIGHT TABLES ────────────────────────────
const DAY_WEIGHTS = {
    Mon: 0.95,
    Tue: 1.0,
    Wed: 1.1,
    Thu: 1.05,
    Fri: 1.2,
    Sat: 0.75,
    Sun: 0.6
};

const MEAL_WEIGHTS = {
    Breakfast: 0.6,
    Lunch: 1.4,
    Snacks: 0.8,
    Dinner: 0.9
};

const WEATHER_WEIGHTS = {
    Sunny: 1.0,
    Rainy: 1.2,
    Cold: 1.15,
    Hot: 0.85
};

const EVENT_WEIGHTS = {
    Normal: 1.0,
    ExamWeek: 1.3,
    SportsDay: 1.5,
    Holiday: 0.6,
    GuestLecture: 1.2
};

// Item-specific adjustments: some items respond differently to weather
const ITEM_WEATHER_MODIFIER = {
    "Soup / Curry": { Rainy: 1.4, Cold: 1.5, Hot: 0.7, Sunny: 1.0 },
    "Beverages": { Hot: 1.5, Sunny: 1.3, Cold: 0.7, Rainy: 0.8 },
    "Salad Bowl": { Hot: 1.3, Sunny: 1.2, Cold: 0.8, Rainy: 0.9 },
    "Dessert": { Hot: 1.3, Sunny: 1.2, Cold: 0.7, Rainy: 0.9 },
};

// Trend simulation (rolling 7-day, slight variance per day)
const TREND_FACTORS = [0.95, 1.02, 1.05, 0.98, 1.08, 0.92, 1.0];

// ── 3. PREDICTION ENGINE ────────────────────────
function predict(item, day, meal, weather, event) {
    const dayW = DAY_WEIGHTS[day] || 1.0;
    const mealW = MEAL_WEIGHTS[meal] || 1.0;
    const weatherW = (ITEM_WEATHER_MODIFIER[item.name] &&
            ITEM_WEATHER_MODIFIER[item.name][weather]) ?
        ITEM_WEATHER_MODIFIER[item.name][weather] :
        (WEATHER_WEIGHTS[weather] || 1.0);
    const eventW = EVENT_WEIGHTS[event] || 1.0;
    const trendW = TREND_FACTORS[Math.floor(Math.random() * TREND_FACTORS.length)];

    const raw = item.base * dayW * mealW * weatherW * eventW * trendW;
    const qty = Math.round(raw);
    const conf = Math.round(qty * (0.08 + Math.random() * 0.07));

    return { qty, conf, dayW, mealW, weatherW, eventW, trendW };
}

// ── 4. UI: CLOCK ────────────────────────────────
function updateClock() {
    const el = document.getElementById("currentTime");
    if (el) el.textContent = new Date().toLocaleTimeString('en-IN', { hour12: false });
}
setInterval(updateClock, 1000);
updateClock();

// ── 5. TAB NAVIGATION ───────────────────────────
function showTab(name) {
    document.querySelectorAll('.tab-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('tab-' + name).classList.add('active');
    event.target.classList.add('active');
    if (name === 'algorithm') buildWeightTables();
}

// ── 6. HEATMAP (Dashboard) ──────────────────────
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function buildHeatmap() {
    const tbody = document.getElementById('heatmapBody');
    tbody.innerHTML = '';
    let grandTotal = 0;
    let topItem = { name: '', qty: 0 };

    MENU_ITEMS.forEach(item => {
        const tr = document.createElement('tr');
        let rowHTML = `<td>${item.emoji} ${item.name}</td>`;
        let itemTotal = 0;

        DAYS.forEach(day => {
            const res = predict(item, day, 'Lunch', 'Sunny', 'Normal');
            const cls = res.qty < 60 ? 'cell-low' : res.qty > 120 ? 'cell-high' : 'cell-mid';
            rowHTML += `<td class="${cls}">${res.qty}</td>`;
            itemTotal += res.qty;
        });

        if (itemTotal > topItem.qty) topItem = { name: item.emoji + ' ' + item.name, qty: itemTotal };
        grandTotal += itemTotal;
        tr.innerHTML = rowHTML;
        tbody.appendChild(tr);
    });

    // Update KPIs
    const todayTotal = MENU_ITEMS.reduce((sum, item) => {
        return sum + predict(item, 'Mon', 'Lunch', 'Sunny', 'Normal').qty;
    }, 0);
    document.getElementById('kpiTotal').textContent = todayTotal;
    document.getElementById('kpiTop').textContent = topItem.name.split(' ').slice(1).join(' ');
}

// ── 7. BAR CHART (Dashboard) ────────────────────
function buildBarChart() {
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const predicted = labels.map(d => {
        return MENU_ITEMS.reduce((s, item) => s + predict(item, d, 'Lunch', 'Sunny', 'Normal').qty, 0);
    });
    const actual = predicted.map(p => Math.round(p * (0.88 + Math.random() * 0.2)));

    const ctx = document.getElementById('barChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                    label: 'Predicted',
                    data: predicted,
                    backgroundColor: 'rgba(245,166,35,0.75)',
                    borderColor: '#f5a623',
                    borderWidth: 1,
                    borderRadius: 3,
                },
                {
                    label: 'Actual (Simulated)',
                    data: actual,
                    backgroundColor: 'rgba(57,217,138,0.5)',
                    borderColor: '#39d98a',
                    borderWidth: 1,
                    borderRadius: 3,
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { labels: { color: '#e2e6f0', font: { family: 'Share Tech Mono' } } }
            },
            scales: {
                x: { ticks: { color: '#6b7280' }, grid: { color: '#2a2f3d' } },
                y: { ticks: { color: '#6b7280' }, grid: { color: '#2a2f3d' } }
            }
        }
    });
}

// ── 8. PREDICTION RUN ───────────────────────────
let lastPrediction = null;

function runPrediction() {
    const day = document.getElementById('inp-day').value;
    const meal = document.getElementById('inp-meal').value;
    const weather = document.getElementById('inp-weather').value;
    const event = document.getElementById('inp-event').value;

    const results = MENU_ITEMS.map(item => {
        const res = predict(item, day, meal, weather, event);
        return { item, ...res };
    }).sort((a, b) => b.qty - a.qty);

    lastPrediction = { day, meal, weather, event, results, timestamp: new Date().toISOString() };

    // Update label
    document.getElementById('predLabel').textContent =
        `${day} | ${meal} | ${weather} | ${event}`;

    // Render results
    const maxQty = results[0].qty;
    const container = document.getElementById('predictionResults');
    container.innerHTML = results.map(r => `
    <div class="result-item">
      <div>
        <div class="item-name">${r.item.emoji} ${r.item.name}</div>
        <div class="item-conf">± ${r.conf} servings confidence</div>
        <div class="result-bar">
          <div class="result-bar-fill" style="width:${(r.qty/maxQty)*100}%"></div>
        </div>
      </div>
      <div class="item-qty">${r.qty}</div>
    </div>
  `).join('');

    // Today's summary (top 3)
    buildSummary(results.slice(0, 3));

    document.getElementById('saveStatus').textContent = '';
}

function buildSummary(top3) {
    const ranks = ['🥇 #1 Priority', '🥈 #2 Priority', '🥉 #3 Priority'];
    const container = document.getElementById('todaySummary');
    container.innerHTML = top3.map((r, i) => `
    <div class="summary-card">
      <div class="summary-rank">${ranks[i]}</div>
      <div class="summary-name">${r.item.emoji} ${r.item.name}</div>
      <div class="summary-qty">${r.qty}</div>
      <div class="summary-note">servings (±${r.conf})</div>
    </div>
  `).join('');
}

// ── 9. FIREBASE SAVE ────────────────────────────
async function savePrediction() {
    const statusEl = document.getElementById('saveStatus');
    if (!lastPrediction) {
        statusEl.style.color = '#ff5c5c';
        statusEl.textContent = '⚠ Run a prediction first!';
        return;
    }

    statusEl.style.color = '#f5a623';
    statusEl.textContent = '⏳ Saving...';

    try {
        const docData = {
            day: lastPrediction.day,
            meal: lastPrediction.meal,
            weather: lastPrediction.weather,
            event: lastPrediction.event,
            timestamp: lastPrediction.timestamp,
            results: lastPrediction.results.map(r => ({
                item: r.item.name,
                predicted: r.qty,
                confidence: r.conf
            }))
        };

        await db.collection("predictions").add(docData);

        statusEl.style.color = '#39d98a';
        statusEl.textContent = '✅ Saved to Firebase!';
    } catch (err) {
        statusEl.style.color = '#ff5c5c';
        statusEl.textContent = '❌ Error: ' + err.message;
        console.error(err);
    }
}

// ── 10. FIREBASE LOAD HISTORY ───────────────────
async function loadHistory() {
    const container = document.getElementById('historyContainer');
    container.innerHTML = '<div class="placeholder-msg">⏳ Loading from Firebase...</div>';

    try {
        const snapshot = await db.collection("predictions")
            .orderBy("timestamp", "desc")
            .limit(20)
            .get();

        if (snapshot.empty) {
            container.innerHTML = '<div class="placeholder-msg">No predictions saved yet. Go to the Predictor tab and save one!</div>';
            return;
        }

        let html = `<table class="history-table">
      <thead><tr>
        <th>TIMESTAMP</th><th>DAY</th><th>MEAL</th>
        <th>WEATHER</th><th>EVENT</th><th>TOP ITEMS</th>
      </tr></thead><tbody>`;

        snapshot.forEach(doc => {
            const d = doc.data();
            const time = new Date(d.timestamp).toLocaleString('en-IN');
            const topItems = (d.results || []).slice(0, 3)
                .map(r => `<span class="tag">${r.item}: ${r.predicted}</span>`).join(' ');
            html += `<tr>
        <td style="font-family:var(--mono);font-size:0.75rem;color:#6b7280">${time}</td>
        <td><span class="tag">${d.day}</span></td>
        <td><span class="tag">${d.meal}</span></td>
        <td><span class="tag">${d.weather}</span></td>
        <td><span class="tag">${d.event}</span></td>
        <td>${topItems}</td>
      </tr>`;
        });

        html += '</tbody></table>';
        container.innerHTML = html;
    } catch (err) {
        container.innerHTML = `<div class="placeholder-msg" style="color:#ff5c5c">
      ❌ Could not load from Firebase.<br>Make sure Firestore is enabled in your project.<br>${err.message}
    </div>`;
        console.error(err);
    }
}

// ── 11. ALGORITHM WEIGHT TABLES ─────────────────
function buildWeightTables() {
    fillWeightTable('dayWeightTable', DAY_WEIGHTS);
    fillWeightTable('mealWeightTable', MEAL_WEIGHTS);
    fillWeightTable('weatherWeightTable', WEATHER_WEIGHTS);
    fillWeightTable('eventWeightTable', EVENT_WEIGHTS);
}

function fillWeightTable(id, obj) {
    const table = document.getElementById(id);
    if (!table) return;
    table.innerHTML = Object.entries(obj).map(([k, v]) => `
    <tr>
      <td style="color:#e2e6f0">${k}</td>
      <td>${v.toFixed(2)}×</td>
    </tr>
  `).join('');
}

// ── 12. LIVE SLIDER CALCULATOR ──────────────────
function updateLiveCalc() {
    const base = parseFloat(document.getElementById('sl-base').value);
    const dayW = parseFloat(document.getElementById('sl-day').value);
    const mealW = parseFloat(document.getElementById('sl-meal').value);
    const weatherW = parseFloat(document.getElementById('sl-weather').value);
    const eventW = parseFloat(document.getElementById('sl-event').value);
    const trendW = parseFloat(document.getElementById('sl-trend').value);

    const result = Math.round(base * dayW * mealW * weatherW * eventW * trendW);
    const conf = Math.round(result * 0.1);

    document.getElementById('sl-base-val').textContent = base;
    document.getElementById('sl-day-val').textContent = dayW.toFixed(2);
    document.getElementById('sl-meal-val').textContent = mealW.toFixed(2);
    document.getElementById('sl-weather-val').textContent = weatherW.toFixed(2);
    document.getElementById('sl-event-val').textContent = eventW.toFixed(2);
    document.getElementById('sl-trend-val').textContent = trendW.toFixed(2);

    document.getElementById('liveResult').textContent = result;
    document.getElementById('liveConf').textContent = conf;
}

// ── 13. INIT ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    buildHeatmap();
    buildBarChart();
    // Auto-run a default prediction on load
    runPrediction();
});