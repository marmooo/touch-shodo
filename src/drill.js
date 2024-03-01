import { Kanji } from "https://cdn.jsdelivr.net/npm/@marmooo/kanji@0.0.8/esm/kanji.js";
import { JKAT } from "https://cdn.jsdelivr.net/npm/@marmooo/kanji@0.0.8/esm/jkat.js";

const jkat = new Kanji(JKAT);
const dirNames = [
  "小1",
  "小2",
  "小3",
  "小4",
  "小5",
  "小6",
  "中2",
  "中3",
  "高校",
  "常用",
  "準1級",
  "1級",
];
const audioContext = new AudioContext();
const audioBufferCache = {};
loadAudio("stupid", "/touch-shodo/mp3/stupid5.mp3");
loadAudio("correct", "/touch-shodo/mp3/correct3.mp3");
loadAudio("correctAll", "/touch-shodo/mp3/correct1.mp3");
loadAudio("incorrect", "/touch-shodo/mp3/incorrect1.mp3");
let level = 2;
let prevCanvasSize;
let canvasSize = 140;
let maxWidth = 4;
if (globalThis.innerWidth >= 768) {
  canvasSize = 280;
  maxWidth = 8;
}
let fontFamily = localStorage.getItem("touch-shodo-font");
if (!fontFamily) {
  fontFamily = "KouzanMouhituFont";
}

function toKanji(kanjiId) {
  return String.fromCodePoint(parseInt(kanjiId));
}

function getDictUrl(kanji) {
  const baseUrl = "https://marmooo.github.io";
  const grade = jkat.getGrade(kanji);
  if (grade < 0) {
    return null;
  } else {
    return baseUrl + "/kanji-dict/" + dirNames[grade] + "/" + kanji + "/";
  }
}

function loadConfig() {
  if (localStorage.getItem("darkMode") == 1) {
    document.documentElement.setAttribute("data-bs-theme", "dark");
  }
  if (localStorage.getItem("hint") == 1) {
    document.getElementById("hint").textContent = "EASY";
  }
  if (localStorage.getItem("touch-shodo-level")) {
    level = parseInt(localStorage.getItem("touch-shodo-level"));
  }
}
loadConfig();

// TODO: :host-context() is not supportted by Safari/Firefox now
function toggleDarkMode() {
  if (localStorage.getItem("darkMode") == 1) {
    localStorage.setItem("darkMode", 0);
    document.documentElement.setAttribute("data-bs-theme", "light");
    boxes.forEach((box) => {
      [...box.shadowRoot.querySelectorAll("object, canvas")].forEach((canvas) => {
        canvas.removeAttribute("style");
      });
    });
  } else {
    localStorage.setItem("darkMode", 1);
    document.documentElement.setAttribute("data-bs-theme", "dark");
    boxes.forEach((box) => {
      [...box.shadowRoot.querySelectorAll("object, canvas")].forEach((canvas) => {
        canvas.setAttribute("style", "filter: invert(1) hue-rotate(180deg);");
      });
    });
  }
}

function toggleHint(event) {
  if (localStorage.getItem("hint") == 1) {
    localStorage.setItem("hint", 0);
    event.target.textContent = "HARD";
  } else {
    localStorage.setItem("hint", 1);
    event.target.textContent = "EASY";
  }
  toggleAllStroke();
}

function toggleScroll() {
  const scrollable = document.getElementById("scrollable");
  const pinned = document.getElementById("pinned");
  if (scrollable.classList.contains("d-none")) {
    document.body.style.overflow = "visible";
    scrollable.classList.remove("d-none");
    pinned.classList.add("d-none");
  } else {
    document.body.style.overflow = "hidden";
    scrollable.classList.add("d-none");
    pinned.classList.remove("d-none");
  }
}

async function playAudio(name, volume) {
  const audioBuffer = await loadAudio(name, audioBufferCache[name]);
  const sourceNode = audioContext.createBufferSource();
  sourceNode.buffer = audioBuffer;
  if (volume) {
    const gainNode = audioContext.createGain();
    gainNode.gain.value = volume;
    gainNode.connect(audioContext.destination);
    sourceNode.connect(gainNode);
    sourceNode.start();
  } else {
    sourceNode.connect(audioContext.destination);
    sourceNode.start();
  }
}

async function loadAudio(name, url) {
  if (audioBufferCache[name]) return audioBufferCache[name];
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  audioBufferCache[name] = audioBuffer;
  return audioBuffer;
}

function unlockAudio() {
  audioContext.resume();
}

class ProblemBox extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.adoptedStyleSheets = [globalCSS];

    const template = document.getElementById("problem-box")
      .content.cloneNode(true);
    this.shadowRoot.appendChild(template);
  }
}
customElements.define("problem-box", ProblemBox);

class TehonBox extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.adoptedStyleSheets = [globalCSS];

    const template = document.getElementById("tehon-box")
      .content.cloneNode(true);
    const canvases = template.querySelectorAll("canvas");
    [...canvases].forEach((canvas) => {
      resizeCanvasSize(canvas, canvasSize);
    });
    this.shadowRoot.appendChild(template);

    if (document.documentElement.getAttribute("data-bs-theme") == "dark") {
      [...this.shadowRoot.querySelectorAll("canvas")].forEach((canvas) => {
        canvas.setAttribute("style", "filter: invert(1) hue-rotate(180deg);");
      });
    }
  }
}
customElements.define("tehon-box", TehonBox);

class TegakiBox extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.adoptedStyleSheets = [globalCSS];

    const template = document.getElementById("tegaki-box")
      .content.cloneNode(true);
    const canvases = template.querySelectorAll("canvas");
    [...canvases].forEach((canvas) => {
      resizeCanvasSize(canvas, canvasSize);
    });
    this.shadowRoot.appendChild(template);

    if (document.documentElement.getAttribute("data-bs-theme") == "dark") {
      [...this.shadowRoot.querySelectorAll("object, canvas")].forEach((canvas) => {
        canvas.setAttribute("style", "filter: invert(1) hue-rotate(180deg);");
      });
    }
  }
}
customElements.define("tegaki-box", TegakiBox);

function toKanjiId(str) {
  const oct = str.codePointAt(0).toString(10);
  return ("00000" + oct).slice(-5);
}

// フォントに weight が用意されているとは限らないため、
// 手書きの太さに合わせて bold 処理
function fillTextBold(ctx, kanji, spacing, fontSize) {
  const fontWidth = estimateFontWidth(ctx, kanji, spacing, fontSize);
  const markerWidth = maxWidth * 4;
  if (markerWidth < fontWidth) {
    ctx.fillText(kanji, spacing, fontSize);
  } else {
    const diff = markerWidth - fontWidth;
    const w = Math.round(diff / 2);
    for (let x = -w; x <= w; x++) {
      for (let y = -w; y <= w; y++) {
        if (Math.round(Math.sqrt(x * x + y * y)) <= diff) {
          ctx.fillText(kanji, spacing + x, fontSize + y);
        }
      }
    }
  }
}

// フォントをずらして描画して線の太さを推定
// TODO: heavy
function estimateFontWidth(ctx, kanji, spacing, fontSize) {
  const width = maxWidth;
  ctx.fillText(kanji, spacing, fontSize);
  const imgData1 = ctx.getImageData(0, 0, canvasSize, canvasSize).data;
  const count1 = countNoTransparent(imgData1);
  ctx.fillText(kanji, spacing + width, fontSize + width);
  const imgData2 = ctx.getImageData(0, 0, canvasSize, canvasSize).data;
  const inclusionCount = getInclusionCount(imgData2, imgData1);
  ctx.clearRect(0, 0, canvasSize, canvasSize);
  return maxWidth / (inclusionCount / count1);
}

function drawFont(canvas, kanji, loadCanvas) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const spacing = canvasSize * 0.1;
  const fontSize = canvasSize * 0.8;
  ctx.font = fontSize + "px " + fontFamily;
  if (loadCanvas) {
    ctx.fillStyle = "lightgray";
    fillTextBold(ctx, kanji, spacing, fontSize);
    toggleStroke(canvas);
  } else {
    ctx.fillText(kanji, spacing, fontSize);
  }
}

function loadFont(kanji, kanjiId, parentNode, pos, loadCanvas) {
  let box;
  if (loadCanvas) {
    box = new TegakiBox();
  } else {
    box = new TehonBox();
  }
  boxes.push(box);
  // // SVG はセキュリティ上 Web フォントは dataURI で埋め込む必要がある
  // // 重過ぎるので canvas でレンダリングすべき
  // let object = box.shadowRoot.querySelector('svg');
  // let text = object.querySelector('text');
  // text.textContent = kanji;
  // text.setAttribute('font-family', fontFamily);
  // if (loadCanvas) {
  //   text.setAttribute('fill', 'lightgray');
  //   text.setAttribute('font-weight', 900);
  // }
  const object = box.shadowRoot.querySelector(".tehon");
  object.setAttribute("alt", kanji);
  object.setAttribute("data-id", kanjiId);
  object.setAttribute("data-pos", pos);
  drawFont(object, kanji, loadCanvas);
  parentNode.appendChild(box);
  return object;
}

function showKanjiScore(kanjiScore, scoreObj, object) {
  kanjiScore = Math.floor(kanjiScore);
  if (kanjiScore >= 80) {
    playAudio("correct", 0.3);
  } else {
    playAudio("incorrect", 0.3);
  }
  scoreObj.classList.remove("d-none");
  scoreObj.textContent = kanjiScore;
  if (localStorage.getItem("hint") != 1) {
    object.style.visibility = "visible";
  }
}

function getProblemScores(tegakiPanel, objects, tegakiPads) {
  const promises = [];
  objects.forEach((object, i) => {
    const pos = parseInt(object.dataset.pos);
    const tegakiData = tegakiPads[i].toData();
    let kanjiScore = 0;
    if (tegakiData.length != 0) {
      const scoreObj = tegakiPanel.children[pos]
        .shadowRoot.querySelector(".score");
      kanjiScore = getKanjiScore(tegakiData, object);
      showKanjiScore(kanjiScore, scoreObj, object);
    }
    promises[i] = kanjiScore;
  });
  return Promise.all(promises);
}

function setScoringButton(
  problemBox,
  tegakiPanel,
  objects,
  tegakiPads,
  word,
) {
  const scoring = problemBox.shadowRoot.querySelector(".scoring");
  scoring.addEventListener("click", () => {
    getProblemScores(tegakiPanel, objects, tegakiPads).then(
      (scores) => {
        if (scores.every((score) => score >= 80)) {
          problemBox.shadowRoot.querySelector(".guard").style.height = "100%";
          const next = problemBox.nextElementSibling;
          if (next) {
            next.shadowRoot.querySelector(".guard").style.height = "0";
            const headerHeight = document.getElementById("header").offsetHeight;
            const top = next.getBoundingClientRect().top +
              document.documentElement.scrollTop - headerHeight;
            globalThis.scrollTo({ top: top, behavior: "smooth" });
          }
        }
        // 点数があまりにも低いものは合格リストから除外
        let clearedKanjis = localStorage.getItem("touch-shodo");
        if (clearedKanjis) {
          let removed = false;
          scores.forEach((score, i) => {
            if (score < 40) {
              clearedKanjis = clearedKanjis.replace(word[i], "");
              removed = true;
            }
          });
          if (removed) {
            localStorage.setItem("touch-shodo", clearedKanjis);
          }
        }
      },
    );
  });
}

function setSignaturePad(object) {
  const canvas = object.parentNode.querySelector(".tegaki");
  const pad = new SignaturePad(canvas, {
    minWidth: 0.5,
    maxWidth: maxWidth,
    penColor: "black",
    throttle: 0,
    minDistance: 0,
  });
  return pad;
}

function setEraser(tegakiPad, tegakiPanel, tehonPanel, object) {
  const currKanji = object.getRootNode().host;
  const kanjiPos = [...tegakiPanel.children].findIndex((x) => x == currKanji);
  const eraser = tehonPanel.children[kanjiPos]
    .shadowRoot.querySelector(".eraser");
  eraser.onclick = () => {
    const data = tegakiPad.toData();
    if (data) {
      tegakiPad.clear();
    }
    const pos = parseInt(object.dataset.pos);
    const scoreObj = tegakiPanel.children[pos]
      .shadowRoot.querySelector(".score");
    scoreObj.classList.add("d-none");
    if (localStorage.getItem("hint") != 1) {
      object.style.visibility = "hidden";
    }
  };
}

function setDict(tehonPanel, object, kanji) {
  const pos = parseInt(object.dataset.pos);
  const dict = tehonPanel.children[pos].shadowRoot.querySelector(".dict");
  const url = getDictUrl(kanji);
  if (url) {
    dict.href = url;
  } else {
    dict.classList.add("d-none");
  }
}

function loadProblem(wordYomi) {
  const [word, yomi] = wordYomi.split("|");
  const problemBox = new ProblemBox();
  const shadow = problemBox.shadowRoot;
  const info = shadow.querySelector(".info");
  info.textContent = word + " (" + yomi + ")";
  const search = shadow.querySelector(".search");
  search.href = "https://www.google.com/search?q=" + word + "とは";
  const objects = [];
  const tegakiPads = [];
  const tehon = shadow.querySelector(".tehon");
  const tegaki = shadow.querySelector(".tegaki");
  word.split("").forEach((kanji, pos) => {
    const kanjiId = toKanjiId(kanji);
    loadFont(kanji, kanjiId, tehon, pos, false);
    const object = loadFont(kanji, kanjiId, tegaki, pos, true);
    const tegakiPad = setSignaturePad(object);
    objects.push(object);
    tegakiPads.push(tegakiPad);
    setEraser(tegakiPad, tegaki, tehon, object);
    setDict(tehon, object, kanji);
  });
  setScoringButton(problemBox, tegaki, objects, tegakiPads, word);
  document.getElementById("problems").appendChild(problemBox);
  return tegakiPads;
}

function resizeTegakiContents(tegakiPads) {
  tegakiPads.forEach((tegakiPad) => {
    const canvas = tegakiPad.canvas;
    resizeCanvasSize(canvas, canvasSize);
    const data = tegakiPad.toData();
    if (data.length > 0) {
      tegakiPad.maxWidth = maxWidth;
      if (prevCanvasSize < canvasSize) {
        for (let i = 0; i < data.length; i++) {
          for (let j = 0; j < data[i].length; j++) {
            data[i][j].x *= 2;
            data[i][j].y *= 2;
          }
        }
      } else {
        for (let i = 0; i < data.length; i++) {
          for (let j = 0; j < data[i].length; j++) {
            data[i][j].x /= 2;
            data[i][j].y /= 2;
          }
        }
      }
      tegakiPad.fromData(data);
    }
  });
}

function resizeCanvasSize(canvas, canvasSize) {
  canvas.style.width = canvasSize + "px";
  canvas.style.height = canvasSize + "px";
  canvas.setAttribute("width", canvasSize);
  canvas.setAttribute("height", canvasSize);
}

function resizeTehonContents() {
  const problems = document.getElementById("problems").children;
  for (const problem of problems) {
    const tegakiBoxes = problem.shadowRoot.querySelector(".tegaki").children;
    const tehonBoxes = problem.shadowRoot.querySelector(".tehon").children;
    [...tegakiBoxes].forEach((tegakiBox) => {
      const canvas = tegakiBox.shadowRoot.querySelector(".tehon");
      const kanjiId = canvas.dataset.id;
      resizeCanvasSize(canvas, canvasSize);
      drawFont(canvas, toKanji(kanjiId), true);
    });
    [...tehonBoxes].forEach((tehonBox) => {
      const canvas = tehonBox.shadowRoot.querySelector(".tehon");
      const kanjiId = canvas.dataset.id;
      resizeCanvasSize(canvas, canvasSize);
      drawFont(canvas, toKanji(kanjiId), false);
    });
  }
}

function loadDrill(drill) {
  let tegakiPads = [];
  drill.forEach((wordYomi) => {
    const pads = loadProblem(wordYomi);
    tegakiPads = tegakiPads.concat(pads);
  });
  globalThis.onresize = () => {
    prevCanvasSize = canvasSize;
    if (globalThis.innerWidth >= 768) {
      canvasSize = 280;
      maxWidth = 8;
    } else {
      canvasSize = 140;
      maxWidth = 4;
    }
    if (prevCanvasSize != canvasSize) {
      resizeTegakiContents(tegakiPads);
      resizeTehonContents();
    }
  };
}

function toggleAllStroke() {
  const problems = document.getElementById("problems").children;
  for (const problem of problems) {
    const tegakiBoxes = problem.shadowRoot.querySelector(".tegaki").children;
    for (const tegakiBox of tegakiBoxes) {
      const object = tegakiBox.shadowRoot.querySelector(".tehon");
      toggleStroke(object);
    }
  }
}

function toggleStroke(object) {
  if (localStorage.getItem("hint") != 1) {
    object.style.visibility = "hidden";
  } else {
    object.style.visibility = "visible";
  }
}

function countNoTransparent(data) {
  let count = 0;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] != 0) {
      count += 1;
    }
  }
  return count;
}

function getInclusionCount(tegakiImgData, tehonImgData) {
  for (let i = 3; i < tegakiImgData.length; i += 4) {
    if (tehonImgData[i] != 0) {
      tegakiImgData[i] = 0;
    }
  }
  const inclusionCount = countNoTransparent(tegakiImgData);
  return inclusionCount;
}

function getScoringFactor(level) {
  switch (level) {
    case 0:
      return 0.4 ** 2;
    case 1:
      return 0.5 ** 2;
    case 2:
      return 0.6 ** 2;
    case 3:
      return 0.7 ** 2;
    case 4:
      return 0.8 ** 2;
    default:
      return 0.6 ** 2;
  }
}

function calcKanjiScore(tegakiCount, tehonCount, inclusionCount) {
  // 線長を優遇し過ぎると ["未","末"], ["土","士"] の見分けができなくなる
  let lineScore = 1 - Math.abs((tehonCount - tegakiCount) / tehonCount);
  if (lineScore > 1) lineScore = 1;
  // 包含率を優遇し過ぎると ["一","つ"], ["二","＝"] の見分けができなくなる
  let inclusionScore = (tegakiCount - inclusionCount) / tegakiCount;
  if (inclusionScore > 1) inclusionScore = 1;
  // 画ごとに判定していないのでゆるく採点
  // 100点が取れないので少しだけ採点を甘くする
  let kakuScore = lineScore * inclusionScore * 100 / getScoringFactor(level);
  if (kakuScore < 0) kakuScore = 0;
  if (kakuScore > 100) kakuScore = 100;
  if (isNaN(kakuScore)) kakuScore = 0;
  return kakuScore;
}

function getKanjiScore(tegakiData, object) {
  const markerWidth = maxWidth * 2;
  const markerCanvas = document.createElement("canvas");
  markerCanvas.setAttribute("width", canvasSize);
  markerCanvas.setAttribute("height", canvasSize);
  const markerContext = markerCanvas.getContext("2d");
  const markerPad = new SignaturePad(markerCanvas, {
    minWidth: markerWidth,
    maxWidth: markerWidth,
    penColor: "black",
  });
  markerPad.fromData(tegakiData);
  const tegakiImgData =
    markerContext.getImageData(0, 0, canvasSize, canvasSize).data;
  const tegakiCount = countNoTransparent(tegakiImgData);
  const tehonImgData = object.getContext("2d")
    .getImageData(0, 0, canvasSize, canvasSize).data;
  const tehonCount = countNoTransparent(tehonImgData);

  const inclusionCount = getInclusionCount(tegakiImgData, tehonImgData);
  const kanjiScore = calcKanjiScore(tegakiCount, tehonCount, inclusionCount);
  return kanjiScore;
}

// function removeAnimations(object) {
//   const animations = object.querySelectorAll("path[clip-path]");
//   [...animations].forEach((animation) => {
//     animation.remove();
//   });
// }

function report() {
  const scores = [];
  const problems = document.getElementById("problems").children;
  for (let i = 0; i < problems.length; i++) {
    const tegakis = problems[i].shadowRoot.querySelector(".tegaki").children;
    for (let j = 0; j < tegakis.length; j++) {
      const score = tegakis[j].shadowRoot.querySelector(".score").textContent;
      scores.push(parseInt(score));
    }
  }
  let score = 0;
  for (let i = 0; i < scores.length; i++) {
    score += scores[i];
  }
  score /= scores.length;
  if (score >= 80) {
    playAudio("correctAll");
    let clearedKanjis = localStorage.getItem("touch-shodo");
    if (clearedKanjis) {
      kanjis.split("").forEach((kanji) => {
        if (!clearedKanjis.includes(kanji)) {
          clearedKanjis += kanji;
        }
      });
      localStorage.setItem("touch-shodo", clearedKanjis);
    } else {
      localStorage.setItem("touch-shodo", kanjis);
    }
    document.getElementById("report").classList.add("d-none");
    document.getElementById("correctReport").classList.remove("d-none");
    setTimeout(() => {
      location.href = "/touch-shodo/";
    }, 3000);
  } else {
    playAudio("stupid");
    document.getElementById("report").classList.add("d-none");
    document.getElementById("incorrectReport").classList.remove("d-none");
    setTimeout(() => {
      document.getElementById("report").classList.remove("d-none");
      document.getElementById("incorrectReport").classList.add("d-none");
    }, 6000);
  }
}

function shuffle(array) {
  for (let i = array.length; 1 < i; i--) {
    const k = Math.floor(Math.random() * i);
    [array[k], array[i - 1]] = [array[i - 1], array[k]];
  }
  return array;
}

function fetchJson(grade) {
  return new Promise((resolve) => {
    fetch(`/touch-shodo/data/${grade + 1}.json`)
      .then((response) => response.json())
      .then((data) => resolve(data));
  });
}

async function fetchJsons(grades) {
  const data = new Array(10);
  for (let i = 0; i < grades.length; i++) {
    await fetchJson(grades[i]).then((res) => {
      data[grades[i]] = res;
    });
  }
  return data;
}

let kanjis = "";
function initQuery() {
  const fontFace = new FontFace(
    fontFamily,
    "url(https://marmooo.github.io/touch-shodo/fonts/" + fontFamily + ".woff2)",
  );
  fontFace.load().then(() => {
    document.fonts.add(fontFace);

    const num = 5;
    const query = new URLSearchParams(location.search);
    kanjis = query.get("q") || "学";
    const targetKanjis = [];
    const targetGrades = [];
    const grades = new Array(10);
    Array.from(kanjis).forEach((kanji) => {
      const g = jkat.getGrade(kanji);
      if (g >= 0) {
        targetKanjis.push(kanji);
        targetGrades.push(g);
        grades[g] = true;
      }
    });
    fetchJsons([...new Set(targetGrades)]).then((data) => {
      let problems = [];
      if (targetKanjis.length == 1) {
        const kanji = targetKanjis[0];
        const grade = targetGrades[0];
        problems = [data[grade][kanji].shift()];
        problems = problems.concat(shuffle(data[grade][kanji]).slice(0, num));
      } else {
        targetKanjis.forEach((kanji, i) => {
          const grade = targetGrades[i];
          const candidates = data[grade][kanji].slice(1);
          problems = problems.concat(shuffle(candidates)[0]);
        });
      }
      loadDrill(problems);
      document.getElementById("problems").children[0]
        .shadowRoot.querySelector(".guard").style.height = "0";
    });
  });
}

function getGlobalCSS() {
  let cssText = "";
  for (const stylesheet of document.styleSheets) {
    try {
      for (const rule of stylesheet.cssRules) {
        cssText += rule.cssText;
      }
    } catch {
      // skip cross-domain issue (Google Fonts)
    }
  }
  const css = new CSSStyleSheet();
  css.replaceSync(cssText);
  return css;
}

const boxes = [];
const globalCSS = getGlobalCSS();
initQuery();

document.getElementById("toggleDarkMode").onclick = toggleDarkMode;
document.getElementById("hint").onclick = toggleHint;
document.getElementById("toggleScroll").onclick = toggleScroll;
document.getElementById("reportButton").onclick = report;
document.addEventListener("touchstart", unlockAudio, {
  once: true,
  useCapture: true,
});
