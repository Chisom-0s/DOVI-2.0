const fs = require('fs');
const filePath = 'admin/src/pages/Promotions/GiveawayManagerPage.tsx';
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

// 1. Fix imports
const oldImports = `import {
  fetchAuthoritativeGiveawayPromotion,
  updateAdminGiveawayConfig,
  computeGiveawayStatus,
  type LaunchGiveawayPromotion,
  type GiveawayClaim,
  type GiveawayStatus,
} from '@/services/giveawayService';
import { useAdminAuth } from '@/contexts/AdminAuthContext';`;

const newImports = `import {
  fetchAuthoritativeGiveawayPromotion,
  updateAdminGiveawayConfig,
  computeGiveawayStatus,
} from '@/services/giveawayService';
import type {
  LaunchGiveawayPromotion,
  GiveawayClaim,
  GiveawayStatus,
} from '@/types';`;

content = content.replace(oldImports, newImports);

// 2. Remove unused user hook
content = content.replace('  const { user } = useAdminAuth();\n', '');

// 3. Fix typed parameters
content = content.replace(
  '(promo?.claims || []).filter((c) => {',
  '(promo?.claims || []).filter((c: GiveawayClaim) => {'
);

content = content.replace(
  '{filteredClaims.map((claim) => (',
  '{filteredClaims.map((claim: GiveawayClaim) => ('
);

// 4. Use simulatedCustomerClaims in DUPLICATE_CLAIM
const oldDup = `      case 'DUPLICATE_CLAIM': {
        addSimLog('error', \`[Sim: 1-Per-Customer] Customer already received a verified gift. Second claim strictly blocked on backend.\`);
        break;
      }`;

const newDup = `      case 'DUPLICATE_CLAIM': {
        const count = simulatedCustomerClaims.size;
        addSimLog('error', \`[Sim: 1-Per-Customer] Customer (\${count > 0 ? 'prior claimant' : custId}) already received a verified gift. Second claim strictly blocked on backend.\`);
        break;
      }`;

content = content.replace(oldDup, newDup);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed GiveawayManagerPage.tsx successfully');
