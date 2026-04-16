const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const d = path.join(process.env.USERPROFILE, 'Downloads');
const files = fs.readdirSync(d).filter(f => f.endsWith('.xlsx') && !f.startsWith('~'));
const t = files.find(f => f.includes('2026'));
const wb = XLSX.readFile(path.join(d, t));
const ws = wb.Sheets['БХГ-2026-5'];

if (!ws) {
  console.log('Sheet not found! Available:', wb.SheetNames);
  process.exit(1);
}

const keys = Object.keys(ws).filter(k => !k.startsWith('!')).sort();
console.log('Total cells:', keys.length);

// Find all cells in rows 0-4
console.log('\n=== Rows 0-4 ===');
for (const k of keys) {
  const cell = XLSX.utils.decode_cell(k);
  if (cell.r < 5 && ws[k].v !== '' && ws[k].v !== 0) {
    console.log(k, '(r' + cell.r + ',c' + cell.c + '):', JSON.stringify(ws[k].v));
  }
}

// Find cells in columns > 45
console.log('\n=== Cols > 45 ===');
for (const k of keys) {
  const cell = XLSX.utils.decode_cell(k);
  if (cell.c > 45 && ws[k].v !== '' && ws[k].v !== 0 && ws[k].v !== 'entr') {
    console.log(k, '(r' + cell.r + ',c' + cell.c + '):', JSON.stringify(ws[k].v));
  }
}

// Check for shapes/drawings references
console.log('\n=== Special keys ===');
Object.keys(ws).filter(k => k.startsWith('!')).forEach(k => {
  if (k === '!merges' || k === '!ref') {
    console.log(k, ':', k === '!ref' ? ws[k] : ws[k].length + ' merges');
  } else {
    console.log(k);
  }
});

// Check row 3 fully
console.log('\n=== Row 3 (period row) ===');
for (const k of keys) {
  const cell = XLSX.utils.decode_cell(k);
  if (cell.r === 3) {
    console.log(k, '(c' + cell.c + '):', JSON.stringify(ws[k].v), ws[k].t);
  }
}
