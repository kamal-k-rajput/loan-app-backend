import { ObjectId } from "mongodb";
import { LOAN_CONTRACT_STATUS, EMI_STATUS, COLLECTION_STATUS } from "../../utils/constants.js";

export async function getDisbursementReportService(db, session, user, filters = {}) {
  let matchFilter = {};

  if (user.role === "LENDER" && user.lenderId) {
    const contracts = await db
      .collection("loan_contracts")
      .find({ lenderId: new ObjectId(user.lenderId) }, { session })
      .toArray();
    const loanApplicationIds = contracts.map((c) => c.loanApplicationId);
    matchFilter._id = { $in: loanApplicationIds.map((id) => new ObjectId(id)) };
  } else if (user.role === "DEALER" && user.dealerId) {
    matchFilter.dealerId = new ObjectId(user.dealerId);
  }

  // Date filters
  if (filters.startDate || filters.endDate) {
    matchFilter.createdAt = {};
    if (filters.startDate) {
      matchFilter.createdAt.$gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      matchFilter.createdAt.$lte = new Date(filters.endDate);
    }
  }

  const disbursements = await db
    .collection("disbursements")
    .find(matchFilter, { session })
    .sort({ createdAt: -1 })
    .toArray();

  const totalDisbursed = disbursements.reduce((sum, d) => sum + (d.disbursedAmount || 0), 0);
  const totalLoans = disbursements.length;

  return {
    totalDisbursed: Math.round(totalDisbursed * 100) / 100,
    totalLoans,
    disbursements: disbursements.map((d) => ({
      ...d,
      id: d._id.toString(),
      loanId: d.loanId ? d.loanId.toString() : null,
      customerId: d.customerId ? d.customerId.toString() : null
    }))
  };
}

export async function getCollectionsReportService(db, session, user, filters = {}) {
  let matchFilter = {
    status: COLLECTION_STATUS.APPROVED
  };

  if (user.role === "LENDER" && user.lenderId) {
    matchFilter.lenderId = new ObjectId(user.lenderId);
  } else if (user.role === "DEALER" && user.dealerId) {
    matchFilter.dealerId = new ObjectId(user.dealerId);
  }

  if (filters.startDate || filters.endDate) {
    matchFilter.createdAt = {};
    if (filters.startDate) {
      matchFilter.createdAt.$gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      matchFilter.createdAt.$lte = new Date(filters.endDate);
    }
  }

  const collections = await db
    .collection("collections")
    .find(matchFilter, { session })
    .sort({ createdAt: -1 })
    .toArray();

  const totalCollected = collections.reduce((sum, c) => sum + (c.amountCollected || 0), 0);

  return {
    totalCollected: Math.round(totalCollected * 100) / 100,
    totalCollections: collections.length,
    collections: collections.map((c) => ({
      ...c,
      id: c._id.toString(),
      loanId: c.loanId ? c.loanId.toString() : null,
      emiId: c.emiId ? c.emiId.toString() : null
    }))
  };
}

export async function getInterestIncomeReportService(db, session, user, filters = {}) {
  let loanFilter = {};

  if (user.role === "LENDER" && user.lenderId) {
    const contracts = await db
      .collection("loan_contracts")
      .find({ lenderId: new ObjectId(user.lenderId) }, { session })
      .toArray();
    const loanApplicationIds = contracts.map((c) => c.loanApplicationId);
    loanFilter._id = { $in: loanApplicationIds.map((id) => new ObjectId(id)) };
  } else if (user.role === "DEALER" && user.dealerId) {
    loanFilter.dealerId = new ObjectId(user.dealerId);
  }

  const loans = await db
    .collection("loan_applications")
    .find(loanFilter, { session })
    .toArray();

  const loanIds = loans.map((l) => l._id);

  // Get paid EMIs
  const paidEmis = await db
    .collection("emi_schedule")
    .find(
      {
        loanId: { $in: loanIds.map((id) => new ObjectId(id)) },
        status: EMI_STATUS.PAID
      },
      { session }
    )
    .toArray();

  const totalInterest = paidEmis.reduce((sum, e) => sum + (e.interestComponent || 0), 0);
  const totalPrincipal = paidEmis.reduce((sum, e) => sum + (e.principalComponent || 0), 0);

  return {
    totalInterestIncome: Math.round(totalInterest * 100) / 100,
    totalPrincipalCollected: Math.round(totalPrincipal * 100) / 100,
    totalEmisPaid: paidEmis.length,
    interestBreakdown: paidEmis.map((e) => ({
      emiId: e._id.toString(),
      loanId: e.loanId ? e.loanId.toString() : null,
      interestAmount: e.interestComponent || 0,
      principalAmount: e.principalComponent || 0,
      paidAt: e.paidAt || e.updatedAt
    }))
  };
}

export async function getLoanPerformanceReportService(db, session, user, filters = {}) {
  let contractFilter = {};

  if (user.role === "LENDER" && user.lenderId) {
    contractFilter.lenderId = new ObjectId(user.lenderId);
  }

  const contracts = await db
    .collection("loan_contracts")
    .find(contractFilter, { session })
    .toArray();

  const loanApplicationIds = contracts.map((c) => c.loanApplicationId);

  // Get all EMIs for these loans
  const allEmis = await db
    .collection("emi_schedule")
    .find(
      {
        loanId: { $in: loanApplicationIds.map((id) => new ObjectId(id)) }
      },
      { session }
    )
    .toArray();

  const activeLoans = contracts.filter(
    (c) => c.loanStatus === LOAN_CONTRACT_STATUS.ACTIVE || c.loanStatus === LOAN_CONTRACT_STATUS.DISBURSED
  ).length;

  const closedLoans = contracts.filter((c) => c.loanStatus === LOAN_CONTRACT_STATUS.CLOSED).length;

  const paidEmis = allEmis.filter((e) => e.status === EMI_STATUS.PAID).length;
  const pendingEmis = allEmis.filter((e) => e.status === EMI_STATUS.PENDING).length;
  const overdueEmis = allEmis.filter((e) => {
    if (e.status === EMI_STATUS.OVERDUE) return true;
    if (e.status === EMI_STATUS.PENDING && new Date(e.dueDate) < new Date()) return true;
    return false;
  }).length;

  const totalPrincipal = contracts.reduce((sum, c) => sum + (c.principalAmount || 0), 0);
  const totalPaid = paidEmis
    ? allEmis
        .filter((e) => e.status === EMI_STATUS.PAID)
        .reduce((sum, e) => sum + (e.principalComponent || 0), 0)
    : 0;

  return {
    totalLoans: contracts.length,
    activeLoans,
    closedLoans,
    totalPrincipal: Math.round(totalPrincipal * 100) / 100,
    totalPaid: Math.round(totalPaid * 100) / 100,
    outstandingPrincipal: Math.round((totalPrincipal - totalPaid) * 100) / 100,
    emiStats: {
      total: allEmis.length,
      paid: paidEmis,
      pending: pendingEmis,
      overdue: overdueEmis
    },
    performanceRate: contracts.length > 0
      ? Math.round((paidEmis / allEmis.length) * 100 * 100) / 100
      : 0
  };
}

export async function getNpaReportService(db, session, user, filters = {}) {
  let loanFilter = {};

  if (user.role === "LENDER" && user.lenderId) {
    const contracts = await db
      .collection("loan_contracts")
      .find({ lenderId: new ObjectId(user.lenderId) }, { session })
      .toArray();
    const loanApplicationIds = contracts.map((c) => c.loanApplicationId);
    loanFilter._id = { $in: loanApplicationIds.map((id) => new ObjectId(id)) };
  } else if (user.role === "DEALER" && user.dealerId) {
    loanFilter.dealerId = new ObjectId(user.dealerId);
  }

  const loans = await db
    .collection("loan_applications")
    .find(loanFilter, { session })
    .toArray();

  const loanIds = loans.map((l) => l._id);

  const cutoff30 = new Date();
  cutoff30.setDate(cutoff30.getDate() - 30);
  const cutoff60 = new Date();
  cutoff60.setDate(cutoff60.getDate() - 60);
  const cutoff90 = new Date();
  cutoff90.setDate(cutoff90.getDate() - 90);

  const npa30 = await db.collection("emi_schedule").countDocuments(
    {
      loanId: { $in: loanIds.map((id) => new ObjectId(id)) },
      dueDate: { $lt: cutoff30 },
      status: { $in: [EMI_STATUS.PENDING, EMI_STATUS.OVERDUE] }
    },
    { session }
  );

  const npa60 = await db.collection("emi_schedule").countDocuments(
    {
      loanId: { $in: loanIds.map((id) => new ObjectId(id)) },
      dueDate: { $lt: cutoff60 },
      status: { $in: [EMI_STATUS.PENDING, EMI_STATUS.OVERDUE] }
    },
    { session }
  );

  const npa90 = await db.collection("emi_schedule").countDocuments(
    {
      loanId: { $in: loanIds.map((id) => new ObjectId(id)) },
      dueDate: { $lt: cutoff90 },
      status: { $in: [EMI_STATUS.PENDING, EMI_STATUS.OVERDUE] }
    },
    { session }
  );

  const npaEmis = await db
    .collection("emi_schedule")
    .find(
      {
        loanId: { $in: loanIds.map((id) => new ObjectId(id)) },
        dueDate: { $lt: cutoff30 },
        status: { $in: [EMI_STATUS.PENDING, EMI_STATUS.OVERDUE] }
      },
      { session }
    )
    .toArray();

  const totalNpaAmount = npaEmis.reduce((sum, e) => sum + (e.emiAmount || 0), 0);

  return {
    npa30Days: npa30,
    npa60Days: npa60,
    npa90Days: npa90,
    totalNpaAmount: Math.round(totalNpaAmount * 100) / 100,
    npaPercentage: loans.length > 0
      ? Math.round((npa30 / loans.length) * 100 * 100) / 100
      : 0
  };
}
