const fs = require('fs');

const routerPath = 'frontend/src/router/index.tsx';
let content = fs.readFileSync(routerPath, 'utf8').replace(/\r\n/g, '\n');

// 1. Add imports
const importTarget = `import SmartPromptManager from '@/components/common/SmartPromptManager';`;
const importAddition = `import SmartPromptManager from '@/components/common/SmartPromptManager';
import { PromotionProvider } from '@/contexts/PromotionContext';
import PromotionalPopup from '@/components/common/PromotionalPopup';`;

if (content.includes(importTarget) && !content.includes('PromotionProvider')) {
  content = content.replace(importTarget, importAddition);
}

// 2. Wrap root element with PromotionProvider and include PromotionalPopup
const rootElementTarget = `    element: (
      <>
        <Outlet />
        <SmartPromptManager />
      </>
    ),`;

const rootElementReplacement = `    element: (
      <PromotionProvider>
        <Outlet />
        <SmartPromptManager />
        <PromotionalPopup />
      </PromotionProvider>
    ),`;

if (content.includes(rootElementTarget)) {
  content = content.replace(rootElementTarget, rootElementReplacement);
  fs.writeFileSync(routerPath, content, 'utf8');
  console.log('Successfully wrapped router root with PromotionProvider and PromotionalPopup');
} else {
  console.log('Target not found or already wrapped');
}
