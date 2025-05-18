const tabs = document.querySelectorAll('nav[aria-label="Tabs"] a');
const tableBody = document.querySelector("tbody");
const paginationContainer = document.querySelector(".mt-6 nav"); // container for pagination buttons
const searchInput = document.querySelector("input[type='text']");
const codedByRadios = document.querySelectorAll("input[name='codedByFilter']");

let allData = [];
let filteredData = [];
let currentPage = 1;
let selectedRadioValue = "all"; // maintain across tabs
let selectedTabCategory = "All"; // Track current tab
const rowsPerPage = 10;

function renderTable(data) {
  tableBody.innerHTML = "";
  data.forEach((item, index) => {
    const verbiageHTML = item["Verbiage"].replace(
      /([\[\(\{])([^{}\[\]\(\)]+?)([\]\)\}])/g,
      (match, open, content, close) => {
        if (open === "(" && content === "s" && close === ")") {
          return match;
        }
        return `<span contenteditable="true" class="editable-bracket">${open}${content}${close}</span>`;
      }
    );

    const row = document.createElement("tr");
    row.classList.add("hover:bg-gray-50", "transition-colors");
    row.innerHTML = `
  <td class="px-4 py-3 whitespace-normal break-words text-sm font-medium text-gray-900">
    ${item["Primary Category"]}
  </td>
  <td class="px-4 py-3 whitespace-normal break-words text-sm text-gray-600">
    ${item["Short Summary"]}
  </td>
  <td class="px-4 py-3 whitespace-normal break-words text-sm text-gray-600">
      ${
        item["Coded By"]?.toLowerCase() === "pdr"
          ? `<span class="pill-badge">${item["Decision Code"]}</span>`
          : item["Decision Code"]
      }
  </td>
  <td class="px-4 py-3 whitespace-normal break-words text-sm text-gray-600 verbiage-cell">
    ${verbiageHTML}
  </td>
  <td class="px-4 py-3 whitespace-normal break-words text-sm font-medium flex gap-1">

    <button class="action-button edit-button"><i class="fa-solid fa-scissors"></i></button>
    <button class="action-button copy-button"><i class="fa-solid fa-copy"></i></button>
  </td>
`;

    tableBody.appendChild(row);
  });

  attachCopyHandlers(); // Rebind copy handlers after rendering
}

function attachCopyHandlers() {
  document.querySelectorAll(".copy-button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const row = btn.closest("tr");
      const verbiageCell = row.querySelector(".verbiage-cell");
      const textToCopy = verbiageCell.innerText.trim();

      navigator.clipboard.writeText(textToCopy).then(() => {
        btn.innerHTML = '<i class="fa-solid fa-check"></i>';
        setTimeout(() => {
          btn.innerHTML = '<i class="fa-solid fa-copy"></i>';
        }, 1500);
      });
    });
  });
}
function applyFilters() {
  const query = searchInput.value.trim().toLowerCase();

  // Filter baseData based on codedByRadio
  let baseData =
    selectedRadioValue === "pdr"
      ? allData.filter(
          (item) => item["Coded By"]?.trim().toLowerCase() === "pdr"
        )
      : allData;

  // Filter again based on search query
  let searchedData = baseData.filter((item) => {
    return (
      item["Decision Code"]?.toLowerCase().includes(query) ||
      item["Short Summary"]?.toLowerCase().includes(query) ||
      item["Verbiage"]?.toLowerCase().includes(query) ||
      item["Scenario"]?.toLowerCase().includes(query)
    );
  });

  // --- Tab visibility logic ---
  const categoryCounts = {};

  searchedData.forEach((item) => {
    const category = item["Secondary Category"] || "All";
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });

  tabs.forEach((tab) => {
    const tabName = tab.textContent.trim();
    const tabKey = tabName === "All" ? "All" : tabName;

    if (tabKey === "All") {
      tab.style.display = searchedData.length > 0 ? "" : "none";
    } else {
      tab.style.display = categoryCounts[tabKey] ? "" : "none";
    }
  });

  // Apply selected tab
  filteredData =
    selectedTabCategory === "All"
      ? searchedData
      : searchedData.filter(
          (item) => item["Secondary Category"] === selectedTabCategory
        );

  displayPage(1);
}

const clearSearchBtn = document.getElementById("clearSearch");

searchInput.addEventListener("input", () => {
  clearSearchBtn.style.display = searchInput.value ? "block" : "none";
  applyFilters();
});

clearSearchBtn.addEventListener("click", () => {
  searchInput.value = "";
  clearSearchBtn.style.display = "none";
  applyFilters();
});

// Search and radio filter event listeners
searchInput.addEventListener("input", applyFilters);
codedByRadios.forEach((radio) => {
  radio.addEventListener("change", () => {
    selectedRadioValue = radio.value.toLowerCase();
    applyFilters();
  });
});

function renderPagination(totalPages) {
  const prevBtn = paginationContainer.querySelector("a:first-child");
  const nextBtn = paginationContainer.querySelector("a:last-child");

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
  nextBtn.classList.toggle("pointer-events-none", currentPage === totalPages);
}

function displayPage(page) {
  currentPage = page;
  if (currentPage < 1) currentPage = 1;
  if (currentPage > Math.ceil(filteredData.length / rowsPerPage))
    currentPage = Math.ceil(filteredData.length / rowsPerPage);

  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  renderTable(filteredData.slice(start, end));
  renderPagination(Math.ceil(filteredData.length / rowsPerPage));
}

tabs.forEach((tab) => {
  tab.addEventListener("click", (event) => {
    event.preventDefault();

    tabs.forEach((t) => {
      t.classList.remove("tab-active");
      t.classList.add("tab-inactive");
      t.removeAttribute("aria-current");
    });

    event.currentTarget.classList.add("tab-active");
    event.currentTarget.classList.remove("tab-inactive");
    event.currentTarget.setAttribute("aria-current", "page");

    selectedTabCategory = event.currentTarget.textContent.trim();

    applyFilters(); // Reapply filters based on new tab
  });
});

paginationContainer.addEventListener("click", (e) => {
  const target = e.target.closest("a");
  if (!target) return;
  e.preventDefault();

  const prevBtn = paginationContainer.querySelector("a:first-child");
  const nextBtn = paginationContainer.querySelector("a:last-child");

  if (target === prevBtn) {
    if (currentPage > 1) displayPage(currentPage - 1);
  } else if (target === nextBtn) {
    if (currentPage < Math.ceil(filteredData.length / rowsPerPage))
      displayPage(currentPage + 1);
  } else if (target.classList.contains("page-btn")) {
    const pageNum = parseInt(target.textContent);
    if (!isNaN(pageNum)) {
      displayPage(pageNum);
    }
  }
});

// Initial load
fetch("data.json")
  .then((response) => response.json())
  .then((data) => {
    allData = data;
    filteredData = allData;
    displayPage(1);
  })
  .catch((error) => console.error("Error loading data:", error));
