import { JKAT } from "https://cdn.jsdelivr.net/npm/@marmooo/kanji@0.0.4/esm/jkat.js";

let grade = 3;
loadConfig();

function selectFont(obj) {
  const fileName = obj.src.split("/").slice(-1)[0];
  const fontName = fileName.split(".")[0].split("-")[0];
  localStorage.setItem("touch-shodo-font", fontName);
  document.getElementById("selectedFont").src = "/touch-shodo/fonts/" +
    fontName + "-600.webp";
}

function changeGrade(event) {
  grade = event.target.selectedIndex;
  setProblems();
  setCleared();
  localStorage.setItem("grade", grade);
}

function changeLevel(event) {
  const level = event.target.selectedIndex;
  localStorage.setItem("touch-shodo-level", level);
}

function loadConfig() {
  if (localStorage.getItem("darkMode") == 1) {
    document.documentElement.setAttribute("data-bs-theme", "dark");
  }
  if (localStorage.getItem("grade")) {
    grade = parseInt(localStorage.getItem("grade"));
    document.getElementById("gradeOption").options[grade].selected = true;
  }
  if (localStorage.getItem("touch-shodo-level")) {
    const level = parseInt(localStorage.getItem("touch-shodo-level"));
    document.getElementById("levelOption").options[level].selected = true;
  }
}

function toggleDarkMode() {
  if (localStorage.getItem("darkMode") == 1) {
    localStorage.setItem("darkMode", 0);
    document.documentElement.setAttribute("data-bs-theme", "light");
  } else {
    localStorage.setItem("darkMode", 1);
    document.documentElement.setAttribute("data-bs-theme", "dark");
  }
}

function setCleared() {
  const problems = document.getElementById("problems").children;
  const clearedKanjis = localStorage.getItem("touch-shodo");
  if (clearedKanjis) {
    for (let i = 0; i < problems.length; i++) {
      if (clearedKanjis.includes(problems[i].textContent)) {
        problems[i].classList.remove("btn-outline-secondary");
        problems[i].classList.add("btn-secondary");
      }
    }
  }
}

function shuffle(array) {
  for (let i = array.length; 1 < i; i--) {
    const k = Math.floor(Math.random() * i);
    [array[k], array[i - 1]] = [array[i - 1], array[k]];
  }
  return array;
}

function testRemained() {
  const problems = document.getElementById("problems").children;
  const kanjis = [...problems]
    .filter((e) => e.classList.contains("btn-outline-secondary"))
    .map((e) => e.textContent);
  const target = shuffle(kanjis).slice(0, 9).join("");
  location.href = `/touch-shodo/drill/?q=${target}`;
}

function testCleared() {
  const problems = document.getElementById("problems").children;
  const kanjis = [...problems]
    .filter((e) => e.classList.contains("btn-secondary"))
    .map((e) => e.textContent);
  const target = shuffle(kanjis).slice(0, 9).join("");
  location.href = `/touch-shodo/drill/?q=${target}`;
}

function deleteData() {
  localStorage.removeItem("touch-shodo");
  location.reload();
}

function generateDrill() {
  const words = document.getElementById("search").value;
  if (words && words.split("").some((word) => w9.includes(word))) {
    location.href = `/touch-shodo/drill/?q=${words}`;
  }
}

function setProblems() {
  const problems = document.getElementById("problems");
  let html = "";
  for (let i = 0; i < JKAT[grade].length; i++) {
    const kanji = JKAT[grade][i];
    const url = `/touch-shodo/drill/?q=${kanji}`;
    const klass = "me-1 mb-1 btn btn-sm btn-outline-secondary";
    html += `<a href="${url}" class="${klass}">${kanji}</a>`;
  }
  problems.innerHTML = html;
}

setProblems();
setCleared();

document.getElementById("toggleDarkMode").onclick = toggleDarkMode;
document.getElementById("deleteData").onclick = deleteData;
document.getElementById("generateDrill").onclick = generateDrill;
document.getElementById("testRemained").onclick = testRemained;
document.getElementById("testCleared").onclick = testCleared;
document.getElementById("gradeOption").onchange = changeGrade;
document.getElementById("levelOption").onchange = changeLevel;
[...document.getElementById("fontsCarousel").getElementsByTagName("img")]
  .forEach((img) => {
    img.onclick = selectFont;
  });
document.getElementById("search").addEventListener("keydown", (event) => {
  if (event.key == "Enter") {
    const words = event.target.value;
    if (words && words.split("").some((word) => w9.includes(word))) {
      location.href = `/touch-shodo/drill/?q=${words}`;
    }
  }
});

let selectedFontName = localStorage.getItem("touch-shodo-font");
if (!selectedFontName) {
  selectedFontName = "KouzanMouhituFont";
}
document.getElementById("selectedFont").src = "/touch-shodo/fonts/" +
  selectedFontName + "-600.webp";
new bootstrap.Carousel(document.getElementById("fontsCarousel"));
