import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function testApiKey() {
  const key = process.env.GOOGLE_API_KEY;
  
  if (!key) {
    console.error("❌ Error: GOOGLE_API_KEY is not set in the .env file.");
    process.exit(1);
  }

  console.log("Checking Google API key...");

  try {
    const ai = new GoogleGenAI({ apiKey: key });
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Respond with exactly this text: '✅ Connection successful!'",
    });

    console.log("\nStatus: " + response.text);
    console.log("\nYour Gemini API key is valid and working correctly!");
  } catch (error) {
    console.error("\n❌ Error: Failed to connect to Gemini API. Your key may be invalid.");
    console.error("Details:", error.message || error);
    process.exit(1);
  }
}

testApiKey();
