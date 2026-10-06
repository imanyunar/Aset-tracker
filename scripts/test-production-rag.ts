export {};

const BASE_URL = "https://nexafinance-alpha.vercel.app";

async function main() {
  console.log("=================================================");
  console.log(`🏛️ TESTING INSTITUTIONAL RAG ON PRODUCTION: ${BASE_URL}`);
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

  if (!loginRes.ok) {
    console.error("❌ Login failed:", loginRes.status, await loginRes.text());
    process.exit(1);
  }

  const rawCookies = (loginRes.headers as any).getSetCookie
    ? (loginRes.headers as any).getSetCookie()
    : [loginRes.headers.get("set-cookie") || ""];
  const authCookie = rawCookies.map((c: string) => c.split(";")[0]).filter(Boolean).join("; ");

  console.log("✅ Authenticated successfully! Auth Cookies acquired.");

  const headers = {
    "Content-Type": "application/json",
    Cookie: authCookie,
    Origin: BASE_URL,
  };

  // 2. Fetch User Workspaces
  console.log("\n--- 2. Fetching Workspaces ---");
  const wsRes = await fetch(`${BASE_URL}/api/workspaces`, { headers });
  const wsData = await wsRes.json();
  const workspaces = wsData.workspaces || [];

  if (workspaces.length === 0) {
    console.error("❌ No workspaces found:", wsData);
    process.exit(1);
  }

  const activeWs = workspaces[0];
  console.log(`✅ Active Workspace: "${activeWs.name}" (ID: ${activeWs.id})`);

  // 3. Test RAG Live Query: INVESTMENT_BANKING Persona
  console.log("\n--- 3. Testing RAG Query: INVESTMENT BANKING Persona (DCF & WACC) ---");
  const ibRes = await fetch(`${BASE_URL}/api/workspaces/${activeWs.id}/rag/query`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      persona: "INVESTMENT_BANKING",
      query: "Bagaimana cara menyusun estimasi valuasi DCF dan menghitung WACC dengan struktur modal yang optimal?",
      enableLiveAcademicSearch: true,
    }),
  });

  const ibData = await ibRes.json();
  if (ibRes.ok) {
    console.log(`✅ RAG Persona: ${ibData.persona?.title} [${ibData.persona?.badge}]`);
    console.log(`Answer excerpt:\n${ibData.answer.slice(0, 450)}...\n`);
    console.log(`Citations returned: ${ibData.citations?.length || 0}`);
    ibData.citations?.slice(0, 3).forEach((c: any, i: number) => {
      console.log(`  [${i + 1}] [${c.sourceType}] ${c.title} (${c.authors})`);
    });
  } else {
    console.error("❌ RAG IB query failed:", ibRes.status, ibData);
  }

  // 4. Test RAG Live Query: AUDITOR Persona (PSAK Compliance)
  console.log("\n--- 4. Testing RAG Query: AUDITOR Persona (PSAK 71 / 72 Compliance) ---");
  const auditorRes = await fetch(`${BASE_URL}/api/workspaces/${activeWs.id}/rag/query`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      persona: "AUDITOR",
      query: "Bagaimana cara melakukan audit kas dan pengujian kepatuhan pencatatan pendapatan sesuai PSAK 72?",
      enableLiveAcademicSearch: true,
    }),
  });

  const auditorData = await auditorRes.json();
  if (auditorRes.ok) {
    console.log(`✅ RAG Persona: ${auditorData.persona?.title} [${auditorData.persona?.badge}]`);
    console.log(`Answer excerpt:\n${auditorData.answer.slice(0, 450)}...\n`);
    console.log(`Citations returned: ${auditorData.citations?.length || 0}`);
    auditorData.citations?.slice(0, 3).forEach((c: any, i: number) => {
      console.log(`  [${i + 1}] [${c.sourceType}] ${c.title} (${c.authors})`);
    });
  } else {
    console.error("❌ RAG Auditor query failed:", auditorRes.status, auditorData);
  }

  console.log("\n=================================================");
  console.log("🎉 PRODUCTION RAG SUITE TEST COMPLETED SUCCESSFULLY!");
  console.log("=================================================");
}

main().catch(console.error);
