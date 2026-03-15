import PDFDocument from "pdfkit";
import { PassThrough } from "stream";

interface Prompt {
  title: string | null;
  body: string | null;
  description: string | null;
  aiTool: string | null;
  useCase: string | null;
  sortOrder: number | null;
}

interface Pack {
  title: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  aiToolTargets: string[] | null;
  avgRating: string | null;
  priceCents: number;
  isFree: boolean;
  tags: string[] | null;
}

const PURPLE = "#6c47ff";
const CYAN = "#00d4ff";
const DARK_BG = "#0d0d1a";
const DARK_CARD = "#13131f";
const BORDER = "#2a2a3e";
const TEXT_MAIN = "#e2e8f0";
const TEXT_MUTED = "#8896a7";
const WHITE = "#ffffff";

function hex(color: string): [number, number, number] {
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return [r, g, b];
}

function fill(doc: PDFKit.PDFDocument, color: string) {
  doc.fillColor(hex(color));
}

function stroke(doc: PDFKit.PDFDocument, color: string) {
  doc.strokeColor(hex(color));
}

export async function generatePackPDF(pack: Pack, prompts: Prompt[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      info: {
        Title: `${pack.title} — PromptVault`,
        Author: "Roshan · PromptVault",
        Subject: "AI Prompt Pack",
        Keywords: (pack.tags || []).join(", "),
        Creator: "PromptVault PDF Generator",
        Producer: "PromptVault by Roshan",
      },
      autoFirstPage: true,
    });

    const chunks: Buffer[] = [];
    const pass = new PassThrough();

    doc.pipe(pass);
    pass.on("data", (chunk: Buffer) => chunks.push(chunk));
    pass.on("end", () => resolve(Buffer.concat(chunks)));
    pass.on("error", reject);

    const W = doc.page.width;
    const H = doc.page.height;
    const MARGIN = 48;
    const CONTENT_W = W - MARGIN * 2;
    const year = new Date().getFullYear();
    const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    // ─── COVER PAGE ───────────────────────────────────────────────────────────

    // Dark background
    doc.rect(0, 0, W, H).fill(hex(DARK_BG));

    // Top accent bar gradient simulation (overlapping rects)
    doc.rect(0, 0, W, 8).fill(hex(PURPLE));
    doc.rect(0, 0, W / 2, 8).fill(hex(PURPLE));
    doc.rect(W / 2, 0, W / 2, 8).fill(hex(CYAN));

    // Hero purple glow blob (top-left)
    doc.circle(80, 180, 140).fillOpacity(0.12).fill(hex(PURPLE));
    doc.fillOpacity(1);

    // Hero cyan glow blob (bottom-right)
    doc.circle(W - 100, H - 200, 120).fillOpacity(0.08).fill(hex(CYAN));
    doc.fillOpacity(1);

    // ── LOGO BOX ──
    const logoX = MARGIN;
    const logoY = 80;
    const logoBoxSize = 48;

    doc.roundedRect(logoX, logoY, logoBoxSize, logoBoxSize, 10).fill(hex(PURPLE));
    doc.fontSize(26).font("Helvetica-Bold").fillColor(hex(WHITE)).text("P", logoX, logoY + 10, { width: logoBoxSize, align: "center" });

    // ── LOGO TEXT ──
    doc.fontSize(22).font("Helvetica-Bold").fillColor(hex(WHITE))
      .text("Prompt", logoX + logoBoxSize + 12, logoY + 12, { continued: true })
      .fillColor(hex(CYAN))
      .text("Vault");

    doc.fontSize(10).font("Helvetica").fillColor(hex(TEXT_MUTED))
      .text("Premium AI Prompt Engineering Resources", logoX, logoY + logoBoxSize + 8);

    // ── DIVIDER ──
    doc.moveTo(MARGIN, 172).lineTo(W - MARGIN, 172).strokeOpacity(0.15).stroke(hex(PURPLE)).strokeOpacity(1);

    // ── PACK TITLE (large) ──
    const titleY = 200;
    doc.fontSize(36).font("Helvetica-Bold").fillColor(hex(WHITE))
      .text(pack.title, MARGIN, titleY, { width: CONTENT_W, align: "center", lineGap: 4 });

    const titleHeight = doc.heightOfString(pack.title, { width: CONTENT_W } as any);

    // ── SUBTITLE ──
    let cursorY = titleY + titleHeight + 18;
    if (pack.shortDescription) {
      doc.fontSize(14).font("Helvetica").fillColor(hex(TEXT_MUTED))
        .text(pack.shortDescription, MARGIN, cursorY, { width: CONTENT_W, align: "center", lineGap: 2 });
      cursorY += doc.heightOfString(pack.shortDescription, { width: CONTENT_W } as any) + 24;
    }

    // ── META PILLS ──
    const pillData = [
      `📦 ${prompts.length} Prompts`,
      `📅 ${date}`,
      ...(pack.avgRating ? [`⭐ ${Number(pack.avgRating).toFixed(1)}/5`] : []),
      ...(pack.isFree ? ["🆓 Free Pack"] : []),
    ];

    const pillW = 150;
    const pillH = 28;
    const pillGap = 12;
    const totalPillW = pillData.length * pillW + (pillData.length - 1) * pillGap;
    let pillX = (W - Math.min(totalPillW, CONTENT_W)) / 2;
    cursorY += 8;

    pillData.forEach((pill, i) => {
      const px = (W - totalPillW) / 2 + i * (pillW + pillGap);
      doc.roundedRect(px, cursorY, pillW, pillH, 14).fillOpacity(0.15).fill(hex(PURPLE)).fillOpacity(1);
      doc.roundedRect(px, cursorY, pillW, pillH, 14).strokeOpacity(0.3).stroke(hex(PURPLE)).strokeOpacity(1);
      doc.fontSize(10).font("Helvetica").fillColor(hex(TEXT_MAIN))
        .text(pill, px, cursorY + 8, { width: pillW, align: "center" });
    });

    cursorY += pillH + 24;

    // ── AI TOOL BADGES ──
    if (pack.aiToolTargets && pack.aiToolTargets.length > 0) {
      const badgeH = 22;
      const badgeGap = 8;
      const badgePadX = 16;
      let bx = MARGIN;
      const bRow: string[] = pack.aiToolTargets.slice(0, 6);
      const rowW = bRow.reduce((acc, t) => acc + doc.widthOfString(t, ({} as any)) + badgePadX * 2 + badgeGap, 0);
      bx = (W - rowW) / 2;

      doc.fontSize(10).font("Helvetica").fillColor(hex(TEXT_MUTED)).text("Compatible AI Tools:", MARGIN, cursorY, { width: CONTENT_W, align: "center" });
      cursorY += 18;

      bRow.forEach((tool) => {
        const bw = doc.widthOfString(tool, ({} as any)) + badgePadX * 2;
        doc.roundedRect(bx, cursorY, bw, badgeH, 11).fillOpacity(0.08).fill(hex(CYAN)).fillOpacity(1);
        doc.roundedRect(bx, cursorY, bw, badgeH, 11).strokeOpacity(0.25).stroke(hex(CYAN)).strokeOpacity(1);
        doc.fontSize(10).font("Helvetica").fillColor(hex(CYAN))
          .text(tool, bx, cursorY + 6, { width: bw, align: "center" });
        bx += bw + badgeGap;
      });
      cursorY += badgeH + 16;
    }

    // ── CREDIT BOX ──
    const creditY = H - 200;
    doc.roundedRect(MARGIN, creditY, CONTENT_W, 64, 12)
      .fillOpacity(0.06).fill(hex(PURPLE)).fillOpacity(1);
    doc.roundedRect(MARGIN, creditY, CONTENT_W, 64, 12)
      .strokeOpacity(0.15).stroke(hex(PURPLE)).strokeOpacity(1);

    doc.fontSize(18).font("Helvetica-Bold").fillColor(hex(WHITE))
      .text("Created by Roshan", MARGIN, creditY + 12, { width: CONTENT_W, align: "center" });
    doc.fontSize(10).font("Helvetica").fillColor(hex(TEXT_MUTED))
      .text("PromptVault — Professional AI Prompt Engineering Resources", MARGIN, creditY + 36, { width: CONTENT_W, align: "center" });

    // ── LICENSE NOTE ──
    doc.fontSize(9).font("Helvetica").fillColor(hex(TEXT_MUTED))
      .text(`© ${year} PromptVault · All rights reserved · Licensed for personal and commercial use · Do not redistribute or resell`, MARGIN, H - 100, { width: CONTENT_W, align: "center" });

    // ── PAGE URL WATERMARK ──
    doc.fontSize(8).font("Helvetica").fillColor(hex(BORDER))
      .text("promptvault.ai · by Roshan", MARGIN, H - 76, { width: CONTENT_W, align: "center" });

    // ── BOTTOM ACCENT BAR ──
    doc.rect(0, H - 8, W / 2, 8).fill(hex(PURPLE));
    doc.rect(W / 2, H - 8, W / 2, 8).fill(hex(CYAN));

    // ─── TABLE OF CONTENTS PAGE ───────────────────────────────────────────────

    if (prompts.length > 0) {
      doc.addPage({ size: "A4", margins: { top: 0, bottom: 0, left: 0, right: 0 } });
      doc.rect(0, 0, W, H).fill(hex(DARK_BG));
      doc.rect(0, 0, W, 6).fill(hex(PURPLE));

      doc.fontSize(10).font("Helvetica").fillColor(hex(TEXT_MUTED))
        .text("PROMPTVAULT · BY ROSHAN", MARGIN, 22, { width: CONTENT_W, align: "right" });

      doc.fontSize(24).font("Helvetica-Bold").fillColor(hex(WHITE))
        .text("Table of Contents", MARGIN, 48);

      doc.moveTo(MARGIN, 82).lineTo(W - MARGIN, 82).strokeOpacity(0.2).stroke(hex(PURPLE)).strokeOpacity(1);

      let tocY = 100;
      const tocColW = CONTENT_W / 2 - 16;

      prompts.forEach((p, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const itemX = MARGIN + col * (tocColW + 32);
        const itemY = tocY + row * 38;

        if (itemY > H - 100) return;

        doc.roundedRect(itemX, itemY, tocColW, 30, 6)
          .fillOpacity(0.04).fill(hex(PURPLE)).fillOpacity(1);

        doc.fontSize(10).font("Helvetica-Bold").fillColor(hex(PURPLE))
          .text(`${String(i + 1).padStart(2, "0")}`, itemX + 10, itemY + 10);

        doc.fontSize(10).font("Helvetica").fillColor(hex(TEXT_MAIN))
          .text(p.title || `Prompt ${i + 1}`, itemX + 34, itemY + 10, { width: tocColW - 44, ellipsis: true });
      });

      // Footer
      doc.rect(0, H - 8, W / 2, 8).fill(hex(PURPLE));
      doc.rect(W / 2, H - 8, W / 2, 8).fill(hex(CYAN));
    }

    // ─── PACK DESCRIPTION PAGE (if present) ──────────────────────────────────

    if (pack.description) {
      doc.addPage({ size: "A4", margins: { top: 0, bottom: 0, left: 0, right: 0 } });
      renderPageShell(doc, W, H, MARGIN, CONTENT_W, "About This Pack");

      let descY = 110;
      doc.fontSize(13).font("Helvetica").fillColor(hex(TEXT_MUTED))
        .text(pack.description, MARGIN, descY, { width: CONTENT_W, lineGap: 4 });

      descY += doc.heightOfString(pack.description, { width: CONTENT_W } as any) + 32;

      // How to use box
      const howY = descY;
      const howH = 200;
      doc.roundedRect(MARGIN, howY, CONTENT_W, howH, 12)
        .fillOpacity(0.06).fill(hex(CYAN)).fillOpacity(1);
      doc.roundedRect(MARGIN, howY, CONTENT_W, howH, 12)
        .strokeOpacity(0.15).stroke(hex(CYAN)).strokeOpacity(1);

      doc.rect(MARGIN, howY, 4, howH).fill(hex(CYAN));

      doc.fontSize(13).font("Helvetica-Bold").fillColor(hex(CYAN))
        .text("How to Use These Prompts", MARGIN + 20, howY + 18);

      const tips = [
        "Copy any prompt and paste it directly into ChatGPT, Claude, Gemini, or your preferred AI",
        "Replace text in [brackets] with your specific details and context",
        "Customize the tone, length, or style by adding instructions at the end",
        "Chain prompts together for more complex workflows and outputs",
        "Save your best results and iterate for even better outputs",
      ];

      let tipY = howY + 44;
      tips.forEach((tip) => {
        doc.fontSize(11).font("Helvetica").fillColor(hex(TEXT_MUTED))
          .text(`→  ${tip}`, MARGIN + 20, tipY, { width: CONTENT_W - 40, lineGap: 2 });
        tipY += 26;
      });

      doc.rect(0, H - 8, W / 2, 8).fill(hex(PURPLE));
      doc.rect(W / 2, H - 8, W / 2, 8).fill(hex(CYAN));
    }

    // ─── PROMPT PAGES ─────────────────────────────────────────────────────────

    prompts.forEach((prompt, i) => {
      doc.addPage({ size: "A4", margins: { top: 0, bottom: 0, left: 0, right: 0 } });
      doc.rect(0, 0, W, H).fill(hex(DARK_BG));
      doc.rect(0, 0, W, 6).fill(hex(PURPLE));

      // Page header
      doc.fontSize(9).font("Helvetica").fillColor(hex(TEXT_MUTED))
        .text("PROMPTVAULT · BY ROSHAN", MARGIN, 20, { width: CONTENT_W, align: "right" });

      doc.fontSize(9).font("Helvetica").fillColor(hex(TEXT_MUTED))
        .text(pack.title.toUpperCase(), MARGIN, 20);

      // Prompt number badge
      const badgeW = 48;
      const badgeH = 24;
      doc.roundedRect(MARGIN, 48, badgeW, badgeH, 12).fill(hex(PURPLE));
      doc.fontSize(11).font("Helvetica-Bold").fillColor(hex(WHITE))
        .text(`#${String(i + 1).padStart(2, "0")}`, MARGIN, 55, { width: badgeW, align: "center" });

      // AI Tool + Use case badges
      let badgeX = MARGIN + badgeW + 12;
      if (prompt.aiTool) {
        const bw = doc.widthOfString(prompt.aiTool, ({} as any)) + 20;
        doc.roundedRect(badgeX, 48, bw, badgeH, 6).fillOpacity(0.12).fill(hex(CYAN)).fillOpacity(1);
        doc.roundedRect(badgeX, 48, bw, badgeH, 6).strokeOpacity(0.2).stroke(hex(CYAN)).strokeOpacity(1);
        doc.fontSize(9).font("Helvetica").fillColor(hex(CYAN)).text(prompt.aiTool, badgeX, 55, { width: bw, align: "center" });
        badgeX += bw + 8;
      }
      if (prompt.useCase) {
        const bw = doc.widthOfString(prompt.useCase, ({} as any)) + 20;
        doc.roundedRect(badgeX, 48, bw, badgeH, 6).fillOpacity(0.08).fill(hex(PURPLE)).fillOpacity(1);
        doc.roundedRect(badgeX, 48, bw, badgeH, 6).strokeOpacity(0.2).stroke(hex(PURPLE)).strokeOpacity(1);
        doc.fontSize(9).font("Helvetica").fillColor(hex(PURPLE)).text(prompt.useCase, badgeX, 55, { width: bw, align: "center" });
      }

      // Title
      let contentY = 92;
      doc.fontSize(20).font("Helvetica-Bold").fillColor(hex(WHITE))
        .text(prompt.title || `Prompt ${i + 1}`, MARGIN, contentY, { width: CONTENT_W });
      contentY += doc.heightOfString(prompt.title || `Prompt ${i + 1}`, { width: CONTENT_W } as any) + 8;

      // Description
      if (prompt.description) {
        doc.fontSize(11).font("Helvetica").fillColor(hex(TEXT_MUTED))
          .text(prompt.description, MARGIN, contentY, { width: CONTENT_W, lineGap: 2 });
        contentY += doc.heightOfString(prompt.description, { width: CONTENT_W } as any) + 14;
      }

      // Divider
      doc.moveTo(MARGIN, contentY).lineTo(W - MARGIN, contentY).strokeOpacity(0.15).stroke(hex(PURPLE)).strokeOpacity(1);
      contentY += 14;

      // Prompt body section header
      doc.rect(MARGIN, contentY, 4, 16).fill(hex(CYAN));
      doc.fontSize(10).font("Helvetica-Bold").fillColor(hex(CYAN))
        .text("PROMPT TEXT", MARGIN + 12, contentY + 2);
      contentY += 28;

      // Prompt body box
      const bodyText = prompt.body || "";
      const bodyFontSize = 11;
      const bodyPadding = 16;
      const bodyW = CONTENT_W;
      const bodyTextH = doc.heightOfString(bodyText, { width: bodyW - bodyPadding * 2, lineGap: 3 } as any);
      const bodyBoxH = Math.min(bodyTextH + bodyPadding * 2, H - contentY - 80);

      doc.roundedRect(MARGIN, contentY, bodyW, bodyBoxH, 10)
        .fillOpacity(0.5).fill(hex(DARK_CARD)).fillOpacity(1);
      doc.roundedRect(MARGIN, contentY, bodyW, bodyBoxH, 10)
        .strokeOpacity(0.25).stroke(hex(BORDER)).strokeOpacity(1);

      // Left accent line
      doc.rect(MARGIN, contentY, 3, bodyBoxH).fill(hex(PURPLE));

      doc.fontSize(bodyFontSize).font("Courier").fillColor(hex(TEXT_MAIN))
        .text(bodyText, MARGIN + bodyPadding, contentY + bodyPadding, {
          width: bodyW - bodyPadding * 2,
          lineGap: 3,
          height: bodyBoxH - bodyPadding * 2,
          ellipsis: "...\n\n[Content continues — see full version]",
        });

      // Page number
      doc.fontSize(9).font("Helvetica").fillColor(hex(TEXT_MUTED))
        .text(`${i + 3} / ${prompts.length + 2}`, MARGIN, H - 28, { width: CONTENT_W, align: "center" });

      // Copy hint
      doc.fontSize(8).font("Helvetica").fillColor(hex(BORDER))
        .text("Copy this prompt and paste it into your preferred AI tool.", MARGIN, H - 42, { width: CONTENT_W, align: "center" });

      // Bottom bars
      doc.rect(0, H - 8, W / 2, 8).fill(hex(PURPLE));
      doc.rect(W / 2, H - 8, W / 2, 8).fill(hex(CYAN));
    });

    // ─── BACK COVER / LICENSE PAGE ────────────────────────────────────────────

    doc.addPage({ size: "A4", margins: { top: 0, bottom: 0, left: 0, right: 0 } });
    doc.rect(0, 0, W, H).fill(hex(DARK_BG));

    // Glow blobs
    doc.circle(W / 2, H / 2, 200).fillOpacity(0.05).fill(hex(PURPLE)).fillOpacity(1);

    doc.rect(0, 0, W, 8).fill(hex(PURPLE));
    doc.rect(W / 2, 0, W / 2, 8).fill(hex(CYAN));

    // Big logo
    const bcLogoBoxSize = 64;
    const bcLogoX = (W - bcLogoBoxSize) / 2;
    const bcLogoY = H / 2 - 140;

    doc.roundedRect(bcLogoX, bcLogoY, bcLogoBoxSize, bcLogoBoxSize, 14).fill(hex(PURPLE));
    doc.fontSize(36).font("Helvetica-Bold").fillColor(hex(WHITE))
      .text("P", bcLogoX, bcLogoY + 10, { width: bcLogoBoxSize, align: "center" });

    doc.fontSize(28).font("Helvetica-Bold")
      .fillColor(hex(WHITE)).text("Prompt", MARGIN, bcLogoY + bcLogoBoxSize + 16, { continued: true, align: "right", width: W / 2 - 4 })
      .fillColor(hex(CYAN)).text("Vault", MARGIN + W / 2, bcLogoY + bcLogoBoxSize + 16, { width: W / 2 - MARGIN, align: "left" });

    doc.fontSize(14).font("Helvetica").fillColor(hex(TEXT_MUTED))
      .text("Premium AI Prompt Engineering Resources", MARGIN, bcLogoY + bcLogoBoxSize + 58, { width: CONTENT_W, align: "center" });

    doc.fontSize(18).font("Helvetica-Bold").fillColor(hex(WHITE))
      .text("Created by Roshan", MARGIN, H / 2 + 10, { width: CONTENT_W, align: "center" });

    doc.fontSize(12).font("Helvetica").fillColor(hex(TEXT_MUTED))
      .text("promptvault.ai", MARGIN, H / 2 + 40, { width: CONTENT_W, align: "center" });

    // License box
    const licenseY = H / 2 + 90;
    doc.roundedRect(MARGIN, licenseY, CONTENT_W, 88, 10).fillOpacity(0.06).fill(hex(PURPLE)).fillOpacity(1);
    doc.roundedRect(MARGIN, licenseY, CONTENT_W, 88, 10).strokeOpacity(0.15).stroke(hex(PURPLE)).strokeOpacity(1);

    doc.fontSize(12).font("Helvetica-Bold").fillColor(hex(TEXT_MAIN))
      .text("License & Usage Terms", MARGIN, licenseY + 14, { width: CONTENT_W, align: "center" });

    doc.fontSize(10).font("Helvetica").fillColor(hex(TEXT_MUTED))
      .text(
        `© ${year} PromptVault · All rights reserved.\nThis prompt pack is licensed for personal and commercial use by the purchaser.\nRedistribution, resale, or sharing of this file is strictly prohibited.`,
        MARGIN + 20,
        licenseY + 36,
        { width: CONTENT_W - 40, align: "center", lineGap: 3 },
      );

    doc.rect(0, H - 8, W / 2, 8).fill(hex(PURPLE));
    doc.rect(W / 2, H - 8, W / 2, 8).fill(hex(CYAN));

    doc.end();
  });
}

function renderPageShell(
  doc: PDFKit.PDFDocument,
  W: number,
  H: number,
  MARGIN: number,
  CONTENT_W: number,
  pageTitle: string,
) {
  doc.rect(0, 0, W, H).fill(hex(DARK_BG));
  doc.rect(0, 0, W, 6).fill(hex(PURPLE));

  doc.fontSize(9).font("Helvetica").fillColor(hex(TEXT_MUTED))
    .text("PROMPTVAULT · BY ROSHAN", MARGIN, 20, { width: CONTENT_W, align: "right" });

  doc.fontSize(22).font("Helvetica-Bold").fillColor(hex(WHITE))
    .text(pageTitle, MARGIN, 44);

  doc.moveTo(MARGIN, 78).lineTo(W - MARGIN, 78).strokeOpacity(0.2).stroke(hex(PURPLE)).strokeOpacity(1);
}
