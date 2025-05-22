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
