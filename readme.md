# SEC TemType — Bank Templates Viewer + SEC Submission Types

A lightweight static web app to:

- Browse bank PDF template examples (Home)
- View PDFs inline and jump to the matching SEC filing link
- Explore SEC submission types loaded from a .txt file, auto-categorized and rendered as a responsive grid with searchable, expandable category cards

---

## Features

### Home (Bank Templates Viewer)

- Bank sections with clickable template cards
- Inline PDF viewer (iframe)
- “Visit SEC Page” button to open the related filing URL

### Submission Types (SEC Filing Form Types)

- Loads from: data/sec-submission-types.txt
- Parses comma-separated form type lines
- Auto-categorizes into buckets based on the first token:
  - Numeric families (e.g., 10-K → category 10)
  - Alpha families (e.g., S-1 → category S, N-CSR → category N)
  - Space-prefixed families (e.g., SC 13D/A → category SC)
- Renders categories as content-sized grid cards (masonry-like layout)
- Search across family + variants
- Expand / Collapse all categories

---

## Project Structure

    .
    ├── index.html
    ├── styles.css
    ├── script.js
    ├── data/
    │   └── sec-submission-types.txt
    ├── images/
    │   ├── jpm.svg
    │   └── barclays.svg
    └── pdfs/
        ├── jpm/
        └── barclays/

---

## Setup

### 1) Add the submission type list

Create or ensure the file exists at:

    data/sec-submission-types.txt

Each line supports comma-separated items:

- First item → Family
- Remaining items → Variants

Example:

    10-K, 10-K/A
    S-1, S-1/A, S-1 POS
    SC 13D/A, SC 13D

The parser also repairs soft-wrapped lines where a line ends with "-" and continues on the next line  
Example:  
17AD- + newline + 27/A → 17AD-27/A

---

## Run Locally

Because the app uses fetch() to load the TXT file, you must run it using a local server.  
Opening index.html directly via file:// may block fetch in some browsers.

### Option A — VS Code Live Server (recommended)

    1. Install "Live Server" extension
    2. Right-click index.html
    3. Open with Live Server

### Option B — Python

From the project root:

    python -m http.server 5173

Then open:

    http://localhost:5173

---

## Deploy (GitHub Pages)

    1. Push the repo to GitHub
    2. Go to Settings → Pages
    3. Source: Deploy from a branch
    4. Branch: main
    5. Folder: / (root)
    6. Ensure data/sec-submission-types.txt is committed

---

## Routes / Navigation

The app uses hash-based routing:

    #home   → Home view
    #types  → SEC Submission Types view

Navbar links map directly to these routes.

---

## Customization

### Add more banks or templates

Edit index.html under the Home section and add more cards:

    <div
      class="link-card"
      onclick="
        loadTemplate(
          'Template Name',
          'pdfs/bank/template.pdf',
          'https://www.sec.gov/...'
        )
      "
    >
      Template Name
    </div>

### Change categorization logic

Edit the categorize() function in script.js.
You can replace the prefix-based logic with business-friendly groupings
(e.g., Periodic Reports, Registration Statements, Proxy, Tender Offers).

### Default expanded vs collapsed categories

In script.js rendering logic:

Expanded by default:

    <details class="cat" open>

Collapsed by default:

    <details class="cat">

---

## Notes

- PDF rendering uses an iframe
- Some PDFs may require correct MIME types on certain hosts
- The "Visit SEC Page" button always opens in a new tab

---

## Author

Created by Imamul Kadir • 2025
