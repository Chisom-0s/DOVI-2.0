const fs = require('fs');

// 1. Update SmartPromptManager.tsx
const spmPath = 'frontend/src/components/common/SmartPromptManager.tsx';
let spm = fs.readFileSync(spmPath, 'utf8').replace(/\r\n/g, '\n');
spm = spm.replace("import DoviCommunityPrompt from './DoviCommunityPrompt';\n", "");
spm = spm.replace("      <DoviCommunityPrompt />\n", "");
fs.writeFileSync(spmPath, spm, 'utf8');
console.log('Removed DoviCommunityPrompt from SmartPromptManager.tsx');

// 2. Disable community prompt in PromptEngineContext.tsx
const pecPath = 'frontend/src/contexts/PromptEngineContext.tsx';
let pec = fs.readFileSync(pecPath, 'utf8').replace(/\r\n/g, '\n');
pec = pec.replace("community: { enabled: true,", "community: { enabled: false,");
fs.writeFileSync(pecPath, pec, 'utf8');
console.log('Disabled community prompt in PromptEngineContext.tsx');

// 3. Neutralize DoviCommunityPrompt.tsx so it never renders even if invoked
const dcpPath = 'frontend/src/components/common/DoviCommunityPrompt.tsx';
fs.writeFileSync(dcpPath, `// Permanently removed per Part 8 - Join DOVI WhatsApp Community Pop-up removed from customer experience
export default function DoviCommunityPrompt() {
  return null;
}
`, 'utf8');
console.log('Neutralized DoviCommunityPrompt.tsx');
