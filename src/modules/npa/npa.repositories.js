import { ObjectId } from "mongodb";
import { EMI_STATUS } from "../../utils/constants.js";

function emiScheduleCollection(db) {
  return db.collection("emi_schedule");
}

function loanContractsCollection(db) {
  return db.collection("loan_contracts");
}

function loanApplicationsCollection(db) {
  return db.collection("loan_applications");
}

export async function getOverdueEmis(db, session, daysOverdue) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOverdue);

  return emiScheduleCollection(db)
    .find(
      {
        dueDate: { $lt: cutoffDate },
        status: { $in: [EMI_STATUS.PENDING, EMI_STATUS.OVERDUE, EMI_STATUS.PARTIAL] }
      },
      { session }
    )
    .toArray();
}

export async function getLoansWithOverdueEmis(db, session, daysOverdue) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOverdue);

  // Get overdue EMIs
  const overdueEmis = await emiScheduleCollection(db)
    .find(
      {
        dueDate: { $lt: cutoffDate },
        status: { $in: [EMI_STATUS.PENDING, EMI_STATUS.OVERDUE, EMI_STATUS.PARTIAL] }
      },
      { session }
    )
    .toArray();

  // Get unique loan IDs
  const loanIds = [...new Set(overdueEmis.map((e) => e.loanId.toString()))];

  if (loanIds.length === 0) {
    return [];
  }

  // Get loan applications
  const applications = await loanApplicationsCollection(db)
    .find(
      {
        _id: { $in: loanIds.map((id) => new ObjectId(id)) }
      },
      { session }
    )
    .toArray();

  // Get loan contracts
  const contracts = await loanContractsCollection(db)
    .find(
      {
        loanApplicationId: { $in: loanIds.map((id) => new ObjectId(id)) }
      },
      { session }
    )
    .toArray();

  // Combine data
  return applications.map((app) => {
    const contract = contracts.find((c) => c.loanApplicationId.toString() === app._id.toString());
    const loanEmis = overdueEmis.filter((e) => e.loanId.toString() === app._id.toString());

    const totalOverdue = loanEmis.reduce((sum, e) => sum + (e.emiAmount || 0), 0);
    const oldestOverdueDate = loanEmis.length > 0
      ? new Date(Math.min(...loanEmis.map((e) => new Date(e.dueDate))))
      : null;

    const daysOverdue = oldestOverdueDate
      ? Math.floor((new Date() - oldestOverdueDate) / (1000 * 60 * 60 * 24))
      : 0;

    return {
      ...app,
      contract,
      overdueEmis: loanEmis.length,
      totalOverdueAmount: totalOverdue,
      oldestOverdueDate,
      daysOverdue
    };
  });
}
