import type { RiskLevel } from "./types";

export interface ContractTemplate {
  id: string;
  title: string;
  description: string;
  typicalRisk: RiskLevel;
  category: string;
  preview: string;
  body: string;
}

export const CONTRACT_TEMPLATES: ContractTemplate[] = [
  {
    id: "employment",
    title: "Employment Contract",
    description:
      "Standard hire terms covering role, compensation, benefits, confidentiality, and termination for W-2 employees.",
    typicalRisk: "medium",
    category: "HR & workforce",
    preview:
      "Employee agrees to full-time employment… compensation… at-will termination… non-compete…",
    body: `EMPLOYMENT AGREEMENT

1. Position. Employee is hired as [Title] reporting to [Manager].

2. Compensation. Base salary of $[Amount] per year, paid bi-weekly, plus eligibility for annual bonus at Company discretion.

3. Benefits. Employee is eligible for health, dental, and vision plans per Company policy.

4. Confidentiality. Employee shall not disclose Confidential Information during or after employment.

5. Termination. Employment is at-will. Either party may terminate with [14] days written notice.

6. Non-Compete. For [12] months post-termination, Employee shall not solicit Company clients within [Region].`,
  },
  {
    id: "privacy-policy",
    title: "Privacy Policy",
    description:
      "Website or app privacy notice describing data collection, use, sharing, cookies, and user rights.",
    typicalRisk: "medium",
    category: "Data & compliance",
    preview:
      "We collect personal information… cookies… third-party processors… your rights…",
    body: `PRIVACY POLICY

1. Information We Collect. We collect identifiers, contact data, usage logs, and device information when you use our Services.

2. How We Use Data. We use data to provide Services, improve products, send communications, and comply with law.

3. Sharing. We share data with service providers, affiliates, and when required by law or business transfer.

4. Cookies. We use cookies and similar technologies for authentication, analytics, and advertising.

5. Your Rights. Depending on location, you may access, correct, delete, or port your data by contacting privacy@company.com.

6. Retention. We retain data as long as needed for the purposes described unless a longer period is required by law.`,
  },
  {
    id: "freelance",
    title: "Freelance Agreement",
    description:
      "Independent contractor terms for project scope, deliverables, payment, IP ownership, and liability.",
    typicalRisk: "medium",
    category: "Contractors",
    preview:
      "Independent contractor… deliverables… payment net-30… IP assignment… indemnity…",
    body: `FREELANCE / INDEPENDENT CONTRACTOR AGREEMENT

1. Services. Contractor shall perform [Project Description] per Statement of Work attached as Exhibit A.

2. Relationship. Contractor is an independent contractor, not an employee. Contractor is responsible for taxes and insurance.

3. Payment. Company shall pay $[Amount] within thirty (30) days of invoice approval.

4. Intellectual Property. All work product shall be deemed work-for-hire and assigned to Company upon payment.

5. Confidentiality. Contractor shall protect Company Confidential Information for three (3) years.

6. Liability. Contractor shall indemnify Company for claims arising from Contractor's negligence or breach.`,
  },
  {
    id: "vendor",
    title: "Vendor Agreement",
    description:
      "Supplier or vendor contract for goods/services, SLAs, pricing, warranties, and limitation of liability.",
    typicalRisk: "high",
    category: "Procurement",
    preview:
      "Vendor shall supply… SLA 99.5%… liability cap… auto-renewal… data processing…",
    body: `VENDOR AGREEMENT

1. Services. Vendor shall provide [Products/Services] as described in Exhibit A.

2. Fees. Customer shall pay fees per the Order Form. Invoices are due net thirty (30) days.

3. Service Levels. Vendor warrants 99.5% monthly uptime excluding scheduled maintenance.

4. Limitation of Liability. Except for gross negligence, neither party's liability shall exceed fees paid in the prior twelve (12) months.

5. Term. This Agreement renews automatically for one-year terms unless terminated with ninety (90) days notice.

6. Data. Vendor may process Customer Data solely to perform Services and per Customer's instructions.`,
  },
  {
    id: "rental",
    title: "Rental Agreement",
    description:
      "Residential or commercial lease covering rent, deposit, maintenance, termination, and tenant obligations.",
    typicalRisk: "medium",
    category: "Property",
    preview:
      "Landlord leases premises… monthly rent… security deposit… maintenance… default…",
    body: `RENTAL / LEASE AGREEMENT

1. Premises. Landlord leases to Tenant the property at [Address] for residential/commercial use only.

2. Term. Lease begins [Start Date] and ends [End Date], unless renewed in writing.

3. Rent. Monthly rent of $[Amount] due on the first of each month. Late fee of 5% after five (5) days.

4. Deposit. Tenant shall pay a security deposit of $[Amount], refundable less damages per state law.

5. Maintenance. Tenant shall maintain premises in good condition; Landlord handles structural repairs.

6. Default. Failure to pay rent within [10] days may result in termination and lawful eviction proceedings.`,
  },
  {
    id: "terms-of-service",
    title: "Terms of Service",
    description:
      "Platform terms governing account use, acceptable use, disclaimers, arbitration, and limitation of liability.",
    typicalRisk: "high",
    category: "Digital products",
    preview:
      "By using the Service you agree… acceptable use… disclaimer… arbitration…",
    body: `TERMS OF SERVICE

1. Acceptance. By accessing the Service, you agree to these Terms and our Privacy Policy.

2. Accounts. You must provide accurate information and safeguard credentials. You are responsible for account activity.

3. Acceptable Use. You may not reverse engineer, scrape, spam, or use the Service unlawfully.

4. Disclaimers. THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF MERCHANTABILITY OR FITNESS.

5. Limitation of Liability. OUR LIABILITY IS LIMITED TO THE GREATER OF $100 OR AMOUNTS PAID IN THE PAST 12 MONTHS.

6. Disputes. Disputes shall be resolved by binding arbitration in [Jurisdiction], waiving class actions.`,
  },
];

export function getTemplateById(id: string): ContractTemplate | undefined {
  return CONTRACT_TEMPLATES.find((t) => t.id === id);
}

export const TEMPLATE_STORAGE_KEY = "lexguard-template-load";
export const TEMPLATE_TITLE_KEY = "lexguard-template-title";
