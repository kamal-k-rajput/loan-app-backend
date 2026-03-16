import {
  createDocument,
  getDocumentsByCustomer,
  updateDocumentStatus,
  updateCustomerKycStatus,
  getCustomerById
} from "./kyc.repositories.js";
import { CUSTOMER_KYC_STATUS } from "../../utils/constants.js";
import { ObjectId } from "mongodb";
import { fetchData } from "../../utils/fetchData.js";

export async function uploadKycService(db, session, payload) {
  const { customerId, documentType, fileUrl } = payload;

  // Check if customer exists
  const customer = await getCustomerById(db, session, customerId);
  if (!customer) {
    throw new Error("CUSTOMER_NOT_FOUND");
  }

  // Check if document already exists for this customer and type
  const existingDocs = await getDocumentsByCustomer(db, session, customerId);
  const existingDoc = existingDocs.find((d) => d.documentType === documentType);

  if (existingDoc) {
    // Update existing document
    await updateDocumentStatus(db, session, customerId, documentType, "UPLOADED", {
      fileUrl
    });
    return { ...existingDoc, fileUrl, status: "UPLOADED" };
  }

  // Create new document
  const doc = {
    customerId: new ObjectId(customerId),
    documentType,
    fileUrl
  };

  const document = await createDocument(db, session, doc);

  // Update customer KYC status to PENDING if not already set
  if (customer.kycStatus !== CUSTOMER_KYC_STATUS.PENDING) {
    await updateCustomerKycStatus(db, session, customerId, CUSTOMER_KYC_STATUS.PENDING);
  }

  return { ...document, id: document._id.toString() };
}

export async function getKycByCustomerService(db, session, customerId) {
  const customer = await getCustomerById(db, session, customerId);
  if (!customer) {
    return null;
  }

  const documents = await getDocumentsByCustomer(db, session, customerId);
  return {
    customerId: customer._id.toString(),
    kycStatus: customer.kycStatus || CUSTOMER_KYC_STATUS.PENDING,
    documents: documents.map((d) => ({
      ...d,
      id: d._id.toString(),
      customerId: d.customerId.toString()
    }))
  };
}

export async function verifyKycService(db, session, customerId, remarks) {
  const customer = await getCustomerById(db, session, customerId);
  if (!customer) {
    throw new Error("CUSTOMER_NOT_FOUND");
  }

  // Update all documents to VERIFIED
  await updateDocumentStatus(db, session, customerId, null, "VERIFIED", { remarks });

  // Update customer KYC status
  await updateCustomerKycStatus(db, session, customerId, CUSTOMER_KYC_STATUS.VERIFIED);

  return { customerId, kycStatus: CUSTOMER_KYC_STATUS.VERIFIED };
}

export async function rejectKycService(db, session, customerId, reason) {
  const customer = await getCustomerById(db, session, customerId);
  if (!customer) {
    throw new Error("CUSTOMER_NOT_FOUND");
  }

  // Update all documents to REJECTED
  await updateDocumentStatus(db, session, customerId, null, "REJECTED", { reason });

  // Update customer KYC status
  await updateCustomerKycStatus(db, session, customerId, CUSTOMER_KYC_STATUS.REJECTED);

  return { customerId, kycStatus: CUSTOMER_KYC_STATUS.REJECTED, reason };
}

export async function panVerifyService(db, session, customerId, panNumber) {
  const customer = await getCustomerById(db, session, customerId);
  if (!customer) {
    throw new Error("CUSTOMER_NOT_FOUND");
  }

  // In production, call external PAN verification API
  // For now, simulate verification
  const verificationResult = {
    panNumber,
    isValid: true,
    name: customer.name,
    verifiedAt: new Date()
  };

  // Store verification result in document
  await updateDocumentStatus(db, session, customerId, "PAN", "VERIFIED", {
    verificationData: verificationResult
  });

  return verificationResult;
}

export async function aadharVerifyService(db, session, customerId, aadharNumber) {
  const customer = await getCustomerById(db, session, customerId);
  if (!customer) {
    throw new Error("CUSTOMER_NOT_FOUND");
  }

  // In production, call external Aadhaar verification API
  // For now, simulate verification
  const verificationResult = {
    aadharNumber,
    isValid: true,
    name: customer.name,
    verifiedAt: new Date()
  };

  // Store verification result in document
  await updateDocumentStatus(db, session, customerId, "AADHAR", "VERIFIED", {
    verificationData: verificationResult
  });

  return verificationResult;
}
