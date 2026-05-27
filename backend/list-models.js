import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve('g:/All_Project/Health-Care/backend/.env') });

async function run() {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await response.json();
    console.log("Supported Models:");
    data.models.forEach(m => console.log(m.name, m.supportedGenerationMethods));
  } catch (e) {
    console.error("Error fetching models:", e);
  }
}

run();
