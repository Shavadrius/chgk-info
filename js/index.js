const FULL_URL =
  "https://docs.google.com/spreadsheets/d/1sAd0y4X50-KirOv-8Omg5YIcv7MFPmakARCz1DvQyjg/edit?usp=sharing";
const SPREADSHEET_ID = "1sAd0y4X50-KirOv-8Omg5YIcv7MFPmakARCz1DvQyjg";
const SHEET_NAME = "Результаты";
const REFRESH_INTERVAL = 15000;

function loadGoogleSheetData() {
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=responseHandler:handleData&sheet=${SHEET_NAME}`;

  const script = document.createElement("script");
  script.src = `${url}&callback=handleData`;
  document.head.appendChild(script);
}

function handleData(response) {
  if (response && response.table) {
    const data = response.table;
    console.log(data);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  loadGoogleSheetData();
  setInterval(loadGoogleSheetData, REFRESH_INTERVAL);
});
