# Verbiage Assist

Verbiage Assist is a tool designed to easily retrieve, search, copy, and modify Provider Letter verbiage. It uses a clean UI to display official and custom verbiage templates, allowing agents to quickly adjust parameters and copy responses into their workflow.

## Managing Data (`Data.json`)

Currently, all the data for Verbiage Assist is stored statically within `./js/Data.json`. Regardless of what tools or processes are used in the future to build UI templates, the final data source must be formatted into this exact JSON structure for the application to function.

The data must be a JSON array of objects.

### JSON Format & Required Fields

Each object in the JSON array must contain the following keys/columns:

```json
[
  {
    "Inquiry": "Category Name",
    "Secondary Category": "Sub-Category Name",
    "Scenario": "Specific Context",
    "Short Summary": "Brief description of the response",
    "Decision Code": "Unique Short Code. E.g: AECNR",
    "Verbiage": "The actual text response.",
    "Coded By": "pdr or user"
  }
]
```

#### Column Descriptions

- **`Inquiry`**: (Required) The top-level category or topic. This field dynamically generates the main navigation tabs at the top of the application. Everything with the same Inquiry value will be grouped under the same tab. (e.g., "Account Issue", "Billing").
- **`Secondary Category`**: (Required) A further breakdown or sub-category to help organize scenarios under a main Inquiry topic.
- **`Scenario`**: (Required) The specific situation or context where this particular verbiage is used.
- **`Short Summary`**: (Required) A quick reference or title for the verbiage. This makes it easier for agents to scan through search results without reading the entire block of text.
- **`Decision Code`**: (Required) A code representing the short code of the verbiage. (e.g., "AECNR"). 
- **`Verbiage`**: (Required) The actual textual response that the agent will use. See *Verbiage Formatting Rules* below for making parts editable.
- **`Coded By`**: (Required) Defines the source of the verbiage. This powers the filter toggles in the UI. 
  - Using the exact string `"pdr"` indicates this is an official/approved template. 
  - Leaving it blank or setting it to anything else signifies it is a "Custom Verbiage" created by users.

## How the Filters Work

The UI features a toggle switch with two options:
1. **"PDR + Custom Verbiage"**: Shows all data in the JSON array, regardless of the `Coded By` value.
2. **"Only PDR Verbiage"**: Filters the JSON array to show *only* records where the `Coded By` field is explicitly set to `"pdr"` (case-insensitive).

## Verbiage Formatting Rules

Verbiage Assist can automatically turn specific placeholders in the `Verbiage` text into interactive, editable input fields in the UI. This allows agents to tweak variables directly in the app before copying.

To create an editable field, wrap the placeholder text in **parentheses `()`, square brackets `[]`, or curly braces `{}` AND place an asterisk (`*`) immediately after the opening bracket**. 

The asterisk acts as a strict identifier, ensuring the app doesn't accidentally turn normal abbreviations like `(AD)` or `(s)` into editable fields. 

**Example Data Entry:**
```json
"Verbiage": "Hello [*Customer Name], your request for (*Object Name) has been {*Approval Status}."
```

**How it works in the UI:**
- The brackets themselves (`[ ]`, `( )`, `{ }`) remain locked and cannot be accidentally deleted by the user.
- The `*` is hidden from the user.
- The text inside (e.g., `Customer Name`) visually renders as highlighted, editable text boxes.

*Note: Regular text like `Annual Day (AD)` or `document(s)` will just render normally since they lack the `*` trigger.*
