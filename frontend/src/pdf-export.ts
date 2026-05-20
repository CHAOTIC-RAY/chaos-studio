import type { jsPDF as JsPDFType } from "jspdf";

const A4_W = 210;
const A4_H = 297;
const MARGIN = 12;
const CONTENT_W = A4_W - MARGIN * 2;
/** 210mm at 96dpi — constrains layout before html2canvas capture */
const A4_PAGE_PX = 794;

type CaptureBlock = { el: HTMLElement; label: string };

type ShellSnapshot = {
  appWidth: string;
  appMaxWidth: string;
  appMargin: string;
  appBoxSizing: string;
  mainPaddingTop: string;
};

let shellSnapshot: ShellSnapshot | null = null;

function slugify(name: string): string {
  return name.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "");
}

function collectBlocks(main: HTMLElement): CaptureBlock[] {
  const blocks: CaptureBlock[] = [];
  const hero = main.querySelector(".hero");
  if (hero) blocks.push({ el: hero as HTMLElement, label: "hero" });

  main.querySelectorAll(":scope > section").forEach((section) => {
    const id = section.id;
    if (id === "work") {
      const head = section.querySelector(".section-head");
      if (head) blocks.push({ el: head as HTMLElement, label: "work-head" });
      section.querySelectorAll<HTMLElement>(".work-showcase").forEach((showcase, i) => {
        blocks.push({ el: showcase, label: `work-${i}` });
      });
      return;
    }
    blocks.push({ el: section as HTMLElement, label: id || "section" });
  });

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

function closeMobileNav(): void {
  const drawer = document.getElementById("nav-drawer");
  const toggle = document.getElementById("nav-toggle");
  if (!drawer || !toggle) return;
  drawer.classList.remove("is-open");
  drawer.setAttribute("hidden", "");
  toggle.setAttribute("aria-expanded", "false");
  document.body.classList.remove("nav-open");
}

function applyA4Shell(): void {
  const app = document.getElementById("app");
  const main = document.getElementById("main");
  if (!app) return;

  shellSnapshot = {
    appWidth: app.style.width,
    appMaxWidth: app.style.maxWidth,
    appMargin: app.style.margin,
    appBoxSizing: app.style.boxSizing,
    mainPaddingTop: main?.style.paddingTop ?? "",
  };

  app.style.width = `${A4_PAGE_PX}px`;
  app.style.maxWidth = `${A4_PAGE_PX}px`;
  app.style.margin = "0 auto";
  app.style.boxSizing = "border-box";
  if (main) main.style.paddingTop = "0";
}

function restoreA4Shell(): void {
  const app = document.getElementById("app");
  const main = document.getElementById("main");
  if (!app || !shellSnapshot) return;

  app.style.width = shellSnapshot.appWidth;
  app.style.maxWidth = shellSnapshot.appMaxWidth;
  app.style.margin = shellSnapshot.appMargin;
  app.style.boxSizing = shellSnapshot.appBoxSizing;
  if (main) main.style.paddingTop = shellSnapshot.mainPaddingTop;
  shellSnapshot = null;
}

function flattenMarqueeForPrint(): void {
  document.querySelectorAll<HTMLElement>(".work-marquee__inner").forEach((inner) => {
    inner.style.transform = "none";
    inner.style.animation = "none";
    inner.style.width = "100%";
    inner.style.display = "flex";
    inner.style.flexWrap = "wrap";
    inner.style.justifyContent = "center";
    inner.style.gap = "0.35rem 0.75rem";
    inner.style.whiteSpace = "normal";
  });

  document.querySelectorAll<HTMLElement>(".work-marquee__row").forEach((row) => {
    row.style.transform = "none";
    row.style.marginTop = "0.35rem";
  });

  document.querySelectorAll<HTMLElement>(".work-marquee__inner .work-marquee__group:nth-child(2)").forEach(
    (group) => {
      group.style.display = "none";
    },
  );
}

function freezeMotionForPdf(): void {
  closeMobileNav();
  applyA4Shell();
  document.documentElement.classList.add("is-pdf-export");
  document.body.classList.add("is-pdf-export");

  document.querySelectorAll<HTMLElement>(".print-clients").forEach((el) => {
    el.removeAttribute("hidden");
  });

  document.querySelectorAll<HTMLElement>("[data-parallax], [data-reveal], [data-tilt-showcase]").forEach(
    (el) => {
      el.style.transform = "none";
      el.style.opacity = "1";
    },
  );

  flattenMarqueeForPrint();

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

  document.querySelectorAll<HTMLElement>(".work-showcase").forEach((el) => {
    el.style.breakInside = "avoid";
  });
}

function restoreAfterPdf(): void {
  document.documentElement.classList.remove("is-pdf-export");
  document.body.classList.remove("is-pdf-export");
  restoreA4Shell();

  document.querySelectorAll<HTMLElement>(".print-clients").forEach((el) => {
    el.setAttribute("hidden", "");
  });

  const selectors =
    ".work-marquee__inner, .work-marquee__row, .work-marquee__group, .post-card, [data-parallax], [data-reveal], [data-tilt-showcase], .device__slide, .posts-track, .work-showcase, video.device__media";
  document.querySelectorAll<HTMLElement>(selectors).forEach((el) => el.removeAttribute("style"));
}

type Html2CanvasFn = (element: HTMLElement, options?: object) => Promise<HTMLCanvasElement>;

async function captureBlock(el: HTMLElement, html2canvas: Html2CanvasFn): Promise<HTMLCanvasElement> {
  return html2canvas(el, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: "#ffffff",
    onclone: (doc: Document) => {
      doc.documentElement.classList.add("is-pdf-export");
      doc.body.classList.add("is-pdf-export");
      const clonedApp = doc.getElementById("app");
      if (clonedApp) {
        clonedApp.style.width = `${A4_PAGE_PX}px`;
        clonedApp.style.maxWidth = `${A4_PAGE_PX}px`;
      }
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
  const maxH = A4_H - MARGIN * 2;
  let y = startY;

  if (y + imgH > A4_H - MARGIN) {
    pdf.addPage();
    y = MARGIN;
  }

  let drawH = imgH;
  let drawW = imgW;
  if (drawH > maxH) {
    drawH = maxH;
    drawW = (canvas.width * drawH) / canvas.height;
  }

  const imgData = canvas.toDataURL("image/jpeg", 0.92);
  pdf.addImage(imgData, "JPEG", MARGIN, y, drawW, drawH);
  return y + drawH + 5;
}

/** Build a printable multi-page PDF of the full portfolio (A4). */
export async function downloadPortfolioPdf(profileName: string): Promise<void> {
  const main = document.getElementById("main");
  if (!main) throw new Error("Portfolio content not loaded");

  freezeMotionForPdf();
  window.scrollTo(0, 0);
  await new Promise((r) => setTimeout(r, 600));

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
      await new Promise((r) => setTimeout(r, 200));
      const canvas = await captureBlock(el, html2canvas);
      y = addCanvasToPdf(pdf, canvas, y);
      if (y > A4_H - 50) {
        pdf.addPage();
        y = MARGIN;
      }
    }

    pdf.save(`${slugify(profileName) || "portfolio"}-Portfolio.pdf`);
  } finally {
    restoreAfterPdf();
  }
}
