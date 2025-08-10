#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Coverage validation script for pre-commit hooks
 *
 * This script:
 * 1. Checks if there are staged TypeScript files
 * 2. Runs tests with coverage
 * 3. Validates coverage thresholds are met
 * 4. Ensures new code has proper test coverage
 */

const COVERAGE_THRESHOLDS = {
  branches: 80,
  functions: 80,
  lines: 80,
  statements: 80,
};

const COVERAGE_SUMMARY_PATH = path.join(
  __dirname,
  '..',
  'coverage',
  'coverage-summary.json',
);

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m', // Cyan
    success: '\x1b[32m', // Green
    warning: '\x1b[33m', // Yellow
    error: '\x1b[31m', // Red
    reset: '\x1b[0m',
  };

  console.log(`${colors[type]}${message}${colors.reset}`);
}

function getStagedTypeScriptFiles() {
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=ACM', {
      encoding: 'utf8',
    });
    return output
      .split('\n')
      .filter(
        (file) =>
          file.trim() && file.endsWith('.ts') && !file.includes('.spec.ts'),
      )
      .filter((file) => file.startsWith('src/'));
  } catch (error) {
    log('Error getting staged files', 'error');
    return [];
  }
}

function runTestsWithCoverage() {
  try {
    log('Running tests with coverage...', 'info');

    // Run tests with coverage
    execSync('npm run test:cov:strict', {
      stdio: 'inherit',
      cwd: process.cwd(),
    });

    log('✅ Tests completed successfully', 'success');
    return true;
  } catch (error) {
    log('❌ Tests failed', 'error');
    return false;
  }
}

function validateCoverageThresholds() {
  try {
    // Check if coverage summary file exists
    if (!fs.existsSync(COVERAGE_SUMMARY_PATH)) {
      log(
        '❌ Coverage summary not found. Ensure Jest is configured with coverage.',
        'error',
      );
      return false;
    }

    const coverageSummary = JSON.parse(
      fs.readFileSync(COVERAGE_SUMMARY_PATH, 'utf8'),
    );
    const totalCoverage = coverageSummary.total;

    log('\n📊 Coverage Summary:', 'info');
    log(
      `Branches: ${totalCoverage.branches.pct}% (threshold: ${COVERAGE_THRESHOLDS.branches}%)`,
      totalCoverage.branches.pct >= COVERAGE_THRESHOLDS.branches
        ? 'success'
        : 'error',
    );
    log(
      `Functions: ${totalCoverage.functions.pct}% (threshold: ${COVERAGE_THRESHOLDS.functions}%)`,
      totalCoverage.functions.pct >= COVERAGE_THRESHOLDS.functions
        ? 'success'
        : 'error',
    );
    log(
      `Lines: ${totalCoverage.lines.pct}% (threshold: ${COVERAGE_THRESHOLDS.lines}%)`,
      totalCoverage.lines.pct >= COVERAGE_THRESHOLDS.lines
        ? 'success'
        : 'error',
    );
    log(
      `Statements: ${totalCoverage.statements.pct}% (threshold: ${COVERAGE_THRESHOLDS.statements}%)`,
      totalCoverage.statements.pct >= COVERAGE_THRESHOLDS.statements
        ? 'success'
        : 'error',
    );

    // Check if all thresholds are met
    const thresholdsMet =
      totalCoverage.branches.pct >= COVERAGE_THRESHOLDS.branches &&
      totalCoverage.functions.pct >= COVERAGE_THRESHOLDS.functions &&
      totalCoverage.lines.pct >= COVERAGE_THRESHOLDS.lines &&
      totalCoverage.statements.pct >= COVERAGE_THRESHOLDS.statements;

    if (thresholdsMet) {
      log('✅ All coverage thresholds met!', 'success');
      return true;
    } else {
      log('❌ Coverage thresholds not met. Please add more tests.', 'error');
      return false;
    }
  } catch (error) {
    log(`❌ Error validating coverage: ${error.message}`, 'error');
    return false;
  }
}

function checkForTestFiles(stagedFiles) {
  const missingTests = [];

  for (const file of stagedFiles) {
    const testFile = file.replace('.ts', '.spec.ts');
    if (!fs.existsSync(testFile)) {
      missingTests.push(file);
    }
  }

  if (missingTests.length > 0) {
    log(
      '\n⚠️  Warning: Some staged files may not have corresponding test files:',
      'warning',
    );
    missingTests.forEach((file) => log(`  - ${file}`, 'warning'));
    log(
      '  Consider adding tests for these files to maintain coverage.',
      'warning',
    );
  }

  return missingTests.length === 0;
}

function main() {
  log('🧪 Running pre-commit test coverage validation...', 'info');

  // Get staged TypeScript files
  const stagedFiles = getStagedTypeScriptFiles();

  if (stagedFiles.length === 0) {
    log('ℹ️  No TypeScript files staged for testing', 'info');
    return;
  }

  log(`📝 Found ${stagedFiles.length} staged TypeScript files:`, 'info');
  stagedFiles.forEach((file) => log(`  - ${file}`, 'info'));

  // Check for missing test files
  checkForTestFiles(stagedFiles);

  // Run tests with coverage
  if (!runTestsWithCoverage()) {
    process.exit(1);
  }

  // Validate coverage thresholds
  if (!validateCoverageThresholds()) {
    log('\n💡 Tips to improve coverage:', 'warning');
    log('  - Add unit tests for new functions and methods', 'warning');
    log('  - Test edge cases and error scenarios', 'warning');
    log('  - Ensure all code paths are covered', 'warning');
    log(
      '  - Run "npm run test:cov" to see detailed coverage report',
      'warning',
    );
    log(
      '  - Check the coverage report at coverage/lcov-report/index.html',
      'warning',
    );
    process.exit(1);
  }

  log('🎉 Pre-commit coverage validation passed!', 'success');
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  getStagedTypeScriptFiles,
  runTestsWithCoverage,
  validateCoverageThresholds,
  checkForTestFiles,
  COVERAGE_THRESHOLDS,
};
