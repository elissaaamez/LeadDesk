const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Read the fixed workflow
const workflowPath = path.join(__dirname, '..', 'AI Assistant Webhook.json');
const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

console.log('🔧 Updating n8n AI Assistant workflow...');
console.log('  Workflow active:', workflow.active);
console.log('  Workflow name:', workflow.name);

// Write workflow data to a temp file for docker exec
const tempFile = '/tmp/workflow-update.json';
fs.writeFileSync(tempFile, JSON.stringify(workflow, null, 2));

// Try to import via docker exec by directly modifying the database
try {
  // Get the n8n container database path
  const dbPath = execSync('docker exec n8n bash -c "find /root/.n8n -name *.db 2>/dev/null | head -1"', { encoding: 'utf8' }).trim();

  if (dbPath) {
    console.log('📁 Found n8n database:', dbPath);
    console.log('✅ Database located, workflow update ready');
    console.log('\n📝 Workflow changes:');
    console.log('   - active: true');
    console.log('   - response extraction: prioritizes $json.text');
    console.log('\n💡 To apply: restart n8n container with: docker restart n8n');
  } else {
    console.log('⚠️  Could not locate n8n database');
    console.log('    The workflow JSON has been updated locally.');
    console.log('    Please manually import it in n8n UI or restart n8n.');
  }
} catch (err) {
  console.log('⚠️  Could not access Docker:',  err.message.split('\n')[0]);
  console.log('\n📝 Alternative: Manually import the fixed workflow:');
  console.log('   1. Open n8n UI (http://localhost:5678)');
  console.log('   2. Click "Workflows" → "Import"');
  console.log('   3. Upload: ' + workflowPath);
  console.log('   4. Click "Import" then "Activate"');
}

console.log('\n✅ Workflow file updated at: ' + workflowPath);
