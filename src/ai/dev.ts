import { config } from 'dotenv';
config({ path: '.env' });

// Import all flows to register them
import '@/ai/flows/summarize-student-performance';
import '@/ai/flows/generate-personalized-recommendations';
import '@/ai/flows/predict-student-risk-level';
import '@/ai/flows/run-student-analysis';
import '@/ai/flows/generate-study-plan';
import '@/ai/flows/generate-student-report';
