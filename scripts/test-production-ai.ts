export {};

const BASE_URL = "https://nexafinance-alpha.vercel.app";

async function main() {
  console.log("=================================================");
  console.log(`🤖 TESTING AI SUITE ON PRODUCTION: ${BASE_URL}`);
  console.log("=================================================\n");

  // 1. Authenticate as Alex Pratama
  console.log("--- 1. Authenticating as Alex Pratama ---");
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

  if (loginRes.status !== 200) {
    const errText = await loginRes.text();
    throw new Error(`Login failed with status ${loginRes.status}: ${errText}`);
  }

  const rawCookies = (loginRes.headers as any).getSetCookie
    ? (loginRes.headers as any).getSetCookie()
    : [loginRes.headers.get("set-cookie") || ""];
  const cookies = rawCookies.map((c: string) => c.split(";")[0]).filter(Boolean).join("; ");
  console.log("✅ Logged in successfully. Cookie acquired.");

  const authHeaders = {
    Cookie: cookies,
    Origin: BASE_URL,
    "Content-Type": "application/json",
  };

  // 2. Fetch User Workspaces
  console.log("\n--- 2. Fetching Personal Workspace ---");
  const wsRes = await fetch(`${BASE_URL}/api/workspaces`, { headers: authHeaders });
  const wsData = await wsRes.json();
  const personalWs = wsData.workspaces?.find((w: any) => w.type === "PERSONAL");
  if (!personalWs) throw new Error("Personal workspace not found!");
  console.log(`✅ Using workspace: "${personalWs.name}" (${personalWs.id})`);

  // 3. Test NLP Parsing (POST /api/workspaces/[id]/ai/nlp)
  console.log("\n--- 3. Testing Natural Language Transaction Parser (Groq / Regex Fallback) ---");
  const testPhrases = [
    "Makan siang soto ayam 35rb pake cash",
    "Terima transfer freelance 4.5 jt ke BCA",
    "Transfer 300rb dari BCA ke dompet tunai",
  ];

  for (const phrase of testPhrases) {
    const start = performance.now();
    const nlpRes = await fetch(`${BASE_URL}/api/workspaces/${personalWs.id}/ai/nlp`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ text: phrase }),
    });
    const duration = Math.round(performance.now() - start);
    const nlpData = await nlpRes.json();
    console.log(`Input: "${phrase}" [${duration}ms]`);
    console.log("Parsed Result:", {
      type: nlpData.parsed?.type,
      amount: nlpData.parsed?.amount ? `Rp ${Number(nlpData.parsed.amount).toLocaleString("id-ID")}` : "0",
      description: nlpData.parsed?.description,
      account: nlpData.parsed?.accountName || "auto",
      category: nlpData.parsed?.categoryName || "auto",
    });
    if (nlpRes.status !== 200 || !nlpData.parsed) {
      throw new Error(`NLP parsing failed for: ${phrase}`);
    }
  }
  console.log("✅ All NLP test phrases parsed successfully!");

  // 4. Test Vision Receipt OCR (POST /api/workspaces/[id]/ai/receipt)
  console.log("\n--- 4. Testing Receipt Vision OCR (Gemini Vision / Fallback) ---");
  const dummyBase64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";
  const vStart = performance.now();
  const visionRes = await fetch(`${BASE_URL}/api/workspaces/${personalWs.id}/ai/receipt`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ imageBase64: dummyBase64, mimeType: "image/jpeg" }),
  });
  const vDuration = Math.round(performance.now() - vStart);
  const visionData = await visionRes.json();
  console.log(`Vision OCR [${vDuration}ms] Status: ${visionRes.status}`);
  console.log("Receipt OCR Extracted:", visionData.receipt);
  if (visionRes.status !== 200 || !visionData.receipt) {
    throw new Error("Receipt Vision test failed!");
  }
  console.log("✅ Receipt OCR endpoint responded successfully!");

  // 5. Test 50/30/20 Financial Planner (POST /api/workspaces/[id]/ai/planner)
  console.log("\n--- 5. Testing 50/30/20 Financial Planner ---");
  const pStart = performance.now();
  const plannerRes = await fetch(`${BASE_URL}/api/workspaces/${personalWs.id}/ai/planner`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ monthlyIncome: 15000000 }),
  });
  const pDuration = Math.round(performance.now() - pStart);
  const planData = await plannerRes.json();
  console.log(`Planner [${pDuration}ms] Status: ${plannerRes.status}`);
  if (planData.plan) {
    console.log("50/30/20 Breakdown:", {
      needs: `${planData.plan.needs.actualPercentage}% (Target ${planData.plan.needs.targetPercentage}%)`,
      wants: `${planData.plan.wants.actualPercentage}% (Target ${planData.plan.wants.targetPercentage}%)`,
      savings: `${planData.plan.savings.actualPercentage}% (Target ${planData.plan.savings.targetPercentage}%)`,
      recommendationsCount: planData.plan.aiRecommendations?.length || 0,
    });
    if (planData.plan.aiRecommendations?.[0]) {
      console.log(`Top Recommendation: "${planData.plan.aiRecommendations[0]}"`);
    }
  }
  if (plannerRes.status !== 200 || !planData.plan) {
    throw new Error("50/30/20 Planner test failed!");
  }
  console.log("✅ 50/30/20 Financial Planner generated successfully!");

  // 6. Test Financial Advisor Chatbot (POST /api/workspaces/[id]/ai/chat)
  console.log("\n--- 6. Testing Financial Advisor Chatbot (Gemini / AI Advisor) ---");
  const cStart = performance.now();
  const chatRes = await fetch(`${BASE_URL}/api/workspaces/${personalWs.id}/ai/chat`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      messages: [
        { role: "user", content: "Halo NexaAI, bagaimana kondisi keuangan saya dan saran penghematannya?" },
      ],
    }),
  });
  const cDuration = Math.round(performance.now() - cStart);
  const chatData = await chatRes.json();
  console.log(`Chatbot [${cDuration}ms] Status: ${chatRes.status}`);
  if (chatRes.status !== 200 || !chatData.reply) {
    throw new Error(`Chatbot test failed: ${JSON.stringify(chatData)}`);
  }
  console.log("AI Chat Reply:\n" + chatData.reply.slice(0, 300) + "...\n");
  console.log("✅ Financial Advisor Chatbot responded with rich context!");

  // 7. Test Web Page /ai
  console.log("--- 7. Testing GET /ai Web Page ---");
  const aiPageRes = await fetch(`${BASE_URL}/ai`, { headers: authHeaders });
  console.log("GET /ai Page Status:", aiPageRes.status);
  if (aiPageRes.status !== 200) {
    throw new Error(`Expected 200 OK for /ai, got ${aiPageRes.status}`);
  }
  console.log("✅ /ai Page rendered successfully with HTTP 200 OK!");

  console.log("\n=================================================");
  console.log("🎉 ALL 4 AI SUITE MODULES TESTED & WORKING ON PRODUCTION!");
  console.log("=================================================");
}

main().catch((err) => {
  console.error("❌ Test error:", err);
  process.exit(1);
});
