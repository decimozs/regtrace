import { Database } from "bun:sqlite";
import { existsSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadConfigFromFile } from "../storage/config-loader";
import { printError, printHeader, printInfo, printSuccess } from "./print";

interface DbRow {
	run_id: string;
	timestamp: string;
	status: string;
	trigger: string;
	duration_ms: number;
	suite_score: number;
	golden_set_name: string;
	golden_set_version: string;
	judge_provider: string;
	judge_model: string;
	metric_summary: string;
	test_case_results: string;
	regression: string;
}

export async function webCommand(options: {
	config?: string;
	output?: string;
	noOpen?: boolean;
}): Promise<void> {
	printHeader("regtrace web");

	const configResult = await loadConfigFromFile(options.config);
	if (!configResult.success || !configResult.configPath) {
		printError("Config not found. Run `regtrace init` to create a project.");
		process.exit(2);
	}

	const configDir = resolve(configResult.configPath, "..");
	const dbPath = resolve(
		configDir,
		configResult.data.storage?.db.path ?? ".regtrace/regtrace.db",
	);

	if (!existsSync(dbPath)) {
		printError(`No database found at ${dbPath}.`);
		printInfo("Run `regtrace run` first, or enable DB in your config:");
		printInfo("  storage:  db:  enabled: true  path: .regtrace/regtrace.db");
		process.exit(2);
	}

	printInfo(`Reading database: ${dbPath}`);
	const db = new Database(dbPath);
	const rows = db
		.prepare("SELECT * FROM runs ORDER BY timestamp DESC LIMIT 500")
		.all() as DbRow[];
	db.close();

	if (rows.length === 0) {
		printError("No run records found in the database.");
		process.exit(2);
	}

	printInfo(`Loaded ${rows.length} run(s).`);

	const outputPath = resolve(
		configDir,
		options.output ?? ".regtrace/dashboard.html",
	);
	const data = JSON.stringify(
		rows.map((r) => ({
			run_id: r.run_id,
			timestamp: r.timestamp,
			status: r.status,
			trigger: r.trigger,
			duration_ms: r.duration_ms,
			suite_score: r.suite_score,
			golden_set_name: r.golden_set_name,
			golden_set_version: r.golden_set_version,
			judge_provider: r.judge_provider,
			judge_model: r.judge_model,
			metric_summary: safeJsonParse(r.metric_summary, {}),
			test_case_results: safeJsonParse(r.test_case_results, []),
			regression: safeJsonParse(r.regression, {}),
		})),
	);

	const html = generateDashboard(data, rows.length);
	writeFileSync(outputPath, html, "utf-8");

	printSuccess(`Dashboard written: ${outputPath}`);

	if (!options.noOpen) {
		const { platform } = process;
		const openCmd = platform === "darwin" ? "open" : "xdg-open";
		try {
			Bun.spawnSync([openCmd, outputPath]);
			printInfo(`Browser opened (${openCmd} ${outputPath})`);
		} catch {
			printInfo(`Open manually: ${outputPath}`);
		}
	}
}

function safeJsonParse(raw: string, fallback: unknown): unknown {
	try {
		return JSON.parse(raw);
	} catch {
		return fallback;
	}
}

function generateDashboard(data: string, count: number): string {
	return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Regtrace Dashboard</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js"></script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;background:#0a0a0a;color:#fafafa;padding:32px 24px}
h1{font-size:1.5rem;font-weight:700;margin-bottom:4px}
.sub{color:#a1a1a1;font-size:.85rem}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin:24px 0}
.card{background:#1a1a1a;border:1px solid #2a2a2a;border-radius:8px;padding:16px}
.card-lbl{font-size:.7rem;color:#a1a1a1;text-transform:uppercase;letter-spacing:.05em}
.card-val{font-size:1.4rem;font-weight:700;margin-top:4px}
.row{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:16px 0}
@media(max-width:768px){.row{grid-template-columns:1fr}}
.chart-box{background:#1a1a1a;border:1px solid #2a2a2a;border-radius:8px;padding:16px}
.chart-box h2{font-size:.9rem;font-weight:600;margin-bottom:12px;color:#a1a1a1}
.chart-box.half{grid-column:span 1}
table{width:100%;border-collapse:collapse;font-size:.8rem}
th{text-align:left;padding:10px 8px;border-bottom:2px solid #2a2a2a;color:#a1a1a1;font-weight:600;cursor:pointer}
td{padding:8px;border-bottom:1px solid #1a1a1a}
tr:hover td{background:#1a1a1a}
.tag{display:inline-block;padding:1px 8px;border-radius:999px;font-size:.7rem;font-weight:500}
.tag.pass{background:#052e16;color:#4ade80}
.tag.fail{background:#450a0a;color:#f87171}
.tag.error{background:#1c1917;color:#a16207}
.summary-table{margin-top:24px}
</style>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'><text y='14' font-size='14'>⎘</text></svg>">
</head>
<body>
<h1>Regtrace Dashboard</h1>
<p class="sub">${count} run(s) evaluated</p>
<div class="cards" id="summary-cards"></div>
<div class="row">
<div class="chart-box"><h2>Score Trend</h2><canvas id="chart-score"></canvas></div>
<div class="chart-box"><h2>Run Status</h2><canvas id="chart-status"></canvas></div>
</div>
<div class="row">
<div class="chart-box"><h2>Per-Metric Breakdown</h2><canvas id="chart-metrics"></canvas></div>
<div class="chart-box"><h2>Duration</h2><canvas id="chart-duration"></canvas></div>
</div>
<div class="chart-box" style="margin:16px 0"><h2>Suite Delta (Regression)</h2><canvas id="chart-delta"></canvas></div>
<div class="chart-box summary-table"><h2>Recent Runs</h2>
<table id="runs-table"><thead><tr>
<th data-sort="timestamp">Timestamp</th>
<th data-sort="suite_score">Score</th>
<th data-sort="golden_set_name">Suite</th>
<th data-sort="status">Status</th>
<th data-sort="duration_ms">Duration</th>
<th data-sort="judge_model">Judge</th></tr></thead><tbody id="table-body"></tbody></table></div>
<script>
const DATA = ${data};
const ROWS = DATA;
const LEN = ROWS.length;

// Summary cards
const avg = (ROWS.reduce((s,r)=>s+r.suite_score,0)/LEN*100).toFixed(1);
const passCount = ROWS.filter(r=>r.status==="passed").length;
const failCount = ROWS.filter(r=>r.status==="failed").length;
const last = ROWS[0];
document.getElementById("summary-cards").innerHTML=\`
<div class="card"><div class="card-lbl">Total Runs</div><div class="card-val">\${LEN}</div></div>
<div class="card"><div class="card-lbl">Avg Score</div><div class="card-val">\${avg}%</div></div>
<div class="card"><div class="card-lbl">Passed</div><div class="card-val">\${passCount}</div></div>
<div class="card"><div class="card-lbl">Failed</div><div class="card-val">\${failCount}</div></div>
<div class="card"><div class="card-lbl">Latest</div><div class="card-val">\${(last.suite_score*100).toFixed(1)}%</div></div>
<div class="card"><div class="card-lbl">Last Run</div><div class="card-val" style="font-size:.85rem">\${last.timestamp.slice(0,10)}</div></div>
\`.trim();

const labels = [...ROWS].reverse().map(r=>r.timestamp.slice(0,16).replace("T"," "));

// Score trend
new Chart(document.getElementById("chart-score"),{type:"line",data:{
labels, datasets:[{label:"Suite Score",data:[...ROWS].reverse().map(r=>r.suite_score),
borderColor:"#e53e3e",backgroundColor:"rgba(229,62,62,0.1)",fill:true,tension:.3,pointRadius:3}]
},options:{responsive:true,plugins:{legend:{labels:{color:"#a1a1a1",font:{size:11}}}},
scales:{x:{ticks:{color:"#a1a1a1",font:{size:9}},grid:{color:"#1a1a1a"}},
y:{min:0,max:1,ticks:{color:"#a1a1a1",font:{size:9}},grid:{color:"#1a1a1a"}}}}});

// Status doughnut
new Chart(document.getElementById("chart-status"),{type:"doughnut",data:{
labels:["Passed","Failed","Errored"],
datasets:[{data:[passCount,failCount,LEN-passCount-failCount],
backgroundColor:["#4ade80","#f87171","#a16207"],borderWidth:0}]
},options:{responsive:true,plugins:{legend:{position:"bottom",labels:{color:"#a1a1a1",font:{size:11}}}}}});

// Per-metric breakdown
const metricColors={factuality:"#4ade80",format:"#60a5fa",tone:"#fbbf24",regression:"#e53e3e"};
const reversed = [...ROWS].reverse();
const metricLabels = Object.keys(reversed[0]?.metric_summary||{});
const metricDatasets = metricLabels.map(m=>({
label:m,data:reversed.map(r=>r.metric_summary[m]?.score??null),
borderColor:metricColors[m]||"#a1a1a1",backgroundColor:"transparent",tension:.3,
pointRadius:2,borderWidth:2,borderDash:m==="regression"?[4,4]:[]
}));
if(metricDatasets.length>0){
new Chart(document.getElementById("chart-metrics"),{type:"line",data:{
labels,datasets:metricDatasets
},options:{responsive:true,plugins:{legend:{labels:{color:"#a1a1a1",font:{size:10}}}},
scales:{x:{ticks:{color:"#a1a1a1",font:{size:9}},grid:{color:"#1a1a1a"}},
y:{min:0,max:1,ticks:{color:"#a1a1a1",font:{size:9}},grid:{color:"#1a1a1a"}}}}});
}

// Duration
new Chart(document.getElementById("chart-duration"),{type:"line",data:{
labels,datasets:[{label:"Duration (ms)",data:reversed.map(r=>r.duration_ms),
borderColor:"#a78bfa",backgroundColor:"rgba(167,139,250,0.1)",fill:true,tension:.3,pointRadius:2}]
},options:{responsive:true,plugins:{legend:{labels:{color:"#a1a1a1",font:{size:11}}}},
scales:{x:{ticks:{color:"#a1a1a1",font:{size:9}},grid:{color:"#1a1a1a"}},
y:{ticks:{color:"#a1a1a1",font:{size:9}},grid:{color:"#1a1a1a"}}}}});

// Regression delta
const deltaData = [...ROWS].reverse().map(r=>r.regression?.suite_delta??0);
new Chart(document.getElementById("chart-delta"),{type:"bar",data:{
labels,datasets:[{label:"Suite Delta",data:deltaData,
backgroundColor:deltaData.map(d=>d>=0?"rgba(74,222,128,0.6)":"rgba(248,113,113,0.6)"),
borderColor:deltaData.map(d=>d>=0?"#4ade80":"#f87171"),borderWidth:1}]
},options:{responsive:true,plugins:{legend:{labels:{color:"#a1a1a1",font:{size:11}}}},
scales:{x:{ticks:{color:"#a1a1a1",font:{size:9}},grid:{color:"#1a1a1a"}},
y:{ticks:{color:"#a1a1a1",font:{size:9}},grid:{color:"#1a1a1a"}}}}});

// Table
const tbody = document.getElementById("table-body");
ROWS.slice(0,100).forEach(r=>{
const tr=document.createElement("tr");
tr.innerHTML=\`
<td>\${r.timestamp.slice(0,16).replace("T"," ")}</td>
<td>\${(r.suite_score*100).toFixed(1)}%</td>
<td>\${r.golden_set_name}</td>
<td><span class="tag \${r.status==="passed"?"pass":r.status==="failed"?"fail":"error"}">\${r.status}</span></td>
<td>\${r.duration_ms}ms</td>
<td>\${r.judge_model}</td>\`;
tbody.appendChild(tr);
});

// Sortable table
document.querySelectorAll("th[data-sort]").forEach(th=>{
th.addEventListener("click",()=>{
const key=th.dataset.sort;
ROWS.sort((a,b)=>{
let va=a[key],vb=b[key];
if(typeof va==="string")return va.localeCompare(vb);
return va-vb;
});
tbody.innerHTML="";
ROWS.slice(0,100).forEach(r=>{
const tr=document.createElement("tr");
tr.innerHTML=\`
<td>\${r.timestamp.slice(0,16).replace("T"," ")}</td>
<td>\${(r.suite_score*100).toFixed(1)}%</td>
<td>\${r.golden_set_name}</td>
<td><span class="tag \${r.status==="passed"?"pass":r.status==="failed"?"fail":"error"}">\${r.status}</span></td>
<td>\${r.duration_ms}ms</td>
<td>\${r.judge_model}</td>\`;
tbody.appendChild(tr);
});
});
});
</script>
</body>
</html>`;
}
