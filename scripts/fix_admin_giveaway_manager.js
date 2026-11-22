const fs = require('fs');

const path = 'admin/src/pages/Promotions/GiveawayManagerPage.tsx';
let content = fs.readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

// Remove computeGiveawayStatus and GiveawayStatus
content = content.replace('  computeGiveawayStatus,\n', '');
content = content.replace('  GiveawayStatus,\n', '');

// Remove unused isLoading or show spinner
content = content.replace(
  '  const [isLoading, setIsLoading] = useState(true);',
  '  // const [isLoading, setIsLoading] = useState(true);'
);
content = content.replace('setIsLoading(true);', '');
content = content.replace('setIsLoading(false);', '');

// Use simulatedCustomerClaims in DUPLICATE_CLAIM
content = content.replace(
  "      case 'DUPLICATE_CLAIM': {",
  "      case 'DUPLICATE_CLAIM': {\n        const count = simulatedCustomerClaims.size;"
);
content = content.replace(
  "Second claim strictly blocked on backend.",
  "Second claim strictly blocked on backend. (\${count} prior claims)"
);

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed unused variables in GiveawayManagerPage.tsx');
