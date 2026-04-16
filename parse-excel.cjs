const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const downloadsDir = path.join(process.env.USERPROFILE, 'Downloads');
const files = fs.readdirSync(downloadsDir).filter(f => f.endsWith('.xlsx'));
const targetFile = files.find(f => f.includes('2026') && !f.startsWith('~$'));
const filePath = path.join(downloadsDir, targetFile);
const wb = XLSX.readFile(filePath, { cellDates: true });

function excelDate(v) {
  if (v instanceof Date) return v.toISOString().split('T')[0];
  if (typeof v === 'number' && v > 40000 && v < 60000) {
    const d = new Date((v - 25569) * 86400000);
    return d.toISOString().split('T')[0];
  }
  return v;
}

const output = {};

// Parse department sheets (МАРКЕТИНГ, ДУУДЛАГЫН ТӨВ, etc.)
function parseDeptSheet(name) {
  const ws = wb.Sheets[name];
  if (!ws) return null;
  const data = XLSX.utils.sheet_to_json(ws, {header:1, defval:''});
  const info = {
    title: data[0]?.[0] || '',
    department: data[1]?.[2] || '',
    responsible: data[2]?.[2] || '',
    period: excelDate(data[2]?.[5]) || '',
    tasks: []
  };
  for (let i = 6; i < data.length; i++) {
    const row = data[i];
    if (!row[0] && !row[1]) continue;
    const task = {
      num: row[0],
      task: row[1] || '',
      subtask: row[2] || '',
      partner: row[3] || '',
      cost: row[4] || '',
      startDate: excelDate(row[5]),
      endDate: excelDate(row[6]),
      completion: typeof row[7] === 'number' ? Math.round(row[7]*100) : 0,
      actualStart: excelDate(row[8]),
      actualEnd: excelDate(row[9]),
      overdueDays: row[10] || 0,
      duration: row[11] || 0,
      isParent: Number.isInteger(row[0])
    };
    info.tasks.push(task);
  }
  return info;
}

// Parse main sheet (БХГ-2026-5) 
function parseMainSheet() {
  const ws = wb.Sheets['БХГ-2026-5'];
  if (!ws) return null;
  const data = XLSX.utils.sheet_to_json(ws, {header:1, defval:''});
  const info = {
    title: data[1]?.[1] || '',
    department: data[2]?.[4] || '',
    responsible: data[3]?.[1] || '',
    period: excelDate(data[3]?.[6]),
    headers: data[5] ? data[5].slice(1, 15) : [],
    dayHeaders: data[5] ? data[5].slice(15, 46) : [],
    dayDates: data[6] ? data[6].slice(15, 46).map(d => excelDate(d)) : [],
    tasks: []
  };
  for (let i = 7; i < data.length; i++) {
    const row = data[i];
    if (!row[1] && !row[3]) continue;
    const ganttCells = row.slice(15, 46);
    const task = {
      num: row[1],
      priority: row[2] || '',
      topic: row[3] || '',
      subtask: row[4] || '',
      partner: row[5] || '',
      cost: row[6] || '',
      startDate: excelDate(row[7]),
      endDate: excelDate(row[8]),
      completion: typeof row[9] === 'number' ? Math.round(row[9]*100) : 0,
      actualStart: excelDate(row[10]),
      actualEnd: excelDate(row[11]),
      quality: row[12] || '',
      overdueDays: row[13] || 0,
      duration: row[14] || 0,
      isParent: Number.isInteger(row[1]),
      gantt: ganttCells.map(c => c === '' ? 0 : (typeof c === 'number' ? c : (c === 'entr' ? 0 : 1)))
    };
    info.tasks.push(task);
  }
  return info;
}

// Parse BOOST sheet
function parseBoostSheet() {
  const ws = wb.Sheets['BOOST ЗАРДАЛ'];
  if (!ws) return null;
  const data = XLSX.utils.sheet_to_json(ws, {header:1, defval:''});
  return {
    title: data[0]?.[1] || '',
    headers: ['№','IDEA','ХУГАЦАА','ХЭЛБЭР','DESCRIPTION','ЭХЛЭХ','ДУУСАХ','НИЙТ BOOST'],
    rows: data.slice(4).filter(r => r[0]).map(r => ({
      num: r[0], idea: r[1], date: excelDate(r[2]), format: r[3],
      description: r[4], startDate: excelDate(r[5]), endDate: excelDate(r[6]), totalBoost: r[7]
    }))
  };
}

// Parse ТӨСӨВ sheet
function parseBudgetSheet() {
  const ws = wb.Sheets['ТӨСӨВ'];
  if (!ws) return null;
  const data = XLSX.utils.sheet_to_json(ws, {header:1, defval:''});
  const info = {
    title: data[0]?.[0] || '',
    months: ['2026.01','2026.02','2026.03','2026.04','2026.05','2026.06','2026.07','2026.08','2026.09','2026.10','2026.11','2026.12','НИЙТ'],
    rows: []
  };
  for (let i = 4; i < data.length; i++) {
    const row = data[i];
    if (!row[0] && !row[1]) continue;
    info.rows.push({
      num: row[0], task: row[1] || '',
      values: row.slice(2, 15).map(v => (typeof v === 'number' ? v : 0)),
      isTotal: row[1] === 'НИЙТ'
    });
  }
  return info;
}

// Parse expenses sheet
function parseExpensesSheet() {
  const ws = wb.Sheets['БХГ- ГАРСАН ЗАРДЛУУД'];
  if (!ws) return null;
  const data = XLSX.utils.sheet_to_json(ws, {header:1, defval:''});
  return {
    title: data[0]?.[0] || '',
    headers: data[2] || [],
    rows: data.slice(3).filter(r => r[1]).map(r => ({
      num: r[0], task: r[1], code: r[2], date: excelDate(r[3]),
      unitPrice: r[4], quantity: r[5], total: r[6], discount: r[7], expense: r[8]
    }))
  };
}

// Parse legend
function parseLegendSheet() {
  const ws = wb.Sheets['Түлхүүр үг'];
  if (!ws) return null;
  const data = XLSX.utils.sheet_to_json(ws, {header:1, defval:''});
  return {
    priorities: data.slice(2).map(r => r[0]).filter(Boolean),
    statuses: data.slice(2).map(r => r[2]).filter(Boolean),
    risks: data.slice(2).map(r => r[4]).filter(Boolean),
    departments: data.slice(2).map(r => r[6]).filter(Boolean)
  };
}

output.main = parseMainSheet();
output.marketing = parseDeptSheet('МАРКЕТИНГ');
output.callCenter = parseDeptSheet('ДУУДЛАГЫН ТӨВ');
output.customerService = parseDeptSheet('ХАРИЛЦАГЧИЙН ҮЙЛЧИЛГЭЭ');
output.design = parseDeptSheet('ДИЗАЙН');
output.boost = parseBoostSheet();
output.budget = parseBudgetSheet();
output.expenses = parseExpensesSheet();
output.legend = parseLegendSheet();

fs.writeFileSync(path.join(__dirname, 'src', 'data.json'), JSON.stringify(output, null, 2), 'utf8');
console.log('Data extracted to src/data.json');
