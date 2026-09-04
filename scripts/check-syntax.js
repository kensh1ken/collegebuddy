const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function collect(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collect(fullPath);
    return entry.isFile() && entry.name.endsWith('.js') ? [fullPath] : [];
  });
}

const files = [...collect(path.resolve('src')), ...collect(path.resolve('test'))];
let failures = 0;
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) {
    failures += 1;
    process.stderr.write(result.stderr);
  }
}

if (failures) process.exit(1);
console.log(`Syntax check passed for ${files.length} JavaScript files.`);
