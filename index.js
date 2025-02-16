const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const GROQ_API_KEY = "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";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// Function to get disease prediction using Groq API
async function getDiagnosis(symptoms, gender, age) {
  try {
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: "llama3-8b-8192", // Choose an appropriate Groq model
        messages: [
          {
            role: "system",
            content: "You are a medical assistant trained to diagnose diseases based on symptoms."
          },
          {
            role: "user",
            content: `A ${age}-year-old ${gender} is experiencing these symptoms: ${symptoms.join(", ")}. 
                      What are the possible diseases? Provide a JSON list of probable diseases without additional text.`
          }
        ],
        temperature: 0.7
      },
      {
        headers: { Authorization: `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" }
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("Groq API Error:", error.message);
    return JSON.stringify({ error: "Diagnosis service unavailable" });
  }
}

// API Route
app.post("/diagnose", async (req, res) => {
  const { symptoms, gender, age } = req.body;

  if (!symptoms || !gender || !age) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const diagnosis = await getDiagnosis(symptoms, gender, age);
  res.json(JSON.parse(diagnosis));
});

// Start Server
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
