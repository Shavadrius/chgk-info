const REFRESH_INTERVAL = 15000;

const urlParams = new URLSearchParams(window.location.search);
const spreadsheetId = urlParams.get("id");
const sheetName1 = urlParams.get("sheet1");
const sortColumnsParam1 = urlParams.get("sort1");
const hideColsParam1 = urlParams.get("hide1");
const sheetName2 = urlParams.get("sheet2");
const sortColumnsParam2 = urlParams.get("sort2");
const hideColsParam2 = urlParams.get("hide2");

let sortConfig1 = [];
let sortConfig2 = [];
if (sortColumnsParam1) {
  sortConfig1 = getSortConfig(sortColumnsParam1);
}
if (sortColumnsParam2) {
  sortConfig2 = getSortConfig(sortColumnsParam2);
}

let hideCols1 = [];
let hideCols2 = [];
if (hideColsParam1) {
  hideCols1 = hideColsParam1.split(",").map((val) => parseInt(val));
}
if (hideColsParam2) {
  hideCols2 = hideColsParam2.split(",").map((val) => parseInt(val));
}

function getSortConfig(sortColumnsParam) {
  return sortColumnsParam
    .split(";")
    .map((pair) => {
      const [column, order] = pair.split(",").map((val) => parseInt(val));
      return { column, order: order === 1 ? "desc" : "asc" };
    })
    .filter((config) => !isNaN(config.column));
}

function loadGoogleSheetData() {
  if (!spreadsheetId || !sheetName1 || !sheetName2) {
    return;
  }
  appendScript(sheetName1, 'handleData1');
  appendScript(sheetName2, 'handleData2');
}

function appendScript(sheetName, callback) {
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=responseHandler:${callback}&sheet=${sheetName}`;

  const script = document.createElement("script");
  script.src = `${url}&callback=${callback}`;
  document.head.appendChild(script);
}

function handleData1(response) {
  if (response && response.table) {
    const data = response.table;
    console.log("Data received:", data);
    renderTable(data, '#chgk', sortConfig1, hideCols1);
  } else {
    console.error("Invalid data format:", response);
  }
}

function handleData2(response) {
  if (response && response.table) {
    const data = response.table;
    console.log("Data received:", data);
    renderTable(data, '#mi', sortConfig2, hideCols2);
  } else {
    console.error("Invalid data format:", response);
  }
}

function renderTable(data, tableSelector, sortConfig, hideCols) {
  const table = document.querySelector(tableSelector);
  const thead = table.querySelector("thead tr");
  const tbody = table.querySelector("tbody");

  thead.innerHTML = "";
  tbody.innerHTML = "";

  const thPlace = document.createElement("th");
  thPlace.textContent = "Место";
  thead.appendChild(thPlace);

  data.cols.forEach((col, cellIndex) => {
    if (hideCols.includes(cellIndex)) {
      return;
    }
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
      if (hideCols.includes(cellIndex)) {
        return;
      }

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
