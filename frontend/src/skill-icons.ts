const TOOL_META: Record<string, { icon: string; color: string }> = {
  Photoshop: { icon: "photoshop", color: "#31A8FF" },
  Illustrator: { icon: "illustrator", color: "#FF9A00" },
  Lightroom: { icon: "lightroom", color: "#31A8FF" },
  InDesign: { icon: "indesign", color: "#FF3366" },
  "Premiere Pro": { icon: "premiere-pro", color: "#9999FF" },
  "After Effects": { icon: "after-effects", color: "#9999FF" },
  PowerPoint: { icon: "powerpoint", color: "#D35230" },
  Word: { icon: "word", color: "#2B579A" },
  Excel: { icon: "excel", color: "#217346" },
  "Adobe XD": { icon: "adobe-xd", color: "#FF61F6" },
  Figma: { icon: "figma", color: "#F24E1E" },
  Dreamweaver: { icon: "dreamweaver", color: "#FF61F6" },
};

function esc(s: string): string {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

export function renderToolTag(tool: string): string {
  const meta = TOOL_META[tool];
  if (!meta) {
    return `<span class="tool-tag"><span class="tool-tag__label">${esc(tool)}</span></span>`;
  }

  return `<span class="tool-tag" style="--tool-color:${meta.color}">
    <span class="tool-tag__icon" style="-webkit-mask-image:url('/icons/tools/${meta.icon}.svg');mask-image:url('/icons/tools/${meta.icon}.svg')" aria-hidden="true"></span>
    <span class="tool-tag__label">${esc(tool)}</span>
  </span>`;
}
