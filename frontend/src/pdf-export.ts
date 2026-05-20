import type { jsPDF as JsPDFType } from "jspdf";

const A4_W = 210;
const A4_H = 297;
const MARGIN = 14;
const CONTENT_W = A4_W - MARGIN * 2;

type CaptureBlock = { el: HTMLElement; label: string };

function slugify(name: string): string {
  return name.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "");
}

function collectBlocks(main: HTMLElement): CaptureBlock[] {
  const blocks: CaptureBlock[] = [];
  const hero = main.querySelector(".hero");
  if (hero) blocks.push({ el: hero as HTMLElement, label: "hero" });

  main.querySelectorAll(":scope > section").forEach((section) => {
    blocks.push({ el: section as HTMLElement, label: section.id || "section" });
  });

  const marquee = document.querySelector(".work-marquee");
  if (marquee) blocks.push({ el: marquee as HTMLElement, label: "clients" });

  const footer = document.querySelector(".site-footer");
  if (footer) blocks.push({ el: footer as HTMLElement, label: "footer" });

  return blocks;
}

function dedupePostCards(): void {
  const seen = new Set<string>();
  document.querySelectorAll<HTMLElement>(".post-card").forEach((card) => {
    const img = card.querySelector<HTMLImageElement>("[data-post-id]");
    const id = img?.dataset.postId;
    if (!id) return;
    if (seen.has(id)) card.style.display = "none";
    else seen.add(id);
  });
}

function freezeMotionForPdf(): void {
  document.body.classList.add("is-pdf-export");

  document.querySelectorAll<HTMLElement>(".work-marquee__inner").forEach((el) => {
    el.style.transform = "none";
    el.style.animation = "none";
  });

  document.querySelectorAll<HTMLElement>("[data-tilt-showcase]").forEach((el) => {
    el.style.transform = "none";
  });

  document.querySelectorAll<HTMLElement>(".device__carousel").forEach((carousel) => {
    carousel.querySelectorAll<HTMLElement>(".device__slide").forEach((slide, i) => {
      slide.style.animation = "none";
      slide.style.opacity = i === 0 ? "1" : "0";
      slide.style.position = i === 0 ? "relative" : "absolute";
    });
  });

  document.querySelectorAll<HTMLVideoElement>(".device__media").forEach((video) => {
    video.pause();
    video.style.display = "none";
  });

  dedupePostCards();

  const track = document.querySelector<HTMLElement>(".posts-track");
  if (track) {
    track.style.transform = "none";
    track.style.width = "100%";
    track.style.flexWrap = "wrap";
  }
}

function restoreAfterPdf(): void {
  document.body.classList.remove("is-pdf-export");

  const selectors =
    ".work-marquee__inner, .post-card, [data-tilt-showcase], .device__slide, .posts-track, video.device__media";
  document.querySelectorAll<HTMLElement>(selectors).forEach((el) => el.removeAttribute("style"));
}

type Html2CanvasFn = (element: HTMLElement, options?: object) => Promise<HTMLCanvasElement>;

async function captureBlock(el: HTMLElement, html2canvas: Html2CanvasFn): Promise<HTMLCanvasElement> {
  const rect = el.getBoundingClientRect();
  return html2canvas(el, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: "#ffffff",
    width: rect.width,
    height: rect.height,
    x: rect.left,
    y: rect.top + window.scrollY,
    onclone: (_doc: Document, clonedEl: HTMLElement) => {
      clonedEl.classList.add("is-pdf-export");
    },
  });
}

function addCanvasToPdf(
  pdf: JsPDFType,
  canvas: HTMLCanvasElement,
  startY: number,
): number {
  const imgW = CONTENT_W;
  const imgH = (canvas.height * imgW) / canvas.width;
  let y = startY;

  if (y + imgH > A4_H - MARGIN) {
    pdf.addPage();
    y = MARGIN;
  }

  const imgData = canvas.toDataURL("image/jpeg", 0.92);
  pdf.addImage(imgData, "JPEG", MARGIN, y, imgW, imgH);
  return y + imgH + 6;
}

/** Build a printable multi-page PDF of the full portfolio. */
export async function downloadPortfolioPdf(profileName: string): Promise<void> {
  const main = document.getElementById("main");
  if (!main) throw new Error("Portfolio content not loaded");

  freezeMotionForPdf();
  window.scrollTo(0, 0);
  await new Promise((r) => setTimeout(r, 400));

  try {
    const [html2canvasModule, jspdfModule] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ]);
    const html2canvas = html2canvasModule.default as unknown as Html2CanvasFn;
    const { jsPDF } = jspdfModule;

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    let y = MARGIN;

    const blocks = collectBlocks(main);
    for (const { el } of blocks) {
      el.scrollIntoView({ block: "start" });
      await new Promise((r) => setTimeout(r, 120));
      const canvas = await captureBlock(el, html2canvas);
      y = addCanvasToPdf(pdf, canvas, y);
      if (y > A4_H - 40) {
        pdf.addPage();
        y = MARGIN;
      }
    }

    pdf.save(`${slugify(profileName) || "portfolio"}-Portfolio.pdf`);
  } finally {
    restoreAfterPdf();
  }
}
