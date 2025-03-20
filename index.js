const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors()); // Add CORS middleware
app.use(express.json());

const GROQ_API_KEY = "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";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// Function to clean and parse JSON from LLM response
function cleanAndParseJSON(text) {
  try {
    // Remove any markdown code blocks
    let cleaned = text.replace(/```json\n?|\n?```/g, '');
    
    // Find the JSON object in the text
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }
    
    // Parse the JSON
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate the expected structure
    if (!parsed.diseases || !Array.isArray(parsed.diseases)) {
      throw new Error("Invalid response structure");
    }
    
    return parsed;
  } catch (error) {
    console.error("JSON parsing error:", error);
    return { 
      diseases: [], 
      error: "Failed to parse diagnosis results" 
    };
  }
}

// Function to get disease prediction using Groq API
async function getDiagnosis(symptomDescription, gender, age) {
  try {
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: "llama3-8b-8192",
        messages: [
          {
            role: "system",
            content: "You are a medical assistant trained to diagnose diseases and suggest medicines based on symptoms."
          },
        {
  role: "user",
  content: `A ${age}-year-old ${gender} is experiencing the following symptoms: "${symptomDescription}".  
            
            1. What are the possible diseases?  
            2. What are the general effective medicines **generic medicines** (not brand names) used to treat each disease?  
            3. Ensure the medicine names are simple and easy to understand.  
            
            Return the response in **this JSON format**:  
            { 
              "diseases": [ 
                { 
                  "name": "Disease 1",  
                  "medicines": ["medicine 1", "medicine 2"] 
                }, 
                { 
                  "name": "Disease 2",  
                  "medicines": ["medicine 1", "medicine 2"] 
                }, 
              ] 
            }`
        }

        ],
        temperature: 0.7
      },
      {
        headers: { 
          Authorization: `Bearer ${GROQ_API_KEY}`, 
          "Content-Type": "application/json" 
        }
      }
    );

    const rawContent = response.data.choices[0].message.content;
    return cleanAndParseJSON(rawContent);
  } catch (error) {
    console.error("Groq API Error:", error.message);
    return { 
      diseases: [], 
      error: "Diagnosis service unavailable" 
    };
  }
}

// API Route
app.post("/diagnose", async (req, res) => {
  const { symptomDescription, gender, age } = req.body;

  if (!symptomDescription || !gender || !age) {
    return res.status(400).json({ 
      diseases: [], 
      error: "Missing required fields" 
    });
  }

  const diagnosis = await getDiagnosis(symptomDescription, gender, age);
  res.json(diagnosis);
});

// Start Server
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));