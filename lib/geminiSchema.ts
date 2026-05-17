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
          severity: riskLevelSchema,
          category: { type: Type.STRING },
          lineRef: { type: Type.STRING },
        },
        required: ["title", "excerpt", "severity", "category"],
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
