const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '..', 'frontend', 'src', 'App.tsx');
let content = fs.readFileSync(appPath, 'utf8');

if (!content.includes("import '@/utils/toastDedupe'")) {
  content = content.replace(
    "import { Toaster } from 'react-hot-toast';",
    "import { Toaster } from 'react-hot-toast';\nimport '@/utils/toastDedupe';"
  );
}

// Update Toaster config with gutter and 3.5s duration
content = content.replace(
  /<Toaster[\s\S]*?\/>/,
  `<Toaster
              position="top-right"
              gutter={8}
              toastOptions={{
                duration: 3500,
                style: {
                  fontSize: '0.875rem',
                  fontFamily: 'var(--font-sans)',
                  maxWidth: '380px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
                },
                error: {
                  duration: 3500,
                },
              }}
            />`
);

fs.writeFileSync(appPath, content, 'utf8');
console.log('App.tsx updated.');
