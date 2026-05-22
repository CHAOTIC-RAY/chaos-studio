#!/usr/bin/env python3
"""Render PDF pages to PNG (slide-01.png, …). Requires pymupdf: pip install pymupdf"""
import sys
import fitz

pdf_path, out_dir, zoom = sys.argv[1], sys.argv[2], float(sys.argv[3])
doc = fitz.open(pdf_path)
page_count = doc.page_count
mat = fitz.Matrix(zoom, zoom)
for i in range(page_count):
    pix = doc[i].get_pixmap(matrix=mat, alpha=False)
    pix.save(f"{out_dir}/slide-{i + 1:02d}.png")
doc.close()
print(page_count)
