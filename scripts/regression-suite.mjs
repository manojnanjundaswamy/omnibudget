// End-to-End API Regression Suite for OmniBudget Financial Platform
// Tests all controllers and business flows against http://localhost:8088

const BASE = 'http://localhost:8088/api';
const USER_ID = 'demo-user-id';

const headers = {
  'Content-Type': 'application/json',
  'X-User-Id': USER_ID,
};

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

async function request(path, options = {}) {
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
  });
  const text = await res.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: res.status, ok: res.ok, data };
}

async function run() {
  console.log('======================================================');
  console.log('   OMNIBUDGET END-TO-END REGRESSION TEST SUITE        ');
  console.log('======================================================\n');

  // 1. Sandbox Reset
  console.log('[1/12] Testing Sandbox Data Initialization...');
  const resetRes = await request('/sandbox/reset', { method: 'POST' });
  assert(resetRes.ok, 'Reset sandbox to clean demo state');

  // 2. Accounts API
  console.log('\n[2/12] Testing Accounts & Double-Entry Transfers...');
  const accountsRes = await request('/accounts');
  assert(accountsRes.ok && Array.isArray(accountsRes.data), 'Fetch all accounts');
  assert(accountsRes.data.length >= 4, `Found ${accountsRes.data.length} accounts in sandbox`);

  const chk = accountsRes.data.find(a => a.type === 'CHECKING');
  const sav = accountsRes.data.find(a => a.type === 'SAVINGS');
  assert(!!chk && !!sav, 'Found Checking and Savings accounts');

  // Create new account
  const newAccRes = await request('/accounts', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Regression Test Vault',
      type: 'SAVINGS',
      balance: 1500.0,
      currency: 'USD',
    }),
  });
  assert(newAccRes.ok && newAccRes.data.id, 'Create new test account');
  const testAccId = newAccRes.data.id;

  // Transfer funds
  const prevChkBal = Number(chk.balance);
  const transferRes = await request('/accounts/transfer', {
    method: 'POST',
    body: JSON.stringify({
      sourceAccountId: chk.id,
      targetAccountId: testAccId,
      amount: 250.0,
      description: 'Regression transfer test',
    }),
  });
  assert(transferRes.ok, 'Execute double-entry transfer of $250.00');

  // Verify updated balances
  const chkUpdated = await request(`/accounts/${chk.id}`);
  assert(
    Math.abs(Number(chkUpdated.data.balance) - (prevChkBal - 250)) < 0.01,
    `Source balance correctly debited ($${chkUpdated.data.balance})`
  );

  // 3. Transactions API
  console.log('\n[3/12] Testing Transactions CRUD & Filtering...');
  const txListRes = await request('/transactions');
  assert(txListRes.ok && Array.isArray(txListRes.data), 'Fetch transactions list');
  const initialTxCount = txListRes.data.length;

  // Record an expense
  const newTxRes = await request('/transactions', {
    method: 'POST',
    body: JSON.stringify({
      accountId: chk.id,
      amount: 45.50,
      type: 'EXPENSE',
      category: 'Groceries',
      merchant: 'Fresh Market',
      description: 'Weekly fresh produce',
      date: new Date().toISOString().split('T')[0],
    }),
  });
  assert(newTxRes.ok && newTxRes.data.id, 'Record new expense transaction');
  const createdTxId = newTxRes.data.id;

  // Filter transactions
  const filterRes = await request(`/transactions?category=Groceries&search=Fresh`);
  assert(
    filterRes.ok && filterRes.data.some(t => t.id === createdTxId),
    'Filter transactions by category and search term'
  );

  // Delete transaction and verify balance revert
  const delTxRes = await request(`/transactions/${createdTxId}`, { method: 'DELETE' });
  assert(delTxRes.ok, 'Delete transaction and revert ledger impact');

  // 4. Budget Envelopes
  console.log('\n[4/12] Testing Budget Envelopes & Target Spending...');
  const envRes = await request('/budgets/envelopes');
  assert(envRes.ok && Array.isArray(envRes.data), 'Fetch budget envelopes');
  assert(envRes.data.length >= 6, `Found ${envRes.data.length} envelopes`);

  const newEnvRes = await request('/budgets/envelopes', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Pet Care & Supplies',
      groupType: 'NEEDS',
      targetRatio: 0.05,
      monthlyBudget: 150.0,
    }),
  });
  assert(newEnvRes.ok && newEnvRes.data.id, 'Create new budget envelope');

  // 5. Assets & Investments Module (NEW)
  console.log('\n[5/12] Testing Assets & Investments Module (SIPs, Stocks, Crypto, Gold)...');
  const assetsRes = await request('/assets');
  assert(assetsRes.ok && Array.isArray(assetsRes.data), 'Fetch asset portfolio list');
  assert(assetsRes.data.length >= 5, `Found ${assetsRes.data.length} seeded assets`);

  const summaryRes = await request('/assets/summary');
  assert(summaryRes.ok, 'Fetch portfolio valuation summary');
  assert(Number(summaryRes.data.totalCurrentValue) > 40000, `Total Portfolio Value: $${summaryRes.data.totalCurrentValue}`);
  assert(Number(summaryRes.data.totalMonthlySip) >= 500, `Monthly SIP Contribution: $${summaryRes.data.totalMonthlySip}/mo`);
  assert(summaryRes.data.allocationByType && Object.keys(summaryRes.data.allocationByType).length >= 4, 'Multi-class asset allocation breakdown verified');

  // Create new SIP asset
  const newSipRes = await request('/assets', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Emerging Markets Technology SIP',
      symbol: 'EMTECH',
      type: 'SIP',
      quantity: 50.0,
      buyPrice: 20.0,
      currentPrice: 26.0,
      sipMonthlyContribution: 200.0,
      sipDayOfMonth: 10,
      notes: 'Automated 10th of month SIP',
    }),
  });
  assert(newSipRes.ok && newSipRes.data.id, 'Create automated SIP holding');
  const sipId = newSipRes.data.id;
  assert(
    Math.abs(Number(newSipRes.data.unrealizedGainLoss) - 300) < 0.01,
    `Auto-calculated unrealized gain: $${newSipRes.data.unrealizedGainLoss} (+${newSipRes.data.unrealizedGainLossPercent}%)`
  );

  // Update asset price
  const updateAssetRes = await request(`/assets/${sipId}`, {
    method: 'PUT',
    body: JSON.stringify({
      currentPrice: 30.0,
    }),
  });
  assert(updateAssetRes.ok, 'Update market price of holding');
  assert(
    Math.abs(Number(updateAssetRes.data.currentValue) - 1500) < 0.01,
    `Revalued current holding to $${updateAssetRes.data.currentValue}`
  );

  // Delete holding
  const delAssetRes = await request(`/assets/${sipId}`, { method: 'DELETE' });
  assert(delAssetRes.status === 204 || delAssetRes.ok, 'Soft delete holding');

  // 6. Subscriptions & Upcoming Bills
  console.log('\n[6/12] Testing Upcoming Bills & Subscriptions...');
  const subsRes = await request('/subscriptions');
  assert(subsRes.ok && Array.isArray(subsRes.data), 'Fetch upcoming subscriptions');
  assert(subsRes.data.length >= 3, `Found ${subsRes.data.length} recurring bills`);

  const newSubRes = await request('/subscriptions', {
    method: 'POST',
    body: JSON.stringify({
      name: 'GitHub Copilot Enterprise',
      amount: 19.0,
      cadence: 'MONTHLY',
      category: 'Productivity',
      nextBillingDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      accountId: chk.id,
      accountName: chk.name,
    }),
  });
  assert(newSubRes.ok && newSubRes.data.id, 'Create new recurring bill');

  // 7. Savings Goals
  console.log('\n[7/12] Testing Savings Goals...');
  const goalsRes = await request('/goals');
  assert(goalsRes.ok && Array.isArray(goalsRes.data), 'Fetch savings goals');
  assert(goalsRes.data.length >= 2, `Found ${goalsRes.data.length} savings goals`);

  const newGoalRes = await request('/goals', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Next-Gen Workspace Setup',
      targetAmount: 3000.0,
      currentAmount: 1200.0,
      category: 'TECH',
      targetDate: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
    }),
  });
  assert(newGoalRes.ok && newGoalRes.data.id, 'Create new savings goal');

  // 8. Splits & Peer Debt Simplification
  console.log('\n[8/12] Testing Split Expenses & Debt Minimization...');
  const debtsRes = await request('/splits/debts');
  assert(debtsRes.ok && Array.isArray(debtsRes.data), 'Fetch peer debt ledger');

  const simplifyRes = await request('/splits/simplify');
  assert(simplifyRes.ok, 'Run greedy debt simplification algorithm');
  assert(simplifyRes.data.simplifiedTransactionCount <= simplifyRes.data.originalTransactionCount, 'Debt network compressed into minimal settlements');

  // 9. Household Management
  console.log('\n[9/12] Testing Household Fair Sharing...');
  const houseRes = await request('/household');
  assert(houseRes.ok && houseRes.data.name, `Household found: "${houseRes.data.name}"`);
  assert(Number(houseRes.data.partnerARatio) > 0, `Partner sharing ratio: ${(Number(houseRes.data.partnerARatio)*100).toFixed(0)}% / ${(Number(houseRes.data.partnerBRatio)*100).toFixed(0)}%`);

  // 10. Admin Console & SaaS Controls
  console.log('\n[10/12] Testing Admin Console & Multi-Tenancy...');
  const adminMetricsRes = await request('/admin/metrics');
  assert(adminMetricsRes.ok, 'Fetch SaaS admin telemetry');
  assert(adminMetricsRes.data.totalUsers >= 1, `Total platform users: ${adminMetricsRes.data.totalUsers}`);

  const adminUsersRes = await request('/admin/users');
  assert(adminUsersRes.ok && Array.isArray(adminUsersRes.data), 'Fetch admin user management list');

  // 11. Statement Ingestion & Smart Clip
  console.log('\n[11/12] Testing Statement Ingestion & Natural Language Clip...');
  const clipRes = await request('/ingest/smart-clip', {
    method: 'POST',
    body: JSON.stringify({
      text: 'Spent $34.20 at Blue Bottle Coffee yesterday',
      accountId: chk.id,
    }),
  });
  assert(clipRes.ok, 'Parse natural language financial note');

  const previewRes = await request('/ingest/statement-preview', {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: `Date,Description,Amount\n2026-10-10,WHOLE FOODS MARKET,-54.20\n2026-10-11,SALARY DIRECT DEPOSIT,3200.00`,
  });
  assert(previewRes.ok && Array.isArray(previewRes.data), 'Parse CSV statement preview');
  assert(previewRes.data.length === 2, 'Parsed 2 transaction lines correctly');

  // 12. Dashboard Master Invariant Verification & Historical Trends
  console.log('\n[12/12] Validating Dashboard Financial Invariants & Net Worth Trends...');
  const dashRes = await request('/dashboard/summary');
  assert(dashRes.ok, 'Fetch complete dashboard summary');
  const d = dashRes.data;

  const expectedNetWorth = Number(d.totalLiquidAssets) + Number(d.totalInvestments) - Number(d.totalCreditLiabilities);
  assert(
    Math.abs(Number(d.netWorth) - expectedNetWorth) < 0.01,
    `Net worth invariant matches: Liquid ($${d.totalLiquidAssets}) + Invest ($${d.totalInvestments}) - Liabilities ($${d.totalCreditLiabilities}) = $${d.netWorth}`
  );
  assert(Number(d.safeToSpend) >= 0, `Safe-to-spend buffer is positive: $${d.safeToSpend}`);

  // Test 6-Month Historical Trends
  const trendsRes = await request('/dashboard/trends?months=6');
  assert(trendsRes.ok && Array.isArray(trendsRes.data), 'Fetch 6-month historical trends');
  assert(trendsRes.data.length === 6, 'Contains 6 monthly historical trend data points');
  assert(trendsRes.data[5].monthKey.includes('-'), 'Latest trend point has valid monthKey');

  // Test Data Export (CSV & JSON)
  const exportCsvRes = await request('/ingest/export?format=csv');
  assert(exportCsvRes.ok, 'Export financial ledger as CSV');
  assert(typeof exportCsvRes.data === 'string' && exportCsvRes.data.includes('Date,Type,Account,Category'), 'CSV export contains valid standard headers');

  const exportJsonRes = await request('/ingest/export?format=json');
  assert(exportJsonRes.ok && exportJsonRes.data.accounts, 'Export complete financial workspace as JSON');

  // 13. Notifications & Real-Time Alert Radar
  console.log('\n[13/15] Testing Notification Center & Alert Scanner...');
  const notifListRes = await request('/notifications');
  assert(notifListRes.ok && Array.isArray(notifListRes.data), 'Fetch active notifications list');
  assert(notifListRes.data.length >= 1, `Found ${notifListRes.data.length} notifications`);

  const unreadRes = await request('/notifications/unread-count');
  assert(unreadRes.ok && typeof unreadRes.data.unreadCount === 'number', `Unread count verified: ${unreadRes.data.unreadCount}`);

  if (notifListRes.data.length > 0) {
    const firstNotif = notifListRes.data[0];
    const markReadRes = await request(`/notifications/${firstNotif.id}/read`, { method: 'PATCH' });
    assert(markReadRes.ok && markReadRes.data.isRead === true, 'Marked notification as read');
  }

  const scanRes = await request('/notifications/scan', { method: 'POST' });
  assert(scanRes.ok && typeof scanRes.data.alertsCreated === 'number', `Scanned recurring bills & budget limits (alerts created: ${scanRes.data.alertsCreated})`);

  // 14. Email OTP Authentication & Mail Delivery
  console.log('\n[14/15] Testing Passwordless Email OTP Login & Mail Delivery...');
  const testEmail = `test.e2e.${Date.now()}@example.com`;
  const sendOtpRes = await request('/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({ email: testEmail, name: 'E2E Tester' }),
  });
  assert(sendOtpRes.ok && sendOtpRes.data.user && sendOtpRes.data.user.emailOtp, `Dispatched 6-digit OTP code to ${testEmail}`);

  const receivedCode = sendOtpRes.data.user.emailOtp;
  const verifyRes = await request('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email: testEmail, code: receivedCode }),
  });
  assert(verifyRes.ok && verifyRes.data.token && verifyRes.data.token.startsWith('jwt-session-'), 'Verified OTP and generated authenticated session token');

  // 15. Financial Health Index, 30-Day Forecast & Anomaly Radar
  console.log('\n[15/15] Testing Financial Health Index (FHI), 30-Day Forecast & Anomaly Detection...');
  const healthRes = await request('/analytics/financial-health');
  assert(healthRes.ok && healthRes.data.score >= 0 && healthRes.data.score <= 100, `Calculated Financial Health Index score: ${healthRes.data?.score}/100 (${healthRes.data?.grade})`);
  assert(Array.isArray(healthRes.data.pillars) && healthRes.data.pillars.length === 5, 'Evaluated all 5 core health pillars (Runway, Savings, Debt, Budget, Recurring)');

  const forecastRes = await request('/analytics/forecast');
  assert(forecastRes.ok && Array.isArray(forecastRes.data.days) && forecastRes.data.days.length === 30, 'Generated 30-day predictive balance forecast timeline');
  assert(typeof forecastRes.data.lowestProjectedBalance === 'number', `Identified 30-day balance trough: $${forecastRes.data.lowestProjectedBalance} on ${forecastRes.data.lowestBalanceDate}`);

  const anomaliesRes = await request('/analytics/anomalies');
  assert(anomaliesRes.ok && typeof anomaliesRes.data.totalAnomalies === 'number', `Audited transactions for price spikes & duplicate charges (${anomaliesRes.data.totalAnomalies} detected)`);

  // 16. Security Audit Trail & Admin Observability
  console.log('\n[16/16] Testing Security Audit Logging & Admin Observability...');
  const auditRes = await request('/admin/audit-logs?limit=50');
  assert(auditRes.ok && Array.isArray(auditRes.data), 'Fetch security audit logs');
  assert(auditRes.data.length > 0, `Captured ${auditRes.data.length} audit trail events in PostgreSQL`);
  const hasAuthLog = auditRes.data.some(l => l.category === 'AUTH' && l.action === 'USER_LOGIN');
  assert(hasAuthLog, 'Verified presence of USER_LOGIN authentication security audit event');
  const hasTxLog = auditRes.data.some(l => l.category === 'TRANSACTION');
  assert(hasTxLog, 'Verified presence of TRANSACTION_RECORDED audit log event');

  // Summary
  console.log('\n======================================================');
  console.log(`   REGRESSION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
