import { config } from 'dotenv';
config({ path: '.env' });

import '@/ai/flows/summarize-student-performance.ts';
import '@/ai/flows/generate-personalized-recommendations.ts';
import '@/ai/flows/predict-student-risk-level.ts';
import '@/ai/flows/run-student-analysis.ts';
import '@/ai/flows/generate-study-plan.ts';
import '@/ai/flows/generate-student-report.ts';
