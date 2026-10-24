/**
 * MPLADS Sentinel AI — Document AI & Cross-Checking Engine (Phase 10)
 * Extraction of financial figures, dates, and cross-checking against recorded payments.
 */

export interface ExtractedDocField {
  fieldType: 'amount' | 'date' | 'vendor' | 'agency' | 'project_ref';
  value: string;
  normalizedValue: string;
  pageNumber: number;
  sourceText: string;
  confidence: number;
  extractionMethod: 'regex' | 'llm';
}

export interface VerificationDiscrepancy {
  field: string;
  documentValue: string;
  systemValue: string;
  severity: 'info' | 'warning' | 'critical';
  detail: string;
}

export interface DocumentVerificationReport {
  docId: string;
  docType: 'utilization_certificate' | 'sanction_order' | 'contractor_invoice';
  fileName: string;
  projectId: string;
  projectTitle: string;
  hasCriticalDiscrepancy: boolean;
  recommendedAction: 'accept' | 'flag_for_review' | 'reject_and_review';
  fields: ExtractedDocField[];
  discrepancies: VerificationDiscrepancy[];
}

export const SAMPLE_VERIFICATION_DOCUMENTS: DocumentVerificationReport[] = [
  {
    docId: 'doc-uc-001',
    docType: 'utilization_certificate',
    fileName: 'UC_FY24_DeepBorewell_Varanasi.pdf',
    projectId: 'proj-fraud-8',
    projectTitle: '[FLAGGED-FUND_MISUSE] Deep Borewell Piped Drinking Water Grid',
    hasCriticalDiscrepancy: true,
    recommendedAction: 'reject_and_review',
    fields: [
      {
        fieldType: 'amount',
        value: 'Rs. 1,80,00,000/-',
        normalizedValue: '18000000',
        pageNumber: 1,
        sourceText: 'Certified that out of Rs. 1,80,00,000/- of grants-in-aid sanctioned during the year...',
        confidence: 0.98,
        extractionMethod: 'regex',
      },
      {
        fieldType: 'date',
        value: '28/03/2024',
        normalizedValue: '2024-03-28',
        pageNumber: 1,
        sourceText: 'dated 28/03/2024 in favor of executing agency.',
        confidence: 0.95,
        extractionMethod: 'regex',
      },
      {
        fieldType: 'vendor',
        value: 'Ganga Valley Development Ltd',
        normalizedValue: 'Ganga Valley Development Ltd',
        pageNumber: 2,
        sourceText: 'Work completed by contractor Ganga Valley Development Ltd as per measurement book.',
        confidence: 0.89,
        extractionMethod: 'llm',
      },
    ],
    discrepancies: [
      {
        field: 'utilized_amount',
        documentValue: '₹1,80,00,000',
        systemValue: '₹8,50,000',
        severity: 'critical',
        detail: 'Document claims complete utilization of ₹1.80 Cr, but treasury PFMS ledger records physical verified utilization of only ₹8.50 Lakhs (Unaccounted gap: ₹1.715 Cr).',
      },
      {
        field: 'vendor_debarment',
        documentValue: 'Ganga Valley Development Ltd',
        systemValue: 'Blacklisted / Suspended Vendor ID: v-108',
        severity: 'critical',
        detail: 'Executing contractor cited in UC is active on the central debarred entities blacklist.',
      },
    ],
  },
  {
    docId: 'doc-so-002',
    docType: 'sanction_order',
    fileName: 'Sanction_Order_SolarLibrary_Blr.pdf',
    projectId: 'proj-std-1',
    projectTitle: 'Solar Powered Public Library & Digital Reading Room — Bengaluru Urban',
    hasCriticalDiscrepancy: false,
    recommendedAction: 'accept',
    fields: [
      {
        fieldType: 'amount',
        value: '₹ 45,00,000',
        normalizedValue: '4500000',
        pageNumber: 1,
        sourceText: 'Administrative sanction is hereby accorded for ₹ 45,00,000...',
        confidence: 0.99,
        extractionMethod: 'regex',
      },
      {
        fieldType: 'date',
        value: '10 May 2023',
        normalizedValue: '2023-05-10',
        pageNumber: 1,
        sourceText: 'Order passed on 10 May 2023 under Hon. MP recommendation scheme.',
        confidence: 0.96,
        extractionMethod: 'regex',
      },
    ],
    discrepancies: [],
  },
];

export function getDocumentDiscrepancies() {
  return [
    {
      id: 'DOC-GFR-12C-001',
      projectId: 'proj-fraud-8',
      projectTitle: 'Deep Borewell Piped Drinking Water Grid — Varanasi',
      agencyName: 'Ganga Valley Development Ltd',
      declaredSanctionAmount: 18000000,
      actualSanctionAmount: 13500000,
      discrepancyCr: 0.45,
      status: 'discrepancy_detected',
      findings: [
        {
          rule: 'GFR Rule 238(1) Amount Mismatch',
          severity: 'critical',
          message: 'Certificate asserts ₹1.80 Cr utilized, whereas MoSPI sanctioned release limit is capped at ₹1.35 Cr.',
        },
        {
          rule: 'Debarred Entity Certification',
          severity: 'critical',
          message: 'Executing contractor cited in UC is debarred on the Central Vigilance Commission register.',
        },
        {
          rule: 'Date Signature Anomaly',
          severity: 'warning',
          message: 'Signatory timestamp indicates date prior to physical technical inspection completion.',
        },
      ],
    },
    {
      id: 'DOC-GFR-12C-002',
      projectId: 'proj-std-1',
      projectTitle: 'Solar Powered Public Library & Digital Reading Room — Bengaluru Urban',
      agencyName: 'Public Works Department (PWD)',
      declaredSanctionAmount: 4500000,
      actualSanctionAmount: 4500000,
      discrepancyCr: 0,
      status: 'verified',
      findings: [
        {
          rule: 'Financial Reconciliation',
          severity: 'info',
          message: 'Three-way match verified against treasury PFMS disbursement records with 0.00 variance.',
        },
        {
          rule: 'Authorized Officer Seal',
          severity: 'info',
          message: 'Executive Engineer digital signature and stamp authenticated.',
        },
      ],
    },
    {
      id: 'DOC-GFR-12C-003',
      projectId: 'proj-fraud-4',
      projectTitle: 'Model Anganwadi Centre Upgrade — Patna',
      agencyName: 'Panchayati Raj Rural Grid Org',
      declaredSanctionAmount: 6500000,
      actualSanctionAmount: 6200000,
      discrepancyCr: 0.3,
      status: 'discrepancy_detected',
      findings: [
        {
          rule: 'Unvouched Expenditure Item',
          severity: 'warning',
          message: '₹30 Lakhs expenditure claimed under unspecified contingency line item without supporting GST invoices.',
        },
      ],
    },
  ];
}

