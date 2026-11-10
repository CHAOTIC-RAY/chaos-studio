# Studio showcase research (device mockups)

Brief notes from reviewing agency portfolios before the Selected Work bento refresh.

## Takeaways applied

1. **One hero device per tile, depth for dual** — Studios like [Basic/Dept](https://www.basicagency.com/) and [Instrument](https://www.instrument.com/work) often show a primary screen at large scale with a secondary device overlapping for responsive products (applied: `feat-devices--dual` with browser + phone and z-index shadow stack).
2. **Restrained chrome, content-first** — Award-winning case studies (e.g. [Locomotive work index](https://locomotive.ca/en/work)) keep UI chrome minimal so screenshots read at scroll speed; CSS/SVG frames only, no stock PNG mockups (applied: `.device--browser` / `.device--phone` in `showcase-devices.css`).
3. **Rhythm: asymmetric bento, not six equal boxes** — [Build in Amsterdam](https://www.buildinamsterdam.com/cases) and [Resn](https://resn.co.nz/) use varied tile spans so flagship work gets more viewport; five merged projects in a 4-column bento (Kora 2×2, Forge 2×2, etc.).
4. **Cinematic pacing between tiles** — [Active Theory](https://activetheory.net/work) and Locomotive’s own [Awwwards case study](https://www.awwwards.com/locomotive-by-locomotive-wins-site-of-the-month-june-a-case-study.html) stagger reveals and lazy media so scroll stays smooth on mobile (applied: intersection reveal + `loading="lazy"` on device images, eager only when needed).
5. **Mobile: single column, mockups capped** — [Pentagram](https://www.pentagram.com/work) and Awwwards SOTD studio sites typically stack case cards with mockups at ~40–45vw max width; dual layouts shrink the phone offset so nothing clips at 360–430px (`clamp()` widths in `showcase-devices.css`).

## Sources

- [Locomotive — Work](https://locomotive.ca/en/work)
- [Locomotive SOTM case study (Awwwards)](https://www.awwwards.com/locomotive-by-locomotive-wins-site-of-the-month-june-a-case-study.html)
- [Instrument — Work](https://www.instrument.com/work)
- [Build in Amsterdam — Cases](https://www.buildinamsterdam.com/cases)
- [Basic/Dept](https://www.basicagency.com/)
- [Resn](https://resn.co.nz/)
- [Active Theory — Work](https://activetheory.net/work)
- [Pentagram — Work](https://www.pentagram.com/work)
