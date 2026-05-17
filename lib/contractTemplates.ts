export interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  contractType: import("./contractTypes").ContractType;
  text: string;
}

export const CONTRACT_TEMPLATES: ContractTemplate[] = [
  {
    id: "msa-risky",
    name: "MSA (high-risk sample)",
    description: "Services agreement with liability, renewal, and data clauses",
    contractType: "msa",
    text: `MASTER SERVICES AGREEMENT

8.2 Limitation of Liability. Party shall be liable for any and all damages, including indirect, consequential, and punitive damages, without limitation.

3.1 Term. This Agreement shall automatically renew for successive twelve (12) month terms unless terminated in writing at least ninety (90) days prior to the end of the then-current term.

9.4 Indemnification. Customer shall indemnify, defend, and hold harmless Provider from any claims arising out of Customer's use of the Services.

5.3 Data. Provider may process Customer Data for product improvement, analytics, and machine learning model training.`,
  },
  {
    id: "nda-mutual",
    name: "Mutual NDA",
    description: "Standard mutual confidentiality with broad definitions",
    contractType: "nda",
    text: `MUTUAL NON-DISCLOSURE AGREEMENT

1. Definition. "Confidential Information" means all information disclosed by either party, whether oral, written, or electronic, including business plans, financial data, and technical materials.

2. Term. This Agreement remains in effect for five (5) years from the Effective Date and survives termination for an additional three (3) years.

3. Exceptions. Confidential Information does not include information that becomes publicly available through no fault of the receiving party.

4. Remedies. Receiving party acknowledges that breach may cause irreparable harm and that disclosing party may seek injunctive relief without posting bond.`,
  },
  {
    id: "saas-trial",
    name: "SaaS subscription",
    description: "Cloud subscription with auto-renewal and acceptable use",
    contractType: "saas",
    text: `SOFTWARE AS A SERVICE AGREEMENT

2.1 Subscription. Customer receives a non-exclusive license to access the Service during the Subscription Term.

4.2 Auto-Renewal. Unless Customer cancels at least thirty (30) days before renewal, the Subscription automatically renews at then-current list prices.

6.1 Acceptable Use. Customer shall not reverse engineer, scrape, or use the Service to build a competing product.

7.3 Service Levels. Provider targets 99.5% monthly uptime but service credits are Provider's sole remedy for downtime.

11.2 Data. Provider may use aggregated and de-identified usage data to improve models and publish benchmarks.`,
  },
];
