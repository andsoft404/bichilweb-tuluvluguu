const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const d = path.join(process.env.USERPROFILE, 'Downloads');
const files = fs.readdirSync(d).filter(f => f.endsWith('.xlsx') && !f.startsWith('~'));
const t = files.find(f => f.includes('2026'));
const wb = XLSX.readFile(path.join(d, t));
const ws = wb.Sheets['БХГ-2026-5'];

// Print all rows from 28 onward (after task rows)
const data = XLSX.utils.sheet_to_json(ws, {header:1, defval:''});
console.log('Total rows:', data.length);

// Look at rows after tasks
for (let i = 28; i < data.length; i++) {
  const row = data[i];
  const nonEmpty = [];
  for (let j = 0; j < row.length; j++) {
    if (row[j] !== '' && row[j] !== 0 && row[j] !== 'entr') {
      nonEmpty.push({col: j, val: row[j]});
    }
  }
  if (nonEmpty.length > 0) {
    console.log('Row', i, ':', JSON.stringify(nonEmpty));
  }
}

// Also check if there are special cells in the worksheet
console.log('\n=== Checking specific cells ===');
// Look at cells beyond column AZ (col 46+) - maybe milestones are in a separate area
for (let r = 0; r < 10; r++) {
  for (let c = 46; c < 68; c++) {
    const addr = XLSX.utils.encode_cell({r, c});
    if (ws[addr] && ws[addr].v !== '' && ws[addr].v !== 'entr') {
      console.log(`Cell ${addr} (r${r},c${c}):`, ws[addr].v, ws[addr].t);
    }
  }
}

// Check row 0-6 for milestone headers in columns > 15
console.log('\n=== Header area milestones ===');
for (let r = 0; r < 7; r++) {
  for (let c = 15; c < 68; c++) {
    const addr = XLSX.utils.encode_cell({r, c});
    if (ws[addr] && ws[addr].v !== '' && ws[addr].v !== 'entr') {
      console.log(`Cell ${addr} (r${r},c${c}):`, JSON.stringify(ws[addr].v), 'type:', ws[addr].t);
    }
  }
}

// Check rows 28-42 fully
console.log('\n=== All data rows 28-42 ===');
for (let r = 28; r < 42; r++) {
  for (let c = 0; c < 68; c++) {
    const addr = XLSX.utils.encode_cell({r, c});
    if (ws[addr] && ws[addr].v !== '' && ws[addr].v !== 0 && ws[addr].v !== 'entr') {
      console.log(`Cell ${addr} (r${r},c${c}):`, JSON.stringify(ws[addr].v), 'type:', ws[addr].t);
    }
  }
}

// Check merges for hints
console.log('\n=== All merges ===');
if (ws['!merges']) {
  ws['!merges'].forEach((m, i) => {
    console.log(`Merge ${i}: ${XLSX.utils.encode_range(m)}`);
  });
}
