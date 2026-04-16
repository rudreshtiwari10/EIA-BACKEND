require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = `Test prompt`;
    const result = await model.generateContent(prompt);
    console.log(result.response.text());
  } catch (err) {
    console.error('LITERAL ERROR:', err);
  }
}
test();
