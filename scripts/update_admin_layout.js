const fs = require('fs');
const filePath = 'admin/src/components/layout/AdminLayout.tsx';
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

const needle = `    {
      label: 'Homepage & Merchandising',
      path: '/homepage',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      ),
    },`;

const addition = `
    {
      label: 'Launch Giveaway',
      path: '/giveaway',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 12 20 22 4 22 4 12"></polyline>
          <rect x="2" y="7" width="20" height="5"></rect>
          <line x1="12" y1="22" x2="12" y2="7"></line>
          <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
          <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
        </svg>
      ),
    },`;

if (!content.includes(needle)) {
  console.error('Target needle not found in AdminLayout');
  process.exit(1);
}

content = content.replace(needle, needle + addition);
fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully added Launch Giveaway to AdminLayout.tsx');
