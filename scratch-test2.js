require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
  const keysStr = process.env.GEMINI_API_KEYS;
  const keys = keysStr.split(',');
  const ai = new GoogleGenerativeAI(keys[0]);
  const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

  try {
    const result = await model.generateContent("Test");
    console.log("Success with Key 1!", result.response.text());
  } catch (err) {
    console.error("ERROR WITH KEY 1:", err.message);
  }
}
test();
