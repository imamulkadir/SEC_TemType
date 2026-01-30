function loadTemplate(name, pdfUrl, secUrl) {
  const placeholder = document.getElementById("viewer-placeholder");
  placeholder.innerHTML = ""; // Clear previous content

  // Create iframe for PDF
  const iframe = document.createElement("iframe");
  iframe.src = pdfUrl;
  iframe.className = "viewer-iframe";
  placeholder.appendChild(iframe);

  // Create button to visit SEC page
  const button = document.createElement("button");
  button.className = "visit-sec-btn";
  button.innerText = "Visit SEC Page";
  button.onclick = () => window.open(secUrl, "_blank");
  placeholder.appendChild(button);
}

(() => {
  const ROUTES = {
    home: { hash: "#home", viewId: "view-home" },
    types: { hash: "#types", viewId: "view-types" },
  };

  const $ = (sel) => document.querySelector(sel);

  function setRoute(routeKey) {
    const route = ROUTES[routeKey] || ROUTES.home;

    // toggle views
    document.querySelectorAll("[data-view]").forEach((el) => {
      el.hidden = el.getAttribute("data-view") !== routeKey;
    });

    // nav current
    document.querySelectorAll("[data-route]").forEach((a) => {
      const isCurrent = a.getAttribute("data-route") === routeKey;
      a.setAttribute("aria-current", isCurrent ? "page" : "false");
    });

    // lazy-load types page
    if (routeKey === "types") initTypesOnce();
  }

  function readRouteFromHash() {
    const h = (location.hash || "").toLowerCase();
    if (h.startsWith("#types")) return "types";
    return "home";
  }

  // -------- TYPES PAGE --------
  let typesInited = false;

  async function initTypesOnce() {
    if (typesInited) return;
    typesInited = true;

    const statusEl = $("#typesStatus");
    const mountEl = $("#typesMount");
    const searchEl = $("#typesSearch");
    const expandBtn = $("#typesExpandAll");
    const collapseBtn = $("#typesCollapseAll");

    if (!statusEl || !mountEl) return;

    statusEl.textContent = "Loading…";

    let rawText = "";
    try {
      const res = await fetch("./data/sec-submission-types.txt", {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      rawText = await res.text();
    } catch (e) {
      statusEl.textContent =
        "Failed to load text file. Make sure it's committed at: data/sec-submission-types.txt";
      return;
    }

    const items = parseSubmissionTypes(rawText); // [{family, variants[]}, ...]
    const grouped = groupByCategory(items); // { CAT: [items...] }

    statusEl.textContent = `Loaded ${items.length} lines into ${Object.keys(grouped).length} categories.`;

    function render(filterTerm = "") {
      const q = String(filterTerm || "")
        .trim()
        .toLowerCase();
      const cats = Object.keys(grouped).sort((a, b) => a.localeCompare(b));

      const html = cats
        .map((cat) => {
          const rows = grouped[cat]
            .filter((r) => {
              if (!q) return true;
              const hay = [r.family, ...(r.variants || [])]
                .join(" ")
                .toLowerCase();
              return hay.includes(q);
            })
            .sort((a, b) => a.family.localeCompare(b.family));

          if (rows.length === 0) return "";

          const rowsHtml = rows
            .map((r) => {
              const variantsHtml =
                r.variants && r.variants.length
                  ? r.variants
                      .map((v) => `<code class="kbd">${escapeHtml(v)}</code>`)
                      .join(" ")
                  : `<span class="muted">—</span>`;

              return `
                <tr>
                  <td><code class="kbd">${escapeHtml(r.family)}</code></td>
                  <td>${variantsHtml}</td>
                </tr>
              `;
            })
            .join("");

          return `
            <details class="cat" open>
              <summary>
                <span><strong>${escapeHtml(cat)}</strong></span>
                <span class="badge">${rows.length}</span>
              </summary>

              <div class="tableWrap">
                <table>
                  <thead>
                    <tr>
                      <th style="width: 220px;">Family</th>
                      <th>Variants (incl. /A, POS, etc.)</th>
                    </tr>
                  </thead>
                  <tbody>${rowsHtml}</tbody>
                </table>
              </div>
            </details>
          `;
        })
        .join("");

      mountEl.innerHTML = html || `<div class="muted">No matches.</div>`;
    }

    render("");

    let t = null;
    if (searchEl) {
      searchEl.addEventListener("input", (e) => {
        const val = e.target.value || "";
        clearTimeout(t);
        t = setTimeout(() => render(val), 80);
      });
    }

    if (expandBtn) {
      expandBtn.addEventListener("click", () => {
        document
          .querySelectorAll("details.cat")
          .forEach((d) => (d.open = true));
      });
    }

    if (collapseBtn) {
      collapseBtn.addEventListener("click", () => {
        document
          .querySelectorAll("details.cat")
          .forEach((d) => (d.open = false));
      });
    }
  }

  function parseSubmissionTypes(text) {
    // Normalize CRLF, then fix broken-wrap lines like:
    // "17AD-" + "\n" + "27/A" => "17AD-27/A"
    let s = (text || "").replace(/\r/g, "");

    // Join lines when a line ends with "-" (soft wrap)
    s = s.replace(/-\n([A-Za-z0-9])/g, "-$1");

    const lines = s
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean);

    // Each line can contain multiple items separated by commas.
    // We'll treat the first token as the "family", the rest as "variants".
    return lines.map((line) => {
      const tokens = line
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .map((t) => t.replace(/,+$/g, "")); // remove trailing commas

      const family = tokens[0] || line;
      const variants = tokens.slice(1);

      return { family, variants };
    });
  }

  function groupByCategory(items) {
    const out = {};
    for (const it of items) {
      const cat = categorize(it.family);
      if (!out[cat]) out[cat] = [];
      out[cat].push(it);
    }
    return out;
  }

  function categorize(familyRaw) {
    const family = (familyRaw || "").trim();

    // Handle "SC 13D/A", "SCHEDULE 13D", etc.
    const firstWord = family.split(/\s+/)[0];

    // If starts with digits -> category is digits before dash/space (e.g., 10-K => "10", 424B1 => "424")
    if (/^\d/.test(firstWord)) {
      const m = firstWord.match(/^\d+/);
      return m ? m[0] : "Other";
    }

    // If starts with letters -> take leading letters before dash or slash (e.g., S-1 => "S", N-CSR => "N", ABS-15G => "ABS")
    const alpha = firstWord.match(/^[A-Za-z]+/);
    if (alpha) return alpha[0].toUpperCase();

    return "Other";
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // -------- ROUTER WIRING --------
  function wireNav() {
    window.addEventListener("hashchange", () => setRoute(readRouteFromHash()));
    setRoute(readRouteFromHash());
  }

  document.addEventListener("DOMContentLoaded", wireNav);
})();
