export interface AcademicPaper {
  id: string;
  title: string;
  authors: string[];
  year: number;
  journalOrSource: string;
  abstract: string;
  doi?: string;
  url: string;
  pdfUrl?: string;
  scope: "INTERNATIONAL" | "NATIONAL" | "REGULATORY";
  category: "INVESTMENT_BANKING" | "ASSET_MANAGEMENT" | "AUDITOR" | "FINANCIAL_CONSULTANT";
}

/**
 * Clean HTML or XML tags from string
 */
function cleanXmlText(text: string): string {
  return text
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Crawl & search arXiv Quantitative Finance repository (q-fin)
 */
export async function searchArxivFinance(
  query: string,
  limit = 4
): Promise<AcademicPaper[]> {
  try {
    // Categories: q-fin.PM (Portfolio Management), q-fin.PR (Pricing of Securities),
    // q-fin.RM (Risk Management), q-fin.MF (Mathematical Finance), q-fin.GN (General Finance)
    const encodedQuery = encodeURIComponent(query);
    const url = `https://export.arxiv.org/api/query?search_query=all:${encodedQuery}+AND+(cat:q-fin.PM+OR+cat:q-fin.PR+OR+cat:q-fin.RM+OR+cat:q-fin.MF+OR+cat:q-fin.GN+OR+cat:econ.GN)&start=0&max_results=${limit}&sortBy=relevance`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "NexaFinance-Academic-RAG/1.0" },
    });
    clearTimeout(timeout);

    if (!res.status || res.status !== 200) {
      return [];
    }

    const xml = await res.text();
    const papers: AcademicPaper[] = [];

    // Parse entry tags in XML Atom feed
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let match: RegExpExecArray | null;

    while ((match = entryRegex.exec(xml)) !== null && papers.length < limit) {
      const entryContent = match[1];

      const titleMatch = entryContent.match(/<title>([\s\S]*?)<\/title>/);
      const summaryMatch = entryContent.match(/<summary>([\s\S]*?)<\/summary>/);
      const idMatch = entryContent.match(/<id>([\s\S]*?)<\/id>/);
      const publishedMatch = entryContent.match(/<published>(\d{4})/);

      const authors: string[] = [];
      const authorRegex = /<author>\s*<name>([\s\S]*?)<\/name>/g;
      let aMatch: RegExpExecArray | null;
      while ((aMatch = authorRegex.exec(entryContent)) !== null) {
        authors.push(cleanXmlText(aMatch[1]));
      }

      const title = titleMatch ? cleanXmlText(titleMatch[1]) : "Untitled Quantitative Finance Paper";
      const abstract = summaryMatch ? cleanXmlText(summaryMatch[1]) : "";
      const paperUrl = idMatch ? cleanXmlText(idMatch[1]) : "https://arxiv.org/archive/q-fin";
      const year = publishedMatch ? parseInt(publishedMatch[1], 10) : new Date().getFullYear();

      papers.push({
        id: `arxiv_${paperUrl.split("/").pop() || Math.random().toString(36).substring(7)}`,
        title,
        authors: authors.length > 0 ? authors : ["Quantitative Finance Researcher"],
        year,
        journalOrSource: "arXiv Quantitative Finance (Cornell University)",
        abstract,
        url: paperUrl,
        pdfUrl: paperUrl.replace("/abs/", "/pdf/") + ".pdf",
        scope: "INTERNATIONAL",
        category: categorizeByTopic(title + " " + abstract),
      });
    }

    return papers;
  } catch (err) {
    console.warn("[AcademicCrawler] arXiv query failed:", err);
    return [];
  }
}

/**
 * Crawl & search OpenAlex global open-access scientific publications
 */
export async function searchOpenAlex(
  query: string,
  limit = 4
): Promise<AcademicPaper[]> {
  try {
    const encoded = encodeURIComponent(query);
    const url = `https://api.openalex.org/works?search=${encoded}&per_page=${limit}&sort=relevance_score:desc`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "NexaFinance-Academic-RAG/1.0 (mailto:admin@nexafinance.com)",
      },
    });
    clearTimeout(timeout);

    if (res.status !== 200) return [];

    const data = await res.json();
    if (!data.results || !Array.isArray(data.results)) return [];

    return data.results.slice(0, limit).map((work: any) => {
      const authors = (work.authorships || [])
        .map((a: any) => a.author?.display_name)
        .filter(Boolean);

      // OpenAlex abstract is an inverted index
      let abstract = "";
      if (work.abstract_inverted_index) {
        const words: [string, number][] = [];
        for (const [word, positions] of Object.entries(work.abstract_inverted_index)) {
          for (const pos of positions as number[]) {
            words.push([word, pos]);
          }
        }
        words.sort((a, b) => a[1] - b[1]);
        abstract = words.map((w) => w[0]).join(" ");
      }

      return {
        id: `openalex_${work.id?.split("/").pop() || Math.random().toString(36).substring(7)}`,
        title: work.title || "Academic Financial Paper",
        authors: authors.length > 0 ? authors.slice(0, 3) : ["Financial Scholar"],
        year: work.publication_year || new Date().getFullYear(),
        journalOrSource: work.primary_location?.source?.display_name || "Journal of Financial Economics / OpenAlex",
        abstract: abstract.slice(0, 800),
        doi: work.doi,
        url: work.doi || work.id || "https://openalex.org",
        pdfUrl: work.open_access?.oa_url,
        scope: "INTERNATIONAL",
        category: categorizeByTopic(work.title + " " + abstract),
      };
    });
  } catch (err) {
    console.warn("[AcademicCrawler] OpenAlex query failed:", err);
    return [];
  }
}

/**
 * National Indonesian Standards & Publications Database (PSAK, SAK, OJK, Bank Indonesia)
 */
export const INDONESIA_FINANCIAL_KNOWLEDGE_BASE: AcademicPaper[] = [
  {
    id: "psak_71",
    title: "PSAK 71 / IFRS 9: Instrumen Keuangan – Pengakuan, Pengukuran, dan Model Penurunan Nilai (Expected Credit Loss)",
    authors: ["Dewan Standar Akuntansi Keuangan - Ikatan Akuntan Indonesia (DSAK IAI)"],
    year: 2020,
    journalOrSource: "Standar Akuntansi Keuangan (SAK) Indonesia",
    abstract: "PSAK 71 mengatur klasifikasi aset keuangan berdasarkan model bisnis dan karakteristik arus kas kontraktual (SPPI Test). Mengharuskan pencadangan kerugian kredit ekspektasian (Expected Credit Loss - ECL) sejak awal tanpa menunggu terjadinya peristiwa kerugian (incurred loss model), berdampak signifikan terhadap pencadangan risiko likuiditas perbankan dan korporasi.",
    url: "https://web.iaiglobal.or.id",
    scope: "NATIONAL",
    category: "AUDITOR",
  },
  {
    id: "psak_72",
    title: "PSAK 72 / IFRS 15: Pendapatan dari Kontrak dengan Pelanggan – Kerangka Kerja 5 Langkah (Five-Step Model)",
    authors: ["Dewan Standar Akuntansi Keuangan - Ikatan Akuntan Indonesia (DSAK IAI)"],
    year: 2020,
    journalOrSource: "Standar Akuntansi Keuangan (SAK) Indonesia",
    abstract: "Prinsip inti PSAK 72 mewajibkan entitas mengakui pendapatan untuk menggambarkan pengalihan barang atau jasa kepada pelanggan dalam jumlah imbalan yang diekspektasikan. Menetapkan model 5 langkah: (1) Identifikasi kontrak, (2) Identifikasi kewajiban pelaksanaan (performance obligations), (3) Penentuan harga transaksi, (4) Alokasi harga ke kewajiban, dan (5) Pengakuan pendapatan saat kewajiban dipenuhi.",
    url: "https://web.iaiglobal.or.id",
    scope: "NATIONAL",
    category: "AUDITOR",
  },
  {
    id: "psak_73",
    title: "PSAK 73 / IFRS 16: Sewa – Kapitalisasi Neraca Melalui Aset Hak-Guna dan Liabilitas Sewa",
    authors: ["Dewan Standar Akuntansi Keuangan - Ikatan Akuntan Indonesia (DSAK IAI)"],
    year: 2020,
    journalOrSource: "Standar Akuntansi Keuangan (SAK) Indonesia",
    abstract: "Menghapuskan klasifikasi sewa operasi vs pembiayaan bagi penyewa (lessee). Seluruh kontrak sewa di atas nilai material dan jangka panjang wajib dikapitalisasi ke neraca sebagai Aset Hak-Guna (Right-of-Use Asset) dan Liabilitas Sewa (Lease Liability), mengubah rasio leverage (Debt to Equity) dan EBITDA korporasi.",
    url: "https://web.iaiglobal.or.id",
    scope: "NATIONAL",
    category: "AUDITOR",
  },
  {
    id: "bi_kajian_stabilitas",
    title: "Kajian Stabilitas Keuangan & Kebijakan Makroprudensial Nasional: Transmisi BI-Rate terhadap Likuiditas Perbankan dan Dunia Usaha",
    authors: ["Departemen Kebijakan Makroprudensial Bank Indonesia"],
    year: 2024,
    journalOrSource: "Publikasi Ilmiah & Riset Kebijakan Bank Indonesia",
    abstract: "Menganalisis dampak perubahan suku bunga acuan (BI-Rate) terhadap Net Interest Margin (NIM), Cost of Funds, dan ketahanan arus kas korporasi di Indonesia. Menyoroti pentingnya pengelolaan modal kerja, mitigasi risiko nilai tukar (hedging), dan rasio kecukupan likuiditas (Liquidity Coverage Ratio).",
    url: "https://www.bi.go.id/id/publikasi/kajian/Pages/KSK.aspx",
    scope: "NATIONAL",
    category: "FINANCIAL_CONSULTANT",
  },
  {
    id: "ojk_tata_kelola",
    title: "Panduan Tata Kelola & Manajemen Risiko Terintegrasi Sektor Keuangan: Penerapan Three Lines of Defense",
    authors: ["Otoritas Jasa Keuangan (OJK) Republik Indonesia"],
    year: 2023,
    journalOrSource: "Regulasi & Riset Terintegrasi Otoritas Jasa Keuangan",
    abstract: "Menetapkan pedoman pengawasan internal melalui model Tiga Lini Pertahanan (Three Lines of Defense): Lini operasional pertama, Lini manajemen risiko & kepatuhan kedua, dan Lini audit internal independen ketiga. Mengatur audit sampling dan mitigasi risiko operasional, kecurangan (fraud), serta kepatuhan pelaporan keuangan berkala.",
    url: "https://www.ojk.go.id",
    scope: "NATIONAL",
    category: "AUDITOR",
  },
  {
    id: "mpt_markowitz",
    title: "Portfolio Selection: Efficient Diversification and Modern Portfolio Theory",
    authors: ["Harry Markowitz (Nobel Laureate)"],
    year: 1952,
    journalOrSource: "The Journal of Finance, Vol. 7, No. 1, pp. 77-91",
    abstract: "Makalah fundamental pencetus Teori Portofolio Modern. Membuktikan bahwa risiko portofolio (varians) tidak hanya ditentukan oleh risiko aset individu, melainkan oleh kovarians dan korelasi antar aset. Investor rasional memaksimalkan expected return untuk tingkat risiko tertentu sepanjang Kurva Batas Efisien (Efficient Frontier).",
    url: "https://doi.org/10.2307/2975974",
    doi: "10.2307/2975974",
    scope: "INTERNATIONAL",
    category: "ASSET_MANAGEMENT",
  },
  {
    id: "fama_french_3factor",
    title: "Common Risk Factors in the Returns on Stocks and Bonds: The Three-Factor Capital Asset Pricing Model",
    authors: ["Eugene F. Fama", "Kenneth R. French"],
    year: 1993,
    journalOrSource: "Journal of Financial Economics, 33(1), 3-56",
    abstract: "Memperluas CAPM klasik dengan memperkenalkan dua faktor risiko sistematis tambahan: Ukuran Perusahaan (Small Minus Big - SMB) dan Nilai Buku terhadap Pasar (High Minus Low - HML). Model 3-Faktor Fama-French menjadi standar emas penilaian imbal hasil aset dan atribusi kinerja manajer investasi global.",
    url: "https://doi.org/10.1016/0304-405X(93)90023-5",
    doi: "10.1016/0304-405X(93)90023-5",
    scope: "INTERNATIONAL",
    category: "ASSET_MANAGEMENT",
  },
  {
    id: "dcf_valuation_damodaran",
    title: "Applied Corporate Finance & Valuation Methodology: Mechanics of DCF, WACC, and Multiples",
    authors: ["Aswath Damodaran (Stern School of Business, NYU)"],
    year: 2022,
    journalOrSource: "Stern School of Business Academic Finance Series",
    abstract: "Panduan otoritatif valuasi perbankan investasi. Menjabarkan estimasi Free Cash Flow to Firm (FCFF), perhitungan Cost of Equity via CAPM, Cost of Debt setelah pajak, WACC terbobot nilai pasar, serta normalisasi kelipatan EV/EBITDA dan P/E untuk merger, akuisisi, dan IPO.",
    url: "https://pages.stern.nyu.edu/~adamodar/",
    scope: "INTERNATIONAL",
    category: "INVESTMENT_BANKING",
  },
];

function categorizeByTopic(
  text: string
): "INVESTMENT_BANKING" | "ASSET_MANAGEMENT" | "AUDITOR" | "FINANCIAL_CONSULTANT" {
  const lower = text.toLowerCase();
  if (lower.includes("audit") || lower.includes("fraud") || lower.includes("psak") || lower.includes("ifrs") || lower.includes("compliance") || lower.includes("accounting standard")) {
    return "AUDITOR";
  }
  if (lower.includes("portfolio") || lower.includes("asset allocation") || lower.includes("sharpe") || lower.includes("markowitz") || lower.includes("reksa dana") || lower.includes("risk-adjusted")) {
    return "ASSET_MANAGEMENT";
  }
  if (lower.includes("dcf") || lower.includes("valuation") || lower.includes("m&a") || lower.includes("lbo") || lower.includes("wacc") || lower.includes("merger") || lower.includes("equity value")) {
    return "INVESTMENT_BANKING";
  }
  return "FINANCIAL_CONSULTANT";
}

/**
 * Universal academic search across arXiv, OpenAlex, and Indonesian regulatory repositories
 */
export async function searchAllAcademicSources(query: string): Promise<AcademicPaper[]> {
  const [arxivResults, openAlexResults] = await Promise.all([
    searchArxivFinance(query, 3),
    searchOpenAlex(query, 3),
  ]);

  // Match national/curated corpus based on keyword match
  const qLower = query.toLowerCase();
  const nationalMatches = INDONESIA_FINANCIAL_KNOWLEDGE_BASE.filter((p) => {
    return (
      p.title.toLowerCase().includes(qLower) ||
      p.abstract.toLowerCase().includes(qLower) ||
      qLower.split(/\s+/).some((token) => token.length > 3 && (p.title.toLowerCase().includes(token) || p.abstract.toLowerCase().includes(token)))
    );
  });

  return [...nationalMatches, ...arxivResults, ...openAlexResults];
}
