let tabs = [];
// Removed static tabs constant since we generate them dynamically
const dynamicTabsContainer = document.getElementById('dynamicTabs');
const tableBody = document.querySelector("tbody");
const paginationContainer = document.querySelector(".mt-6 nav");
const searchInput = document.querySelector("input[type='text']");
const codedByRadios = document.querySelectorAll("input[name='codedByFilter']");
const clearSearchBtn = document.getElementById("clearSearch");

const prevBtn = paginationContainer.querySelector("a:first-child");
const nextBtn = paginationContainer.querySelector("a:last-child");

const rowsPerPage = 10;

let allData = [];
let filteredData = [];
let currentPage = 1;
let selectedRadioValue = "all";
let selectedTabCategory = "All"; // This now corresponds to the 'Inquiry' field

// --- Utility Functions ---

function debounce(func, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
}

function getFilteredByRadio(data, value) {
  return value === "pdr"
    ? data.filter((item) => item["Coded By"]?.trim().toLowerCase() === "pdr")
    : data;
}

function getSearchFiltered(data, query) {
  return data.filter((item) =>
    [
      "Inquiry", 
      "Secondary Category", 
      "Scenario", 
      "Decision Code", 
      "Short Summary", 
      "Verbiage"
    ].some((key) =>
      item[key]?.toLowerCase().includes(query)
    )
  );
}

function setActiveTab(tabText) {
  tabs.forEach((t) => {
    const isActive = t.textContent.trim() === tabText;
    t.classList.toggle("tab-active", isActive);
    t.classList.toggle("tab-inactive", !isActive);
    isActive
      ? t.setAttribute("aria-current", "page")
      : t.removeAttribute("aria-current");
  });
}

// --- Dynamic Tabs Rendering ---
function renderTabs(data) {
  // Extract unique Inquiry categories
  const categories = new Set(["All"]);
  data.forEach(item => {
    if (item["Inquiry"]) {
      categories.add(item["Inquiry"].trim());
    }
  });

  dynamicTabsContainer.innerHTML = "";
  tabs = []; // Clear current tabs

  categories.forEach(category => {
    const a = document.createElement("a");
    a.href = "#";
    // First tab is active by default
    if (category === "All") {
      a.className = "tab-active py-3 px-4 border-b-2 font-medium text-sm";
      a.setAttribute("aria-current", "page");
    } else {
      a.className = "tab-inactive hover:text-gray-700 hover:border-gray-300 py-3 px-4 border-b-2 font-medium text-sm";
    }
    a.textContent = category;

    a.addEventListener("click", (event) => {
      event.preventDefault();
      selectedTabCategory = event.currentTarget.textContent.trim();
      setActiveTab(selectedTabCategory);
      applyFilters();
    });

    dynamicTabsContainer.appendChild(a);
    tabs.push(a);
  });
}

// --- Rendering ---

function renderTable(data) {
  tableBody.innerHTML = "";
  data.forEach((item) => {
    const verbiageHTML = item["Verbiage"].replace(
      /([\[\(\{])\*([^{}\[\]\(\)]+?)([\]\)\}])/g,
      (match, open, content, close) => {
        return `${open}<span contenteditable="true" class="editable-bracket px-1 mx-1 border-b border-dashed border-blue-400 text-blue-600 focus:outline-none focus:bg-blue-50">${content}</span>${close}`;
      }
    );

    const row = document.createElement("tr");
    row.classList.add("hover:bg-gray-50", "transition-colors");
    row.innerHTML = `
      <td class="px-4 py-3 whitespace-normal break-words text-sm font-medium text-gray-900">
        <div class="font-bold">${item["Inquiry"] || 'N/A'}</div>
        <div class="text-xs text-gray-500">${item["Secondary Category"] || ''}</div>
      </td>
      <td class="px-4 py-3 whitespace-normal break-words text-sm text-gray-600">
        <div class="font-semibold text-gray-800">${item["Scenario"] || ''}</div>
        <div class="mt-1">${item["Short Summary"] || ''}</div>
      </td>
      <td class="px-4 py-3 whitespace-normal break-words text-sm text-gray-600">
        ${
          item["Coded By"]?.toLowerCase() === "pdr"
            ? `<span class="pill-badge">${item["Decision Code"]}</span>`
            : item["Decision Code"]
        }
      </td>
      <td class="px-4 py-3 whitespace-normal break-words text-sm text-gray-600 verbiage-cell">${verbiageHTML}</td>
      <td class="px-4 py-3 whitespace-normal break-words text-sm font-medium flex gap-1">
        <button class="action-button edit-button break-button" title="Break Letter"><i class="fa-solid fa-scissors"></i></button>
        <button class="action-button copy-button" title="Copy Verbiage"><i class="fa-solid fa-copy"></i></button>
      </td>
    `;
    tableBody.appendChild(row);
  });

  attachCopyHandlers();
  attachBreakHandlers();
}

function attachCopyHandlers() {
  document.querySelectorAll(".copy-button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const row = btn.closest("tr");
      const verbiageCell = row.querySelector(".verbiage-cell");
      const textToCopy = verbiageCell.textContent.trim();

      navigator.clipboard.writeText(textToCopy).then(() => {
        btn.innerHTML = '<i class="fa-solid fa-check"></i>';
        setTimeout(() => {
          btn.innerHTML = '<i class="fa-solid fa-copy"></i>';
        }, 1500);
      });
    });
  });
}

function attachBreakHandlers() {
  const inputTextElement = document.getElementById("inputText");
  if (!inputTextElement) return;

  document.querySelectorAll(".break-button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const row = btn.closest("tr");
      const verbiageCell = row.querySelector(".verbiage-cell");
      const textToBreak = verbiageCell.textContent.trim();

      inputTextElement.value = textToBreak;
      if (typeof countCharacters === "function") countCharacters();
      if (typeof divideText === "function") divideText();
    });
  });
}

function renderPagination(totalPages) {
  paginationContainer
    .querySelectorAll("a.page-btn")
    .forEach((btn) => btn.remove());

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("a");
    btn.href = "#";
    btn.textContent = i;
    btn.className = `page-btn relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
      i === currentPage
        ? "bg-blue-50 border-blue-500 text-blue-600"
        : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
    }`;
    paginationContainer.insertBefore(btn, nextBtn);
  }

  prevBtn.classList.toggle("pointer-events-none", currentPage === 1);
  nextBtn.classList.toggle("pointer-events-none", currentPage === totalPages || totalPages === 0);
}

function displayPage(page) {
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  currentPage = Math.max(1, Math.min(page, totalPages));
  
  if (filteredData.length === 0) {
      renderTable([]);
      renderPagination(0);
      return;
  }
  
  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  renderTable(filteredData.slice(start, end));
  renderPagination(totalPages);
}

// --- Filtering and Event Binding ---

function applyFilters() {
  const query = searchInput.value.trim().toLowerCase();
  const radioFiltered = getFilteredByRadio(allData, selectedRadioValue);
  const searchFiltered = getSearchFiltered(radioFiltered, query);

  // Tab filtering and visibility based on 'Inquiry'
  const categoryCounts = {};
  searchFiltered.forEach((item) => {
    const category = item["Inquiry"] || "All";
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });

  tabs.forEach((tab) => {
    const tabName = tab.textContent.trim();
    const tabKey = tabName === "All" ? "All" : tabName;

    tab.style.display =
      tabKey === "All"
        ? searchFiltered.length > 0
          ? ""
          : "none"
        : categoryCounts[tabKey]
        ? ""
        : "none";

    if (tab.classList.contains("tab-active") && tab.style.display === "none") {
      selectedTabCategory = "All";
      setActiveTab("All");
    }
  });

  filteredData =
    selectedTabCategory === "All"
      ? searchFiltered
      : searchFiltered.filter(
          (item) => item["Inquiry"] === selectedTabCategory
        );

  displayPage(1);
}

// --- Event Listeners ---

searchInput.addEventListener(
  "input",
  debounce(() => {
    clearSearchBtn.style.display = searchInput.value ? "block" : "none";
    applyFilters();
  }, 300)
);

clearSearchBtn.addEventListener("click", () => {
  searchInput.value = "";
  clearSearchBtn.style.display = "none";
  applyFilters();
});

codedByRadios.forEach((radio) => {
  radio.addEventListener("change", () => {
    selectedRadioValue = radio.value.toLowerCase();
    applyFilters();
  });
});

paginationContainer.addEventListener("click", (e) => {
  const target = e.target.closest("a");
  if (!target) return;
  e.preventDefault();

  if (target === prevBtn && currentPage > 1) {
    displayPage(currentPage - 1);
  } else if (
    target === nextBtn &&
    currentPage < Math.ceil(filteredData.length / rowsPerPage)
  ) {
    displayPage(currentPage + 1);
  } else if (target.classList.contains("page-btn")) {
    const pageNum = parseInt(target.textContent);
    if (!isNaN(pageNum)) {
      displayPage(pageNum);
    }
  }
});

// --- Load Data ---

fetch("./data/Data.json")
  .then((response) => response.json())
  .then((data) => {
    if (!Array.isArray(data)) throw new Error("Invalid data format");
    allData = data;
    filteredData = allData;
    
    // First, correctly generate the dynamic tabs based on the data
    renderTabs(data);
    
    // Then display the first page of results
    displayPage(1);
  })
  .catch((error) => console.error("Error loading data:", error));
