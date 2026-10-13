// Frontend Logic Regression Test Suite

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

// 1. Currency & Privacy Formatting
function formatAmount(amount, currency = 'USD', isPrivacyMode = false) {
  if (isPrivacyMode) {
    const symbol = currency === 'USD' ? '$' : currency === 'INR' ? '₹' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '¥';
    return `${symbol}••••`;
  }
  const isNegative = amount < 0;
  const abs = Math.abs(amount);

  let formatted = '';
  switch (currency) {
    case 'INR':
      formatted = `₹${abs.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      break;
    case 'EUR':
      formatted = `€${abs.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      break;
    case 'GBP':
      formatted = `£${abs.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      break;
    case 'JPY':
      formatted = `¥${abs.toLocaleString('ja-JP', { maximumFractionDigits: 0 })}`;
      break;
    default:
      formatted = `$${abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return isNegative ? `-${formatted}` : formatted;
}

// 2. Quick Capture Text Parser
function parseQuickCaptureText(input) {
  const amountMatch = input.match(/\$?(\d+(\.\d{1,2})?)/);
  const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;

  let merchant = '';
  const atMatch = input.match(/\bat\s+([A-Za-z0-9\s'&]+?)(?=\s+(?:on|for|from|in|\$|\d)|$)/i);
  if (atMatch) {
    merchant = atMatch[1].trim();
  }

  let category = 'Other';
  const lower = input.toLowerCase();
  if (lower.includes('coffee') || lower.includes('starbucks') || lower.includes('diner') || lower.includes('lunch')) {
    category = 'Dining';
  } else if (lower.includes('grocer') || lower.includes('whole foods') || lower.includes('trader joe')) {
    category = 'Groceries';
  } else if (lower.includes('uber') || lower.includes('lyft') || lower.includes('gas') || lower.includes('transit')) {
    category = 'Transport';
  }

  return { amount, merchant, category };
}

// 3. Compounding SIP FV Formula
function calculateSipFutureValue(monthlyDeposit, annualReturnRate, years) {
  const r = annualReturnRate / 12;
  const n = years * 12;
  return monthlyDeposit * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
}

console.log('======================================================');
console.log('   FRONTEND UTILITIES REGRESSION TESTS                ');
console.log('======================================================\n');

console.log('[1/3] Testing Currency & Privacy Formatter...');
assert(formatAmount(1250.50, 'USD') === '$1,250.50', 'Format USD positive amount');
assert(formatAmount(-45.20, 'USD') === '-$45.20', 'Format USD negative expense');
assert(formatAmount(50000, 'INR').includes('₹50,000.00'), 'Format INR Indian numbering');
assert(formatAmount(850, 'USD', true) === '$••••', 'Privacy masking mode replaces amount with bullets');
assert(formatAmount(1500, 'INR', true) === '₹••••', 'Privacy masking works with INR symbol');

console.log('\n[2/3] Testing Quick Capture Natural Language Parser...');
const parsed1 = parseQuickCaptureText('Spent $14.50 at Starbucks on coffee');
assert(parsed1.amount === 14.50, 'Parsed $14.50 amount');
assert(parsed1.merchant.toLowerCase().includes('starbucks'), 'Extracted merchant "Starbucks"');
assert(parsed1.category === 'Dining', 'Auto-categorized as "Dining"');

const parsed2 = parseQuickCaptureText('Bought groceries at Whole Foods for 86');
assert(parsed2.merchant.toLowerCase().includes('whole foods'), 'Extracted merchant "Whole Foods"');
assert(parsed2.category === 'Groceries', 'Auto-categorized as "Groceries"');

console.log('\n[3/3] Testing Wealth SIP Future Value Math...');
// $500/mo at 10% for 10 years should yield ~$103,276
const fv = calculateSipFutureValue(500, 0.10, 10);
assert(fv > 100000 && fv < 110000, `SIP 10y projected corpus matches compound formula ($${fv.toFixed(2)})`);

console.log('\n======================================================');
console.log(`   FRONTEND REGRESSION: ${passed} PASSED, ${failed} FAILED`);
console.log('======================================================\n');

if (failed > 0) process.exit(1);
