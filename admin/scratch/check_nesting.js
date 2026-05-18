
const fs = require('fs');
const content = fs.readFileSync('/home/samiur/Documents/Larabel Ecommerce running project/style-bd-admin/app/dashboard/products/page.tsx', 'utf8');
const lines = content.split('\n');

let inP = false;
let pLine = 0;

lines.forEach((line, i) => {
    const lineNum = i + 1;
    if (line.includes('<p')) {
        inP = true;
        pLine = lineNum;
    }
    if (inP && line.includes('<div')) {
        console.log(`Potential invalid nesting: div at line ${lineNum} inside p starting at line ${pLine}`);
    }
    if (line.includes('</p>')) {
        inP = false;
    }
});
