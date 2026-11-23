const fs = require('fs');
['backend/delivery/services.py', 'backend/delivery/views.py'].forEach(f => {
  if (fs.existsSync(f)) {
    console.log('=== ' + f + ' ===');
    const content = fs.readFileSync(f, 'utf8');
    console.log(content.slice(0, 1000));
  }
});
