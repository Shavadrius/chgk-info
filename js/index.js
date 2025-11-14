const REFRESH_INTERVAL = 15000;

const urlParams = new URLSearchParams(window.location.search);
const spreadsheetId = urlParams.get("id");
const sheetName = urlParams.get("sheet");
const sortColumnsParam = urlParams.get("sort");

let sortConfig = [];
if (sortColumnsParam) {
  sortConfig = sortColumnsParam
    .split(";")
    .map((pair) => {
      const [column, order] = pair.split(",").map((val) => parseInt(val));
      return { column, order: order === 1 ? "desc" : "asc" };
    })
    .filter((config) => !isNaN(config.column));
}

function loadGoogleSheetData() {
  if (!spreadsheetId || !sheetName) {
    return;
  }
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=responseHandler:handleData&sheet=${sheetName}`;

  const script = document.createElement("script");
  script.src = `${url}&callback=handleData`;
  document.head.appendChild(script);
}

function handleData(response) {
  if (response && response.table) {
    const data = response.table;
    console.log("Data received:", data);
    renderTable(data);
  } else {
    console.error("Invalid data format:", response);
  }
}

function renderTable(data) {
  const table = document.querySelector(".results-table");
  const thead = table.querySelector("thead tr");
  const tbody = table.querySelector("tbody");

  thead.innerHTML = "";
  tbody.innerHTML = "";

  const thPlace = document.createElement("th");
  thPlace.textContent = "Место";
  thead.appendChild(thPlace);

  data.cols.forEach((col) => {
    const th = document.createElement("th");
    th.textContent = col.label || "";
    thead.appendChild(th);
  });

  let sortedRows = data.rows;
  if (sortConfig.length > 0) {
    sortedRows = [...data.rows].sort((a, b) => {
      for (let config of sortConfig) {
        const sortIndex = config.column;
        if (sortIndex >= data.cols.length) continue;

        const colType = data.cols[sortIndex].type;
        const cellA = a.c[sortIndex];
        const cellB = b.c[sortIndex];
        const valA = cellA?.v;
        const valB = cellB?.v;

        if (valA === valB) continue;

        if (valA == null) return config.order === "asc" ? -1 : 1;
        if (valB == null) return config.order === "asc" ? 1 : -1;

        let comparison = 0;
        if (colType === "number") {
          comparison = valA - valB;
        } else {
          comparison = String(valA).localeCompare(String(valB));
        }

        if (comparison !== 0) {
          return config.order === "desc" ? -comparison : comparison;
        }
      }
      return 0;
    });
  }

  sortedRows.forEach((row, index) => {
    const tr = document.createElement("tr");

    const tdPlace = document.createElement("td");
    tdPlace.textContent = index + 1;
    tr.appendChild(tdPlace);

    row.c.forEach((cellData, cellIndex) => {
      const td = document.createElement("td");

      if (cellData && cellData.v !== null && cellData.v !== undefined) {
        td.textContent = cellData.f || cellData.v;
      } else {
        td.textContent = "";
      }

      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });
}

document.addEventListener("DOMContentLoaded", function () {
  loadGoogleSheetData();
  setInterval(loadGoogleSheetData, REFRESH_INTERVAL);
});
