const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const workflowPath = path.join(__dirname, '..', 'AI Assistant Webhook.json');
const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

console.log('📤 Importing workflow to n8n:', workflow.name);

// Try to POST the workflow to n8n's import endpoint
const data = JSON.stringify({
  workflow: workflow
});

const options = {
  hostname: 'localhost',
  port: 5678,
  path: '/api/v1/workflows',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    'X-N8N-API-KEY': process.env.N8N_API_KEY || ''
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    if (res.statusCode === 401 || res.statusCode === 403) {
      console.log('❌ Auth required. Trying with curl via docker exec...');
      importViaDocker();
    } else {
      console.log('Response:', body.substring(0, 300));
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
  importViaDocker();
});

req.write(data);
req.end();

function importViaDocker() {
  const { execSync } = require('child_process');

  // Write temp workflow file
  const tempPath = path.join(__dirname, '..', 'temp-workflow.json');
  fs.writeFileSync(tempPath, JSON.stringify(workflow));

  try {
    // Copy into docker and import
    execSync(`docker cp "${tempPath}" n8n:/tmp/workflow.json`);
    console.log('✅ Workflow copied to container');

    // Try to import using n8n's internal mechanisms
    const result = execSync(`docker exec -i n8n npm exec -- n8n import:workflow --input=/tmp/workflow.json`, {
      encoding: 'utf8',
      stdio: 'pipe'
    }).catch(e => console.log('Could not import via CLI'));

    console.log('Import result:', result);
    fs.unlinkSync(tempPath);
  } catch (err) {
    console.log('Docker import failed:', err.message.split('\n')[0]);
    console.log('\n⚠️  Please manually import in n8n UI:');
    console.log('   1. Open http://localhost:5678');
    console.log('   2. Click "Workflows"');
    console.log('   3. Click "Import"');
    console.log('   4. Select:', workflowPath);
    console.log('   5. Click "Import" and then "Activate"');
  }
}
