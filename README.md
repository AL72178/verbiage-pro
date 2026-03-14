# Verbiage Assist

Verbiage Assist helps agents quickly find, edit, copy, and break provider-letter verbiage from a shared library. The app supports both official PDR templates and custom verbiage, and it now includes abbreviation expansion inside the Letter Break workflow.

## Current Website Features

- Dynamic tabs generated from the `Inquiry` field in the data file
- Search across `Inquiry`, `Secondary Category`, `Scenario`, `Decision Code`, `Short Summary`, and `Verbiage`
- Filters for `PDR + Custom Verbiage` and `Only PDR Verbiage`
- `Copy` action for any row
- `Break` action that sends the selected verbiage into Letter Break
- Editable placeholders inside verbiage rows
- Letter Break chunking for copy-friendly text segments
- `Apply Abbrev` support powered by `data/Abbreviation.json`
- Abbreviation status cards with clickable choices when a term has more than one meaning

## Data Files

- `data/Data.json`: main verbiage library used by the table
- `data/Abbreviation.json`: abbreviation library used by `Apply Abbrev`

## Verbiage Data Structure

All table data must be stored as a JSON array inside `data/Data.json`.

```json
[
  {
    "Inquiry": "Category Name",
    "Secondary Category": "Sub-Category Name",
    "Scenario": "Specific Context",
    "Short Summary": "Brief description of the response",
    "Decision Code": "Unique Short Code. E.g. AECNR",
    "Verbiage": "The actual response text.",
    "Coded By": "pdr or user"
  }
]
```

### Field Definitions

- `Inquiry`: Top-level category. This creates the tabs shown at the top of the app.
- `Secondary Category`: Smaller grouping under the main inquiry.
- `Scenario`: Specific use case for the verbiage.
- `Short Summary`: Quick explanation shown in the table.
- `Decision Code`: Short reference code for the verbiage.
- `Verbiage`: Response text shown to the user. This can include editable placeholders.
- `Coded By`: Source marker for filtering. Use `pdr` for official templates. Any other value or blank is treated as custom verbiage.

## How The Website Behaves

### Navigation, Search, and Filters

- Tabs are created automatically from unique `Inquiry` values.
- Search checks `Inquiry`, `Secondary Category`, `Scenario`, `Decision Code`, `Short Summary`, and `Verbiage`.
- `PDR + Custom Verbiage` shows everything.
- `Only PDR Verbiage` shows only rows where `Coded By` is exactly `pdr` ignoring case.

### Row Actions

- `Copy` copies the verbiage text from the selected row.
- `Break` sends that row's verbiage into the Letter Break section and immediately divides it into chunks.

### Editable Placeholder Rules

To create editable fields inside the main table, wrap the placeholder in `()`, `[]`, or `{}` and place `*` immediately after the opening bracket.

All three bracket styles are supported by the current renderer.

Example:

```json
"Verbiage": "Hello [*Customer Name], your request for (*Object Name) has been {*Approval Status}."
```

How it works:

- The brackets stay visible.
- The `*` is hidden in the UI.
- The content inside becomes editable.
- Normal text like `(AD)` or `document(s)` is not converted because it does not include the `*` marker.

## Letter Break

The Letter Break section is used for final cleanup and copy-ready text preparation.

- `Divide Text` splits the text into 63-character chunks without breaking words when possible.
- `Reset` clears the Letter Break area, its output boxes, and any active abbreviation review state.
- The scissors button in the table can send a selected row directly into Letter Break.

## Apply Abbrev

`Apply Abbrev` checks the Letter Break text against `data/Abbreviation.json`.

- If an abbreviation has one full form, the first occurrence becomes `Full Form (ABBR)`.
- Later occurrences are converted to `(ABBR)` if they are not already wrapped.
- Terms with special characters such as `E/M` are supported.
- If the text already contains `Full Form (ABBR)`, the app keeps it and only formats later repeats.
- If an abbreviation has more than one distinct full form, the app does not guess. It shows clickable options so the user can choose the correct meaning.
- After the user clicks one option, that selected meaning is applied immediately to the text.
- A status panel appears during processing and after completion so users can review what changed.

### Abbreviation File Format

Store abbreviations in `data/Abbreviation.json`.

```json
[
  {
    "Term": "CMS",
    "Definition": "Centers for Medicare & Medicaid Services",
    "Definition 2": "Claims Management System",
    "Definition 3": ""
  }
]
```

Notes:

- Use `Term` for the abbreviation itself.
- Use `Definition`, `Definition 2`, and `Definition 3` for possible meanings.
- Leave unused definition fields blank.
- If more than one unique definition is present, the app will show manual selection options during `Apply Abbrev`.

## Submitting Custom Verbiage By Email

To request a new custom verbiage entry, send an email to `nishant.singh@carelon.com` using the format below so the request maps cleanly to the app data fields.

```text
Subject: Verbiage Request - [Inquiry] - [Short Summary]

Inquiry (Category):
Secondary Category:
Scenario:
Short Summary:
Decision Code:
Verbiage:
Coded By: user
Reason / Notes:
```

Recommended notes:

- `Inquiry` is the top-level category field used to create tabs in the app.
- Include `Secondary Category` if the new entry should appear under a specific subgroup.
- If the verbiage should contain editable fields, use the placeholder format `[*Field Name]`, `(*Field Name)`, or `{*Field Name}` directly in the `Verbiage`.
- If the request also needs a new abbreviation, include the abbreviation and its full form in `Reason / Notes`.
