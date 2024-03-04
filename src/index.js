import { JKAT } from "https://cdn.jsdelivr.net/npm/@marmooo/kanji@0.0.8/esm/jkat.js";

const previewText = "百花繚乱疾風迅雷明鏡止水不撓不屈国士無双行雲流水";
const googleFontsURL = new URL("https://fonts.googleapis.com/css2");
let grade = 3;
loadConfig();

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
  if (localStorage.getItem("touch-shodo-font")) {
    const fontURL = localStorage.getItem("touch-shodo-font");
    selectFontFromURLBase(fontURL);
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

function getGoogleFontsURL(fontFamily) {
  const params = new URLSearchParams();
  params.set("family", fontFamily);
  params.set("text", previewText);
  params.set("display", "swap");
  googleFontsURL.search = params;
  return googleFontsURL.toString();
}

async function loadGoogleFonts(fontFamily) {
  const url = getGoogleFontsURL(fontFamily);
  const response = await fetch(url);
  const css = await response.text();
  const matchUrls = css.match(/url\(.+?\)/g);
  for (const url of matchUrls) {
    const font = new FontFace(fontFamily, url);
    await font.load();
    document.fonts.add(font);
  }
}

async function selectFontFromURLBase(fontURL) {
  try {
    const url = new URL(fontURL);
    document.getElementById("fontLoadError").classList.add("d-none");
    if (url.host == googleFontsURL.host) {
      const fontFamily = new URLSearchParams(url.search).get("family");
      const formattedURL = getGoogleFontsURL(fontFamily);
      await loadGoogleFonts(fontFamily);
      localStorage.setItem("touch-shodo-font", formattedURL);
      document.getElementById("selectedFont").style.fontFamily = fontFamily;
    } else { // .ttf, .woff, .woff2
      const fontFamily = "abc";
      const fontFace = new FontFace(fontFamily, `url(${url})`);
      await fontFace.load();
      document.fonts.add(fontFace);
      localStorage.setItem("touch-shodo-font", url);
      document.getElementById("selectedFont").style.fontFamily = fontFamily;
    }
  } catch (err) {
    console.log(err);
    document.getElementById("fontLoadError").classList.remove("d-none");
  }
}

async function selectFontFromURL() {
  const button = document.getElementById("selectFontFromURL");
  const fontLoading = document.getElementById("fontLoading");
  button.classList.add("disabled");
  fontLoading.classList.remove("d-none");
  const fontURL = document.getElementById("fontURL").value;
  await selectFontFromURLBase(fontURL);
  button.classList.remove("disabled");
  fontLoading.classList.add("d-none");
}

function selectFont(event) {
  const id = event.currentTarget.getAttribute("id");
  const fontFamily = id.replace(/-/g, " ");
  const baseURL = "https://marmooo.github.io/touch-shodo/fonts";
  const fontURL = `${baseURL}/${fontFamily}.woff2`;
  localStorage.setItem("touch-shodo-font", fontURL);
  document.getElementById("selectedFont").style.fontFamily = fontFamily;
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

const fontsCarousel = document.getElementById("fontsCarousel");
new bootstrap.Carousel(fontsCarousel);

document.getElementById("toggleDarkMode").onclick = toggleDarkMode;
document.getElementById("deleteData").onclick = deleteData;
document.getElementById("generateDrill").onclick = generateDrill;
document.getElementById("testRemained").onclick = testRemained;
document.getElementById("testCleared").onclick = testCleared;
document.getElementById("gradeOption").onchange = changeGrade;
document.getElementById("levelOption").onchange = changeLevel;
document.getElementById("selectFontFromURL").onclick = selectFontFromURL;
[...fontsCarousel.getElementsByClassName("selectFont")].forEach((node) => {
  node.onclick = selectFont;
});
document.getElementById("search").addEventListener("keydown", (event) => {
  if (event.key == "Enter") {
    const words = event.target.value;
    if (words && words.split("").some((word) => w9.includes(word))) {
      location.href = `/touch-shodo/drill/?q=${words}`;
    }
  }
});
document.getElementById("fontURL").addEventListener("keydown", (event) => {
  if (event.key == "Enter") selectFontFromURL();
});
