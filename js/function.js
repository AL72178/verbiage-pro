// ========== Letter Break Feature ==========

const inputTextElement = document.getElementById("inputText");
const outputBoxesElement = document.getElementById("outputBoxes");
const charCountElement = document.getElementById("charCount");

if (inputTextElement) {
  inputTextElement.addEventListener("input", countCharacters);
  document.getElementById("divideButton").addEventListener("click", divideText);
  document.getElementById("resetBtn").addEventListener("click", resetText);
}

function divideText() {
  const inputText = inputTextElement.value.trim().replace(/\s+/g, " ");
  outputBoxesElement.innerHTML = "";
  const CHUNK_SIZE = 63;
  let start = 0;

  while (start < inputText.length) {
    let end = start + CHUNK_SIZE;

    if (
      end < inputText.length &&
      inputText.charAt(end) !== " " &&
      inputText.charAt(end) !== "\n"
    ) {
      while (
        end > start &&
        inputText.charAt(end) !== " " &&
        inputText.charAt(end) !== "\n"
      ) {
        end--;
      }
    }

    if (end === start) end = start + CHUNK_SIZE;

    let chunk = inputText.substring(start, end).trim();
    if (chunk) {
      const box = document.createElement("div");
      box.className = "flex items-start gap-3 mb-4";

      const textBox = document.createElement("textarea");
      textBox.className =
        "w-[300px] h-24 p-2 border rounded resize-none text-sm";
      textBox.setAttribute("readonly", true);
      textBox.value = chunk;

      const button = document.createElement("button");
      button.className =
        "bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded";
      button.innerText = "Copy";
      button.addEventListener("click", () => copyText(textBox));

      textBox.className =
        "w-[300px] h-24 p-2 border rounded resize-none text-sm";

      textBox.setAttribute("readonly", true);
      textBox.value = chunk;

      button.className =
        "bg-blue-500 hover:bg-blue-600 text-white mt-1 px-3 py-1 rounded";
      button.innerText = "Copy";
      button.addEventListener("click", () => copyText(textBox));

      textBox.addEventListener("copy", () => {
        textBox.style.outline = "2px solid rgba(76, 175, 80, 0.8)";
        setTimeout(() => {
          textBox.style.outline = "none";
        }, 1000);
      });

      box.appendChild(textBox);
      box.appendChild(button);
      outputBoxesElement.appendChild(box);
    }
    start = end;
  }
}

function copyText(textElement) {
  textElement.select();
  textElement.setSelectionRange(0, 99999);
  document.execCommand("copy");
  showCopiedMessage();
}

function showCopiedMessage() {
  const copiedMessage = document.createElement("div");
  copiedMessage.className =
    "fixed top-5 right-5 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50";
  copiedMessage.innerText = "Copied";
  document.body.appendChild(copiedMessage);
  setTimeout(() => copiedMessage.remove(), 1000);
}

function resetText() {
  inputTextElement.value = "";
  outputBoxesElement.innerHTML = "";
  countCharacters();
}

function countCharacters() {
  charCountElement.innerText = "Characters: " + inputTextElement.value.length;
}

// ========== Abbreviation Feature ==========
if (inputTextElement) {
  document.getElementById("applyAbbrevBtn").addEventListener("click", applyAbbreviations);
}

async function applyAbbreviations() {
  let text = inputTextElement.value;
  if (!text.trim()) return;

  try {
    const response = await fetch("./data/Abbreviation.json");
    if (!response.ok) throw new Error("Could not load Abbreviation.json");
    const abbreviations = await response.json();

    // Track which abbreviations we've already expanded in this session
    const expandedTerms = new Set();

    abbreviations.forEach((abbrObj) => {
      const term = abbrObj.Term;
      const definition = abbrObj.Definition.trim();
      if (!term || !definition) return;

      // Escape term for regex, in case it has special characters like E/M
      const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      
      // We want to match the term. It might already be in brackets (Term) or isolated.
      // We use word boundaries \b, but since / isn't a word char, creating a robust regex is tricky.
      // A common approach is matching the term not preceded or followed by alphanumeric characters.
      // We also want to capture surrounding brackets if they exist to know if it's already wrapped.
      const regex = new RegExp(`(\\()?([^a-zA-Z0-9_\\{\\}\\[\\]\\*]|^)(${escapedTerm})([^a-zA-Z0-9_\\{\\}\\[\\]\\*]|$)((\\))?)`, "g");

      let match;
      // We need to loop manually because JavaScript String.replace with regex state is complex for first-occurrences per term when replacing recursively
      let newText = "";
      let lastIndex = 0;

      while ((match = regex.exec(text)) !== null) {
        const hasOpenBracket = match[1] === '(';
        const prefix = match[2];
        const matchedTerm = match[3];
        const suffix = match[4];
        const hasCloseBracket = match[5] === ')';
        
        // It's wrapped if the regex captured BOTH the opening and closing brackets
        const isWrapped = hasOpenBracket && hasCloseBracket;

        newText += text.substring(lastIndex, match.index);

        if (!expandedTerms.has(term)) {
          // First occurrence: Replace with "Definition (Term)"
          // If the original already had brackets, eg (E/M), we just output Definition (Term)
          newText += prefix + definition + " (" + matchedTerm + ")" + suffix;
          expandedTerms.add(term);
        } else {
          // Subsequent occurrences: Ensure it's wrapped in brackets "(Term)"
          if (isWrapped) {
             // Already wrapped, reconstruct exactly as we matched it
             newText += '(' + prefix + matchedTerm + suffix + ')';
          } else {
             // Not wrapped, wrap it securely
             // Also drop the captured brackets from prefix/suffix if they were mistakenly grabbed just in case (though our regex should place them in match 1/5)
             newText += prefix + "(" + matchedTerm + ")" + suffix;
          }
        }
        lastIndex = regex.lastIndex;
        
        // Adjust lastIndex if the regex engine consumed the closing bracket as part of the suffix
        if(hasCloseBracket) {
           // We handled the closing bracket, so it shouldn't be matched again
        } else if (suffix === '(') {
            // Edge case where suffix is an opening bracket for the next word
            regex.lastIndex--;
        }
      }
      newText += text.substring(lastIndex);
      text = newText;
    });

    inputTextElement.value = text;
    countCharacters();
    // Optional: Add a brief flash to indicate success
    inputTextElement.style.backgroundColor = "#e6ffed";
    setTimeout(() => {
        inputTextElement.style.backgroundColor = "";
    }, 300);

  } catch (error) {
    console.error("Error applying abbreviations:", error);
    alert("Failed to load abbreviation data.");
  }
}

