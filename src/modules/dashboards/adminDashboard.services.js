import { ObjectId } from "mongodb";
import { LOAN_APPLICATION_STATUS, LOAN_CONTRACT_STATUS, EMI_STATUS, COLLECTION_STATUS } from "../../utils/constants.js";

export async function getAdminOverviewService(db, session) {
  // Total loans
  const totalLoans = await db.collection("loan_applications").countDocuments({}, { session });

  // Active loans
  const activeLoans = await db.collection("loan_contracts").countDocuments(
    { loanStatus: { $in: [LOAN_CONTRACT_STATUS.ACTIVE, LOAN_CONTRACT_STATUS.DISBURSED] } },
    { session }
  );

  // Total customers
  const totalCustomers = await db.collection("customers").countDocuments({}, { session });

  // Total dealers
  const totalDealers = await db.collection("dealers").countDocuments({}, { session });

  // Total lenders
  const totalLenders = await db.collection("lenders").countDocuments({}, { session });

  // Total disbursed amount
  const disbursements = await db
    .collection("disbursements")
    .find({}, { session })
    .toArray();
  const totalDisbursed = disbursements.reduce((sum, d) => sum + (d.disbursedAmount || 0), 0);

  // Total collections
  const collections = await db
    .collection("collections")
    .find({ status: COLLECTION_STATUS.APPROVED }, { session })
    .toArray();
  const totalCollections = collections.reduce((sum, c) => sum + (c.amountCollected || 0), 0);

  // Pending approvals
  const pendingApprovals = await db.collection("loan_applications").countDocuments(
    { status: LOAN_APPLICATION_STATUS.UNDER_REVIEW },
    { session }
  );

  // Overdue EMIs (30+ days)
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 30);
  const overdueEmis = await db.collection("emi_schedule").countDocuments(
    {
      dueDate: { $lt: cutoffDate },
      status: { $in: [EMI_STATUS.PENDING, EMI_STATUS.OVERDUE] }
    },
    { session }
  );

  return {
    totalLoans,
    activeLoans,
    totalCustomers,
    totalDealers,
    totalLenders,
    totalDisbursed: Math.round(totalDisbursed * 100) / 100,
    totalCollections: Math.round(totalCollections * 100) / 100,
    pendingApprovals,
    overdueEmis
  };
}

export async function getAdminDisbursementService(db, session) {
  const disbursements = await db
    .collection("disbursements")
    .find({}, { session })
    .sort({ createdAt: -1 })
    .limit(100)
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
      customerId: d.customerId ? d.customerId.toString() : null,
      lenderId: d.lenderId ? d.lenderId.toString() : null
    })),
    monthlyBreakdown: Object.entries(monthlyData).map(([month, data]) => ({
      month,
      count: data.count,
      amount: Math.round(data.amount * 100) / 100
    }))
  };
}

export async function getAdminCollectionsService(db, session) {
  const collections = await db
    .collection("collections")
    .find({}, { session })
    .sort({ createdAt: -1 })
    .toArray();

  const approved = collections.filter((c) => c.status === COLLECTION_STATUS.APPROVED);
  const pending = collections.filter((c) => c.status === COLLECTION_STATUS.PENDING_LENDER_CONFIRMATION);
  const rejected = collections.filter((c) => c.status === COLLECTION_STATUS.REJECTED);

  // Group by month
  const monthlyData = {};
  approved.forEach((c) => {
    const month = new Date(c.createdAt).toISOString().substring(0, 7);
    if (!monthlyData[month]) {
      monthlyData[month] = { count: 0, amount: 0 };
    }
    monthlyData[month].count++;
    monthlyData[month].amount += c.amountCollected || 0;
  });

  return {
    totalCollections: collections.length,
    approvedCollections: approved.length,
    pendingCollections: pending.length,
    rejectedCollections: rejected.length,
    totalAmount: Math.round(
      approved.reduce((sum, c) => sum + (c.amountCollected || 0), 0) * 100
    ) / 100,
    pendingAmount: Math.round(
      pending.reduce((sum, c) => sum + (c.amountCollected || 0), 0) * 100
    ) / 100,
    monthlyBreakdown: Object.entries(monthlyData).map(([month, data]) => ({
      month,
      count: data.count,
      amount: Math.round(data.amount * 100) / 100
    })),
    recentCollections: collections.slice(0, 10).map((c) => ({
      ...c,
      id: c._id.toString(),
      loanId: c.loanId ? c.loanId.toString() : null,
      emiId: c.emiId ? c.emiId.toString() : null,
      dealerId: c.dealerId ? c.dealerId.toString() : null,
      lenderId: c.lenderId ? c.lenderId.toString() : null
    }))
  };
}

export async function getAdminNpaService(db, session) {
  const cutoff30 = new Date();
  cutoff30.setDate(cutoff30.getDate() - 30);
  const cutoff60 = new Date();
  cutoff60.setDate(cutoff60.getDate() - 60);
  const cutoff90 = new Date();
  cutoff90.setDate(cutoff90.getDate() - 90);

  const npa30 = await db.collection("emi_schedule").countDocuments(
    {
      dueDate: { $lt: cutoff30 },
      status: { $in: [EMI_STATUS.PENDING, EMI_STATUS.OVERDUE] }
    },
    { session }
  );

  const npa60 = await db.collection("emi_schedule").countDocuments(
    {
      dueDate: { $lt: cutoff60 },
      status: { $in: [EMI_STATUS.PENDING, EMI_STATUS.OVERDUE] }
    },
    { session }
  );

  const npa90 = await db.collection("emi_schedule").countDocuments(
    {
      dueDate: { $lt: cutoff90 },
      status: { $in: [EMI_STATUS.PENDING, EMI_STATUS.OVERDUE] }
    },
    { session }
  );

  // Get NPA loans
  const npaEmis = await db
    .collection("emi_schedule")
    .find(
      {
        dueDate: { $lt: cutoff30 },
        status: { $in: [EMI_STATUS.PENDING, EMI_STATUS.OVERDUE] }
      },
      { session }
    )
    .toArray();

  const loanIds = [...new Set(npaEmis.map((e) => e.loanId.toString()))];
  const npaLoans = await db
    .collection("loan_applications")
    .find(
      {
        _id: { $in: loanIds.map((id) => new ObjectId(id)) }
      },
      { session }
    )
    .toArray();

  const totalNpaAmount = npaEmis.reduce((sum, e) => sum + (e.emiAmount || 0), 0);

  return {
    npa30Days: npa30,
    npa60Days: npa60,
    npa90Days: npa90,
    totalNpaLoans: loanIds.length,
    totalNpaAmount: Math.round(totalNpaAmount * 100) / 100,
    npaLoans: npaLoans.map((l) => ({
      ...l,
      id: l._id.toString(),
      customerId: l.customerId ? l.customerId.toString() : null,
      dealerId: l.dealerId ? l.dealerId.toString() : null
    }))
  };
}
