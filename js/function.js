// ========== Letter Break Feature ==========

const inputTextElement = document.getElementById("inputText");
const outputBoxesElement = document.getElementById("outputBoxes");
const charCountElement = document.getElementById("charCount");
const applyAbbrevButton = document.getElementById("applyAbbrevBtn");
const abbrevTextareaWrapElement = document.getElementById("abbrevTextareaWrap");
const abbrevStatusElement = document.getElementById("abbrevStatus");
let abbreviationDataPromise = null;
const selectedAmbiguousDefinitions = new Map();

if (inputTextElement) {
  inputTextElement.addEventListener("input", handleTextInputChange);
  document.getElementById("divideButton").addEventListener("click", divideText);
  document.getElementById("resetBtn").addEventListener("click", resetText);
}

function divideText() {
  const inputText = sanitizeOutputText(inputTextElement.value).trim().replace(/\s+/g, " ");
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

function sanitizeOutputText(text) {
  return text
    .replace(/\bedit\b/gi, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\(\s*\)/g, "")
    .replace(/\s{2,}/g, " ");
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
  clearAbbreviationSelections();
  hideAbbreviationStatus();
  countCharacters();
}

function countCharacters() {
  charCountElement.innerText = "Characters: " + inputTextElement.value.length;
}

function handleTextInputChange() {
  clearAbbreviationSelections();
  hideAbbreviationStatus();
  countCharacters();
}

// ========== Abbreviation Feature ==========
if (inputTextElement && applyAbbrevButton) {
  applyAbbrevButton.addEventListener("click", applyAbbreviations);
}

if (abbrevStatusElement) {
  abbrevStatusElement.addEventListener("click", handleAbbreviationChoiceClick);
}

async function applyAbbreviations() {
  const originalText = inputTextElement.value;

  if (!originalText.trim()) {
    renderAbbreviationStatus({
      changed: false,
      expandedCount: 0,
      wrappedCount: 0,
      expandedTerms: [],
      wrappedTerms: new Map(),
      ambiguousTerms: [],
      title: "No text to process",
      summary: "Add letter text first, then apply abbreviations.",
    });
    return;
  }

  setAbbreviationProcessingState(true);

  try {
    const abbreviations = await loadAbbreviations();
    const result = processAbbreviationText(originalText, abbreviations);

    inputTextElement.value = result.text;
    countCharacters();
    renderAbbreviationStatus(result);
    showAbbreviationCompletionEffect();
  } catch (error) {
    console.error("Error applying abbreviations:", error);
    renderAbbreviationStatus({
      changed: false,
      expandedCount: 0,
      wrappedCount: 0,
      expandedTerms: [],
      wrappedTerms: new Map(),
      ambiguousTerms: [],
      title: "Could not apply abbreviations",
      summary: "The abbreviation list could not be loaded. Please try again.",
      isError: true,
    });
  } finally {
    setAbbreviationProcessingState(false);
  }
}

async function loadAbbreviations() {
  if (!abbreviationDataPromise) {
    abbreviationDataPromise = fetch("./data/Abbreviation.json").then((response) => {
      if (!response.ok) {
        throw new Error("Could not load Abbreviation.json");
      }

      return response.json();
    });
  }

  return abbreviationDataPromise;
}

function processAbbreviationText(text, abbreviations) {
  const result = {
    text,
    changed: false,
    expandedCount: 0,
    normalizedCount: 0,
    wrappedCount: 0,
    removedEditCount: 0,
    expandedTerms: [],
    wrappedTerms: new Map(),
    ambiguousTerms: [],
  };

  abbreviations.forEach((abbrObj) => {
    const term = typeof abbrObj.Term === "string" ? abbrObj.Term.trim() : "";
    const definitions = extractDefinitions(abbrObj);

    if (!term || definitions.length === 0) {
      return;
    }

    const resolvedDefinition = resolveDefinitionChoice(result.text, term, definitions);

    if (resolvedDefinition) {
      result.text = applyDefinitionRule(result.text, term, resolvedDefinition, result);
      return;
    }

    if (definitions.length > 1) {
      if (hasTermOccurrence(result.text, term)) {
        result.ambiguousTerms.push({ term, definitions });
      }
      return;
    }

    result.text = applyDefinitionRule(result.text, term, definitions[0], result);
  });

  result.removedEditCount = countStandaloneWordOccurrences(result.text, "edit");
  result.text = sanitizeOutputText(result.text);

  if (result.removedEditCount > 0) {
    result.changed = true;
  }

  if (result.expandedCount > 0 || result.wrappedCount > 0 || result.normalizedCount > 0 || result.removedEditCount > 0) {
    result.title = "Abbreviation updates ready";
    result.summary = buildResultSummary(result);
  } else if (result.ambiguousTerms.length > 0) {
    result.title = "Manual review needed";
    result.summary = buildResultSummary(result);
  } else {
    result.title = "No abbreviation changes";
    result.summary = "Your text already follows the abbreviation format in the library.";
  }

  return result;
}

function applyDefinitionRule(text, term, definition, result) {
  const occurrenceRegex = buildOccurrenceRegex(term);
  const canonicalTerm = formatAbbreviationTerm(term);
  let firstOccurrenceHandled = false;

  return text.replace(occurrenceRegex, (match, prefix, wrappedTerm, rawTerm, offset, fullText) => {
    const matchedTerm = wrappedTerm || rawTerm;
    const occurrenceStart = offset + prefix.length;
    const alreadyWrapped = Boolean(wrappedTerm);

    if (isAlreadyExpandedOccurrence(fullText, occurrenceStart, definition)) {
      firstOccurrenceHandled = true;
      if (matchedTerm !== canonicalTerm) {
        result.changed = true;
        result.normalizedCount += 1;
      }
      return `${prefix}(${canonicalTerm})`;
    }

    if (!firstOccurrenceHandled) {
      firstOccurrenceHandled = true;
      result.changed = true;
      result.expandedCount += 1;
      result.expandedTerms.push({ term, definition });
      return `${prefix}${definition} (${canonicalTerm})`;
    }

    if (alreadyWrapped) {
      if (matchedTerm !== canonicalTerm) {
        result.changed = true;
        result.normalizedCount += 1;
      }
      return `${prefix}(${canonicalTerm})`;
    }

    result.changed = true;
    result.wrappedCount += 1;
    incrementTermCount(result.wrappedTerms, term);
    return `${prefix}(${canonicalTerm})`;
  });
}

function resolveDefinitionChoice(text, term, definitions) {
  const selectedDefinition = selectedAmbiguousDefinitions.get(term);

  if (selectedDefinition && definitions.includes(selectedDefinition)) {
    return selectedDefinition;
  }

  return findExistingExpandedDefinition(text, term, definitions);
}

function extractDefinitions(abbrObj) {
  return Object.keys(abbrObj)
    .filter((key) => /^Definition(?: \d+)?$/.test(key))
    .sort(compareDefinitionKeys)
    .map((key) => (typeof abbrObj[key] === "string" ? abbrObj[key].trim() : ""))
    .filter(Boolean)
    .filter((value, index, array) => array.indexOf(value) === index);
}

function compareDefinitionKeys(firstKey, secondKey) {
  return getDefinitionRank(firstKey) - getDefinitionRank(secondKey);
}

function getDefinitionRank(key) {
  if (key === "Definition") {
    return 1;
  }

  const numericPart = Number.parseInt(key.replace("Definition", "").trim(), 10);
  return Number.isNaN(numericPart) ? Number.MAX_SAFE_INTEGER : numericPart;
}

function hasTermOccurrence(text, term) {
  return buildOccurrenceRegex(term).test(text);
}

function findExistingExpandedDefinition(text, term, definitions) {
  const termPattern = buildFlexibleTermPattern(term);

  return (
    definitions.find((definition) => {
      const escapedDefinition = escapeRegExp(definition);
      const expandedRegex = new RegExp(`${escapedDefinition}\\s*\\(${termPattern}\\)`, "i");
      return expandedRegex.test(text);
    }) || null
  );
}

function buildOccurrenceRegex(term) {
  const termPattern = buildFlexibleTermPattern(term);
  return new RegExp(`(^|[^A-Za-z0-9])(?:\\((${termPattern})\\)|(${termPattern}))(?=[^A-Za-z0-9]|$)`, "gi");
}

function isAlreadyExpandedOccurrence(text, occurrenceStart, definition) {
  const textBeforeOccurrence = normalizeComparableText(text.slice(0, occurrenceStart));
  return textBeforeOccurrence.endsWith(normalizeComparableText(definition));
}

function incrementTermCount(termMap, term) {
  termMap.set(term, (termMap.get(term) || 0) + 1);
}

function buildResultSummary(result) {
  const parts = [];

  if (result.expandedCount > 0) {
    parts.push(
      `${result.expandedCount} first occurrence${result.expandedCount === 1 ? "" : "s"} expanded`
    );
  }

  if (result.wrappedCount > 0) {
    parts.push(`${result.wrappedCount} repeat${result.wrappedCount === 1 ? "" : "s"} wrapped`);
  }

  if (result.normalizedCount > 0) {
    parts.push(
      `${result.normalizedCount} abbreviation${result.normalizedCount === 1 ? "" : "s"} standardized`
    );
  }

  if (result.removedEditCount > 0) {
    parts.push(
      `${result.removedEditCount} stray edit word${result.removedEditCount === 1 ? "" : "s"} removed`
    );
  }

  if (result.ambiguousTerms.length > 0) {
    parts.push(
      `${result.ambiguousTerms.length} ambiguous term${result.ambiguousTerms.length === 1 ? "" : "s"} skipped for manual review`
    );
  }

  return parts.join(" | ");
}

function setAbbreviationProcessingState(isProcessing) {
  if (abbrevTextareaWrapElement) {
    abbrevTextareaWrapElement.classList.toggle("is-processing", isProcessing);
  }

  if (applyAbbrevButton) {
    applyAbbrevButton.disabled = isProcessing;
    applyAbbrevButton.textContent = isProcessing ? "Applying..." : "Apply Abbrev";
    applyAbbrevButton.classList.toggle("opacity-70", isProcessing);
    applyAbbrevButton.classList.toggle("cursor-not-allowed", isProcessing);
  }

  if (isProcessing && abbrevStatusElement) {
    abbrevStatusElement.classList.remove("hidden");
    abbrevStatusElement.classList.add("is-visible", "is-animated");
    abbrevStatusElement.innerHTML = `
      <div class="abbrev-status-title">Scanning abbreviations</div>
      <div class="abbrev-status-text">Checking your text against the abbreviation library and preparing updates.</div>
    `;

    window.setTimeout(() => {
      abbrevStatusElement.classList.remove("is-animated");
    }, 1000);
  }
}

function showAbbreviationCompletionEffect() {
  if (!abbrevTextareaWrapElement) {
    return;
  }

  abbrevTextareaWrapElement.classList.remove("is-complete");
  void abbrevTextareaWrapElement.offsetWidth;
  abbrevTextareaWrapElement.classList.add("is-complete");

  window.setTimeout(() => {
    abbrevTextareaWrapElement.classList.remove("is-complete");
  }, 900);
}

function renderAbbreviationStatus(result) {
  if (!abbrevStatusElement) {
    return;
  }

  const chipMarkup = buildStatusChips(result);
  const detailMarkup = buildAmbiguousDetailMarkup(result.ambiguousTerms);
  const choiceMarkup = buildAmbiguousChoiceMarkup(result.ambiguousTerms);

  abbrevStatusElement.innerHTML = `
    <div class="abbrev-status-title">${escapeHtml(result.title)}</div>
    <div class="abbrev-status-text">${escapeHtml(result.summary)}</div>
    ${chipMarkup ? `<div class="abbrev-status-groups">${chipMarkup}</div>` : ""}
    ${choiceMarkup}
    ${detailMarkup}
  `;

  abbrevStatusElement.classList.remove("hidden", "is-animated");
  abbrevStatusElement.classList.add("is-visible");
  void abbrevStatusElement.offsetWidth;
  abbrevStatusElement.classList.add("is-animated");

  window.setTimeout(() => {
    abbrevStatusElement.classList.remove("is-animated");
  }, 1000);
}

function buildStatusChips(result) {
  const chips = [];

  if (result.expandedTerms.length > 0) {
    const expandedLabels = result.expandedTerms.map(({ term }) => term).join(", ");
    chips.push(`<span class="abbrev-chip abbrev-chip--expanded">Expanded: ${escapeHtml(expandedLabels)}</span>`);
  }

  if (result.wrappedTerms.size > 0) {
    const wrappedLabels = Array.from(result.wrappedTerms.entries())
      .map(([term, count]) => (count > 1 ? `${term} x${count}` : term))
      .join(", ");
    chips.push(`<span class="abbrev-chip abbrev-chip--wrapped">Wrapped: ${escapeHtml(wrappedLabels)}</span>`);
  }

  if (result.ambiguousTerms.length > 0) {
    const ambiguousLabels = result.ambiguousTerms.map(({ term }) => term).join(", ");
    chips.push(`<span class="abbrev-chip abbrev-chip--ambiguous">Review: ${escapeHtml(ambiguousLabels)}</span>`);
  }

  if (chips.length === 0) {
    chips.push('<span class="abbrev-chip abbrev-chip--neutral">No text updates were needed</span>');
  }

  return chips.join("");
}

function buildAmbiguousDetailMarkup(ambiguousTerms) {
  if (!ambiguousTerms.length) {
    return "";
  }

  const details = ambiguousTerms
    .map(({ term, definitions }) => `${term}: ${definitions.join(" / ")}`)
    .join(" ; ");

  return `<div class="abbrev-status-text">Skipped for review: ${escapeHtml(details)}</div>`;
}

function buildAmbiguousChoiceMarkup(ambiguousTerms) {
  if (!ambiguousTerms.length) {
    return "";
  }

  const groups = ambiguousTerms
    .map(({ term, definitions }) => {
      const buttons = definitions
        .map(
          (definition) => `
            <button
              type="button"
              class="abbrev-choice-button"
              data-abbrev-term="${escapeHtml(term)}"
              data-abbrev-definition="${escapeHtml(definition)}"
            >
              ${escapeHtml(definition)}
            </button>
          `
        )
        .join("");

      return `
        <div class="abbrev-choice-group">
          <div class="abbrev-choice-label">Choose expansion for ${escapeHtml(term)}</div>
          <div class="abbrev-choice-buttons">${buttons}</div>
        </div>
      `;
    })
    .join("");

  return `<div class="abbrev-choice-area">${groups}</div>`;
}

async function handleAbbreviationChoiceClick(event) {
  const choiceButton = event.target.closest("[data-abbrev-term][data-abbrev-definition]");

  if (!choiceButton || !inputTextElement) {
    return;
  }

  const { abbrevTerm, abbrevDefinition } = choiceButton.dataset;

  if (!abbrevTerm || !abbrevDefinition) {
    return;
  }

  selectedAmbiguousDefinitions.set(abbrevTerm, abbrevDefinition);
  setAbbreviationProcessingState(true);

  try {
    const abbreviations = await loadAbbreviations();
    const result = processAbbreviationText(inputTextElement.value, abbreviations);

    inputTextElement.value = result.text;
    countCharacters();
    renderAbbreviationStatus(result);
    showAbbreviationCompletionEffect();
  } catch (error) {
    console.error("Error applying selected abbreviation definition:", error);
    renderAbbreviationStatus({
      changed: false,
      expandedCount: 0,
      wrappedCount: 0,
      expandedTerms: [],
      wrappedTerms: new Map(),
      ambiguousTerms: [],
      title: "Could not apply selected option",
      summary: "The selected abbreviation meaning could not be applied. Please try again.",
    });
  } finally {
    setAbbreviationProcessingState(false);
  }
}

function clearAbbreviationSelections() {
  selectedAmbiguousDefinitions.clear();
}

function hideAbbreviationStatus() {
  if (!abbrevStatusElement) {
    return;
  }

  abbrevStatusElement.classList.remove("is-visible", "is-animated");
  abbrevStatusElement.classList.add("hidden");
  abbrevStatusElement.innerHTML = "";
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatAbbreviationTerm(term) {
  return term.trim().toUpperCase();
}

function buildFlexibleTermPattern(term) {
  const trimmedTerm = term.trim();

  if (!trimmedTerm) {
    return "";
  }

  if (!/[\/&-]/.test(trimmedTerm)) {
    return escapeRegExp(trimmedTerm);
  }

  const compactTerm = trimmedTerm.replace(/[^A-Za-z0-9]/g, "");

  if (compactTerm.length < 2) {
    return escapeRegExp(trimmedTerm);
  }

  return compactTerm
    .split("")
    .map((character) => escapeRegExp(character))
    .join("(?:\\s*(?:[\\/&-])\\s*)?");
}

function normalizeComparableText(value) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function countStandaloneWordOccurrences(text, word) {
  const matches = text.match(new RegExp(`\\b${escapeRegExp(word)}\\b`, "gi"));
  return matches ? matches.length : 0;
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

