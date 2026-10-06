import { prisma } from "../src/lib/prisma";

async function main() {
  const BASE_URL = "http://localhost:3000";
  console.log(`[AI Integration Test] Testing AI features on ${BASE_URL}...`);

  // 1. Authenticate as Alex Pratama
  console.log("\n--- 1. Authenticating as Alex Pratama ---");
  const loginRes = await fetch(`${BASE_URL}/api/auth/sign-in/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: BASE_URL,
    },
    body: JSON.stringify({
      email: "demo@nexafinance.com",
      password: "password123",
    }),
  });

  const cookies = loginRes.headers.get("set-cookie") || "";
  if (loginRes.status !== 200) {
    throw new Error(`Login failed with status ${loginRes.status}`);
  }
  console.log("Logged in successfully. Cookie acquired.");

  const authHeaders = {
    Cookie: cookies,
    Origin: BASE_URL,
    "Content-Type": "application/json",
  };

  // 2. Fetch User Workspaces
  console.log("\n--- 2. Fetching Personal Workspace ---");
  const wsRes = await fetch(`${BASE_URL}/api/workspaces`, { headers: authHeaders });
  const wsData = await wsRes.json();
  const personalWs = wsData.workspaces.find((w: any) => w.type === "PERSONAL");
  if (!personalWs) throw new Error("Personal workspace not found!");

  // 3. Test NLP Parsing (POST /api/workspaces/[id]/ai/nlp)
  console.log("\n--- 3. Testing Natural Language Transaction Parser (Groq / NLP) ---");
  const testPhrases = [
    "Makan siang soto ayam 35rb pake cash",
    "Terima transfer freelance 4.5 jt ke BCA",
    "Transfer 300rb dari BCA ke dompet tunai",
  ];

  for (const phrase of testPhrases) {
    const nlpRes = await fetch(`${BASE_URL}/api/workspaces/${personalWs.id}/ai/nlp`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ text: phrase }),
    });
    console.log(`Input: "${phrase}"`);
    console.log(`NLP HTTP Status: ${nlpRes.status}`);
    const nlpData = await nlpRes.json();
    console.log("Parsed Entity:", {
      type: nlpData.parsed?.type,
      amount: nlpData.parsed?.amount ? `Rp ${Number(nlpData.parsed.amount).toLocaleString("id-ID")}` : 0,
      description: nlpData.parsed?.description,
      accountName: nlpData.parsed?.accountName,
      categoryName: nlpData.parsed?.categoryName,
    });
    console.log("---");
    if (nlpRes.status !== 200 || !nlpData.parsed) {
      throw new Error(`NLP parsing failed for: ${phrase}`);
    }
  }

  // 4. Test Vision Receipt OCR (POST /api/workspaces/[id]/ai/receipt)
  console.log("\n--- 4. Testing Receipt Vision OCR (Gemini Vision) ---");
  const dummyBase64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";
  const visionRes = await fetch(`${BASE_URL}/api/workspaces/${personalWs.id}/ai/receipt`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ imageBase64: dummyBase64, mimeType: "image/jpeg" }),
  });
  console.log("Vision OCR HTTP Status:", visionRes.status);
  const visionData = await visionRes.json();
  console.log("Receipt OCR Extracted:", visionData.receipt);
  if (visionRes.status !== 200 || !visionData.receipt) {
    throw new Error("Receipt Vision test failed!");
  }

  // 5. Test 50/30/20 Financial Planner (POST /api/workspaces/[id]/ai/planner)
  console.log("\n--- 5. Testing 50/30/20 Financial Planner ---");
  const plannerRes = await fetch(`${BASE_URL}/api/workspaces/${personalWs.id}/ai/planner`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ monthlyIncome: 15000000 }),
  });
  console.log("Planner HTTP Status:", plannerRes.status);
  const planData = await plannerRes.json();
  console.log("50/30/20 Plan Results:", {
    needs: `${planData.plan.needs.actualPercentage}% (Target ${planData.plan.needs.targetPercentage}%) - ${planData.plan.needs.status}`,
    wants: `${planData.plan.wants.actualPercentage}% (Target ${planData.plan.wants.targetPercentage}%) - ${planData.plan.wants.status}`,
    savings: `${planData.plan.savings.actualPercentage}% (Target ${planData.plan.savings.targetPercentage}%) - ${planData.plan.savings.status}`,
    recommendationsCount: planData.plan.aiRecommendations.length,
  });
  console.log("Sample AI Recommendation:", planData.plan.aiRecommendations[0]);

  // 6. Test Financial Advisor Chatbot (POST /api/workspaces/[id]/ai/chat)
  console.log("\n--- 6. Testing Financial Advisor Chatbot (Gemini) ---");
  const chatRes = await fetch(`${BASE_URL}/api/workspaces/${personalWs.id}/ai/chat`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      messages: [
        { role: "user", content: "Bagaimana cara mengoptimalkan anggaran pengeluaran saya bulan ini?" },
      ],
    }),
  });
  console.log("Chat HTTP Status:", chatRes.status);
  const chatData = await chatRes.json();
  console.log("AI Chat Reply Snippet:\n", chatData.reply.slice(0, 200) + "...");

  // 7. Test Web Page /ai
  console.log("\n--- 7. Testing GET /ai Web Page ---");
  const aiPageRes = await fetch(`${BASE_URL}/ai`, { headers: authHeaders });
  console.log("/ai Page Status:", aiPageRes.status);
  if (aiPageRes.status !== 200) {
    throw new Error(`Expected 200 OK for /ai, got ${aiPageRes.status}`);
  }

  console.log("\n>>> ALL AI INTEGRATION TESTS PASSED 100%! <<<");
}

main()
  .catch((e) => {
    console.error("Test failed with error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
