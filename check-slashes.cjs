const fs = require('fs');
const content = fs.readFileSync('src/app/pages/Personal/components/PersonalForm.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, i) => {
  if (line.includes('/') && !line.trim().startsWith('//') && !line.includes('/*') && !line.includes('*/') && !line.includes('"') && !line.includes("'")) {
    console.log(i+1, line.trim());
  }
});