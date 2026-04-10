// SPDX-License-Identifier: Apache-2.0

/*
 Simple version bump script for this repo.
 Usage:
   node scripts/bump-contracts-version.js --semver=1.2.3 [--snapshot=true]

 It updates the "version" field in:
   - package.json (repo root)
   - contracts/package.json
*/

import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';

import replace from 'replace';

const versionRegex = /^\d+\.\d+\.\d+(-[\w.]+)?$/i;
const newVersion = process.env.SEM_VER;
const isSnapshot = process.env.SNAPSHOT ? process.env.SNAPSHOT === 'true' : false;

function checkVersion(semver) {
  if (!semver) {
    console.error('semver cannot be blank');
    process.exit(1);
  }

  if (!versionRegex.test(semver)) {
    console.error(
      `semver '${semver}' must be Semantic Version <Major>.<Minor>.<Patch>[-<type>], e.g. '0.20.0' or '0.20.0-rc1'`,
    );
    process.exit(1);
  }

  return semver;
}

function existing(paths) {
  return paths.filter((p) => existsSync(p));
}

checkVersion(newVersion);

console.log(`Bumping contracts version to: ${newVersion}`);
console.log(`isSnapshot: ${isSnapshot}`);

const jsonVersionFiles = existing(['package.json', 'contracts/package.json']);

if (jsonVersionFiles.length > 0) {
  replace({
    regex: /"version": "\d+\.\d+\.\d+(-[\w.]+)?"/g,
    replacement: `"version": "${newVersion}"`,
    paths: jsonVersionFiles,
    recursive: false,
    silent: false,
  });
}

const yamlVersionFiles = existing([]);

if (yamlVersionFiles.length > 0) {
  replace({
    regex: /version: \d+\.\d+\.\d+(-[\w.]+)?/g,
    replacement: `version: ${newVersion}`,
    paths: yamlVersionFiles,
    recursive: false,
    silent: false,
  });

  replace({
    regex: /appVersion: "\d+\.\d+\.\d+(-[\w.]+)?"/g,
    replacement: `appVersion: "${newVersion}"`,
    paths: yamlVersionFiles,
    recursive: false,
    silent: false,
  });
}

if (!isSnapshot) {
  console.log(
    'Non-snapshot release: apply any release-only replacements here if needed.',
  );
}

execSync('npm install', { stdio: 'inherit' });

console.log('Contracts version bump completed successfully.');
