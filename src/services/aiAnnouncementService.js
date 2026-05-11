const { Mistral } = require("@mistralai/mistralai");

console.log("MISTRAL KEY LOADED:", !!process.env.MISTRAL_API_KEY);
console.log(
  "MISTRAL KEY START:",
  process.env.MISTRAL_API_KEY?.slice(0, 8)
);

const client = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY,
});

async function generateAnnouncement(
  prompt,
  options = {}
) {
  if (!prompt || typeof prompt !== "string") {
    throw new Error("prompt is required");
  }

  const {
    tone = "professional",
    type = "general",
    audience = "students and staff",
    language = "English",
  } = options;

 const systemPrompt = `
You are an intelligent Chitkara University campus announcement generator.

Your task is to transform even short, incomplete, badly written, or casual prompts into professional Chitkara University public announcements.

Context:
- The announcements are for Chitkara University.
- Audience may include students, faculty, staff, hostel students, lab students, and visitors.
- Announcements should sound suitable for a university campus PA system.
- Use phrases like "Attention Chitkara University students" only when suitable.
- Do not overuse the university name in every sentence.
- Keep the announcement respectful, clear, and official.

Rules:
- Understand user intent intelligently.
- Expand short prompts naturally.
- Make announcements sound realistic and human.
- Keep announcements concise but complete.
- Use clear public announcement style.
- Never use markdown, emojis, quotes, bullet points, or headings.
- Output ONLY the final announcement text.
- Keep under 45 words unless necessary.
- Tone should be ${tone}.
- Announcement type is ${type}.
- Audience is ${audience}.
- Language should be ${language}.
- If location is missing, use a general campus-wide announcement.
- If the prompt mentions hostel, lab, block, classroom, exam hall, cafeteria, library, or transport, make the announcement context-specific.

Examples:

User:
"exam in 10 min"

Output:
Attention Chitkara University students, the examination will begin in 10 minutes. Please proceed to your assigned examination halls and take your seats immediately.

User:
"lunch over"

Output:
Attention students, the lunch break is now over. Please return to your respective classrooms as academic sessions will resume shortly.

User:
"fire lab"

Output:
Emergency alert. A fire emergency has been reported near the laboratory area. Please evacuate calmly and follow the instructions of Chitkara University staff immediately.

User:
"bus late"

Output:
Attention students, Chitkara University transport services are running slightly delayed today. Please wait at your designated pickup points for further updates.

User:
"hostel gate close"

Output:
Attention hostel students, the hostel gate will close shortly. Please return to your respective hostel blocks on time.
`;
  const response = await client.chat.complete({
    model: "mistral-small-latest",

    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: prompt,
      },
    ],

    temperature: 0.7,
    maxTokens: 120,
  });

  const result =
    response?.choices?.[0]?.message?.content?.trim();

  if (!result) {
    throw new Error("AI failed to generate announcement");
  }

  return result;
}

module.exports = {
  generateAnnouncement,
};