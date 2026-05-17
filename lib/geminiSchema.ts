import { Type } from "@google/genai";

const riskLevelSchema = {
  type: Type.STRING,
  enum: ["low", "medium", "high"],
};

/** JSON schema for Gemini structured contract analysis output */
export const contractAnalysisJsonSchema = {
  type: Type.OBJECT,
  properties: {
    overallRisk: {
      type: Type.STRING,
      description: "Overall contract risk level",
      enum: ["low", "medium", "high"],
    },
    documentType: {
      type: Type.STRING,
      description:
        "Detected document category. Prefer: Employment Agreement, Privacy Policy, Vendor Agreement, Subscription Terms, Freelance Contract, Rental Agreement, Master Services Agreement, Non-Disclosure Agreement, Terms of Service, Lease Agreement, Partnership Agreement, or Other with a short custom label.",
    },
    documentTypeConfidence: {
      type: Type.NUMBER,
      description: "Confidence 0-100 that documentType is correct",
    },
    riskScores: {
      type: Type.OBJECT,
      properties: {
        low: { type: Type.NUMBER },
        medium: { type: Type.NUMBER },
        high: { type: Type.NUMBER },
      },
      required: ["low", "medium", "high"],
    },
    plainEnglish: {
      type: Type.STRING,
      description: "2-4 paragraph plain-English summary for a non-lawyer",
    },
    riskyClauses: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          excerpt: { type: Type.STRING },
          explanation: {
            type: Type.STRING,
            description:
              "1-2 sentence plain-English explanation of why this clause is risky",
          },
          severity: riskLevelSchema,
          category: { type: Type.STRING },
          lineRef: { type: Type.STRING },
        },
        required: ["title", "excerpt", "explanation", "severity", "category"],
      },
    },
    obligations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING },
          party: { type: Type.STRING },
        },
        required: ["text"],
      },
    },
    liabilities: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING },
          party: { type: Type.STRING },
        },
        required: ["text"],
      },
    },
    privacyConcerns: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          severity: riskLevelSchema,
        },
        required: ["title", "description", "severity"],
      },
    },
    recommendations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          priority: riskLevelSchema,
        },
        required: ["title", "description", "priority"],
      },
    },
    findings: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          confidence: { type: Type.NUMBER },
          tag: { type: Type.STRING },
          severity: riskLevelSchema,
        },
        required: ["title", "description", "confidence", "tag", "severity"],
      },
    },
  },
  required: [
    "overallRisk",
    "documentType",
    "documentTypeConfidence",
    "riskScores",
    "plainEnglish",
    "riskyClauses",
    "obligations",
    "liabilities",
    "privacyConcerns",
    "recommendations",
    "findings",
  ],
};
