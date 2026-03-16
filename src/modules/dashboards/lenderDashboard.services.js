import { ObjectId } from "mongodb";
import { LOAN_CONTRACT_STATUS, EMI_STATUS, COLLECTION_STATUS } from "../../utils/constants.js";

export async function getLenderPortfolioService(db, session, lenderId) {
  const contracts = await db
    .collection("loan_contracts")
    .find({ lenderId: new ObjectId(lenderId) }, { session })
    .toArray();

  const activeContracts = contracts.filter(
    (c) => c.loanStatus === LOAN_CONTRACT_STATUS.ACTIVE || c.loanStatus === LOAN_CONTRACT_STATUS.DISBURSED
  );

  // Get all EMIs for these contracts
  const loanIds = contracts.map((c) => c.loanApplicationId);
  const allEmis = await db
    .collection("emi_schedule")
    .find(
      {
        loanId: { $in: loanIds.map((id) => new ObjectId(id)) }
      },
      { session }
    )
    .toArray();

  const paidEmis = allEmis.filter((e) => e.status === EMI_STATUS.PAID);
  const pendingEmis = allEmis.filter((e) => e.status === EMI_STATUS.PENDING);

  const totalPrincipal = contracts.reduce((sum, c) => sum + (c.principalAmount || 0), 0);
  const totalDisbursed = contracts.reduce((sum, c) => sum + (c.disbursedAmount || 0), 0);
  const totalPaid = paidEmis.reduce((sum, e) => sum + (e.principalComponent || 0), 0);
  const totalInterestEarned = paidEmis.reduce((sum, e) => sum + (e.interestComponent || 0), 0);
  const outstandingPrincipal = totalPrincipal - totalPaid;

  return {
    totalLoans: contracts.length,
    activeLoans: activeContracts.length,
    totalPrincipal: Math.round(totalPrincipal * 100) / 100,
    totalDisbursed: Math.round(totalDisbursed * 100) / 100,
    outstandingPrincipal: Math.round(outstandingPrincipal * 100) / 100,
    totalPaid: Math.round(totalPaid * 100) / 100,
    totalInterestEarned: Math.round(totalInterestEarned * 100) / 100,
    paidEmis: paidEmis.length,
    pendingEmis: pendingEmis.length,
    totalEmis: allEmis.length
  };
}

export async function getLenderDisbursementService(db, session, lenderId) {
  const disbursements = await db
    .collection("disbursements")
    .find({ lenderId: new ObjectId(lenderId) }, { session })
    .sort({ createdAt: -1 })
    .toArray();

  // Group by month
  const monthlyData = {};
  disbursements.forEach((d) => {
    const month = new Date(d.disbursementDate || d.createdAt).toISOString().substring(0, 7);
    if (!monthlyData[month]) {
      monthlyData[month] = { count: 0, amount: 0 };
    }
    monthlyData[month].count++;
    monthlyData[month].amount += d.disbursedAmount || 0;
  });

  return {
    totalDisbursements: disbursements.length,
    totalAmount: Math.round(
      disbursements.reduce((sum, d) => sum + (d.disbursedAmount || 0), 0) * 100
    ) / 100,
    recentDisbursements: disbursements.slice(0, 10).map((d) => ({
      ...d,
      id: d._id.toString(),
      loanId: d.loanId ? d.loanId.toString() : null,
      customerId: d.customerId ? d.customerId.toString() : null
    })),
    monthlyBreakdown: Object.entries(monthlyData).map(([month, data]) => ({
      month,
      count: data.count,
      amount: Math.round(data.amount * 100) / 100
    }))
  };
}

export async function getLenderOutstandingService(db, session, lenderId) {
  const contracts = await db
    .collection("loan_contracts")
    .find(
      {
        lenderId: new ObjectId(lenderId),
        loanStatus: { $in: [LOAN_CONTRACT_STATUS.ACTIVE, LOAN_CONTRACT_STATUS.DISBURSED] }
      },
      { session }
    )
    .toArray();

  const loanIds = contracts.map((c) => c.loanApplicationId);

  // Get pending EMIs
  const pendingEmis = await db
    .collection("emi_schedule")
    .find(
      {
        loanId: { $in: loanIds.map((id) => new ObjectId(id)) },
        status: { $in: [EMI_STATUS.PENDING, EMI_STATUS.OVERDUE, EMI_STATUS.PARTIAL] }
      },
      { session }
    )
    .toArray();

  const totalOutstanding = pendingEmis.reduce((sum, e) => sum + (e.emiAmount || 0), 0);
  const principalOutstanding = pendingEmis.reduce((sum, e) => sum + (e.principalComponent || 0), 0);
  const interestOutstanding = pendingEmis.reduce((sum, e) => sum + (e.interestComponent || 0), 0);

  // Group by loan
  const loanOutstanding = {};
  pendingEmis.forEach((e) => {
    const loanId = e.loanId.toString();
    if (!loanOutstanding[loanId]) {
      loanOutstanding[loanId] = {
        loanId,
        emiCount: 0,
        totalAmount: 0,
        principal: 0,
        interest: 0
      };
    }
    loanOutstanding[loanId].emiCount++;
    loanOutstanding[loanId].totalAmount += e.emiAmount || 0;
    loanOutstanding[loanId].principal += e.principalComponent || 0;
    loanOutstanding[loanId].interest += e.interestComponent || 0;
  });

  return {
    totalOutstanding: Math.round(totalOutstanding * 100) / 100,
    principalOutstanding: Math.round(principalOutstanding * 100) / 100,
    interestOutstanding: Math.round(interestOutstanding * 100) / 100,
    totalPendingEmis: pendingEmis.length,
    loansWithOutstanding: Object.keys(loanOutstanding).length,
    loanBreakdown: Object.values(loanOutstanding).map((lo) => ({
      ...lo,
      totalAmount: Math.round(lo.totalAmount * 100) / 100,
      principal: Math.round(lo.principal * 100) / 100,
      interest: Math.round(lo.interest * 100) / 100
    }))
  };
}

export async function getLenderNpaService(db, session, lenderId) {
  const contracts = await db
    .collection("loan_contracts")
    .find({ lenderId: new ObjectId(lenderId) }, { session })
    .toArray();

  const loanIds = contracts.map((c) => c.loanApplicationId);

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
    totalNpaAmount: Math.round(totalNpaAmount * 100) / 100
  };
}

export async function getLenderPendingCollectionsService(db, session, lenderId) {
  const pendingCollections = await db
    .collection("collections")
    .find(
      {
        lenderId: new ObjectId(lenderId),
        status: COLLECTION_STATUS.PENDING_LENDER_CONFIRMATION
      },
      { session }
    )
    .sort({ createdAt: -1 })
    .toArray();

  const totalPendingAmount = pendingCollections.reduce((sum, c) => sum + (c.amountCollected || 0), 0);

  return {
    totalPending: pendingCollections.length,
    totalPendingAmount: Math.round(totalPendingAmount * 100) / 100,
    collections: pendingCollections.map((c) => ({
      ...c,
      id: c._id.toString(),
      loanId: c.loanId ? c.loanId.toString() : null,
      emiId: c.emiId ? c.emiId.toString() : null,
      dealerId: c.dealerId ? c.dealerId.toString() : null
    }))
  };
}
