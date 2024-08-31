import { Kanji } from "https://cdn.jsdelivr.net/npm/@marmooo/kanji@0.0.8/esm/kanji.js";
import { JKAT } from "https://cdn.jsdelivr.net/npm/@marmooo/kanji@0.0.8/esm/jkat.js";
import signaturePad from "https://cdn.jsdelivr.net/npm/signature_pad@5.0.3/+esm";

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
const defaultFontURL = new URL(
  `${location.origin}/touch-shodo/fonts/aoyagireisyosimo.woff2`,
);
const googleFontsURL = new URL("https://fonts.googleapis.com/css2");
const repeatCount = 3;
let canvasSize = 140;
let prevCanvasSize;
let maxWidth = 4;
if (globalThis.innerWidth >= 768) {
  canvasSize = 280;
  maxWidth = 8;
}
let kanjis = "";
let level = 2;
let clearCount = 0;
let fontFamily = "aoyagireisyosimo";
let audioContext;
const audioBufferCache = {};
let japaneseVoices = [];
loadVoices();
loadConfig();

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

// TODO: :host-context() is not supportted by Safari/Firefox now
function toggleDarkMode() {
  if (localStorage.getItem("darkMode") == 1) {
    localStorage.setItem("darkMode", 0);
    document.documentElement.setAttribute("data-bs-theme", "light");
    boxes.forEach((box) => {
      const target = box.shadowRoot.querySelectorAll("object, canvas");
      [...target].forEach((canvas) => {
        canvas.removeAttribute("style");
      });
    });
  } else {
    localStorage.setItem("darkMode", 1);
    document.documentElement.setAttribute("data-bs-theme", "dark");
    boxes.forEach((box) => {
      const target = box.shadowRoot.querySelectorAll("object, canvas");
      [...target].forEach((canvas) => {
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
  const scrollOn = document.getElementById("scrollOn");
  const scrollOff = document.getElementById("scrollOff");
  if (scrollOn.classList.contains("d-none")) {
    document.body.style.overflow = "visible";
    scrollOn.classList.remove("d-none");
    scrollOff.classList.add("d-none");
  } else {
    document.body.style.overflow = "hidden";
    scrollOn.classList.add("d-none");
    scrollOff.classList.remove("d-none");
  }
}

function toggleVoice() {
  const voiceOn = document.getElementById("voiceOn");
  const voiceOff = document.getElementById("voiceOff");
  if (voiceOn.classList.contains("d-none")) {
    voiceOn.classList.remove("d-none");
    voiceOff.classList.add("d-none");
  } else {
    voiceOn.classList.add("d-none");
    voiceOff.classList.remove("d-none");
  }
}

function createAudioContext() {
  if (globalThis.AudioContext) {
    return new globalThis.AudioContext();
  } else {
    console.error("Web Audio API is not supported in this browser");
    return null;
  }
}

function unlockAudio() {
  if (audioContext) {
    audioContext.resume();
  } else {
    audioContext = createAudioContext();
    loadAudio("stupid", "/touch-shodo/mp3/stupid5.mp3");
    loadAudio("correct", "/touch-shodo/mp3/correct3.mp3");
    loadAudio("correctAll", "/touch-shodo/mp3/correct1.mp3");
    loadAudio("incorrect", "/touch-shodo/mp3/incorrect1.mp3");
  }
  document.removeEventListener("pointerdown", unlockAudio);
  document.removeEventListener("keydown", unlockAudio);
}

async function loadAudio(name, url) {
  if (!audioContext) return;
  if (audioBufferCache[name]) return audioBufferCache[name];
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    audioBufferCache[name] = audioBuffer;
    return audioBuffer;
  } catch (error) {
    console.error(`Loading audio ${name} error:`, error);
    throw error;
  }
}

function playAudio(name, volume) {
  if (!audioContext) return;
  const audioBuffer = audioBufferCache[name];
  if (!audioBuffer) {
    console.error(`Audio ${name} is not found in cache`);
    return;
  }
  const sourceNode = audioContext.createBufferSource();
  sourceNode.buffer = audioBuffer;
  const gainNode = audioContext.createGain();
  if (volume) gainNode.gain.value = volume;
  gainNode.connect(audioContext.destination);
  sourceNode.connect(gainNode);
  sourceNode.start();
}

function loadVoices() {
  // https://stackoverflow.com/questions/21513706/
  const allVoicesObtained = new Promise((resolve) => {
    let voices = speechSynthesis.getVoices();
    if (voices.length !== 0) {
      resolve(voices);
    } else {
      let supported = false;
      speechSynthesis.addEventListener("voiceschanged", () => {
        supported = true;
        voices = speechSynthesis.getVoices();
        resolve(voices);
      });
      setTimeout(() => {
        if (!supported) {
          document.getElementById("noTTS").classList.remove("d-none");
        }
      }, 1000);
    }
  });
  allVoicesObtained.then((voices) => {
    japaneseVoices = voices.filter((voice) => voice.lang == "ja-JP");
  });
}

function loopVoice(text, n) {
  speechSynthesis.cancel();
  const msg = new globalThis.SpeechSynthesisUtterance(text);
  msg.voice = japaneseVoices[Math.floor(Math.random() * japaneseVoices.length)];
  msg.lang = "ja-JP";
  for (let i = 0; i < n; i++) {
    speechSynthesis.speak(msg);
  }
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
      const target = this.shadowRoot.querySelectorAll("object, canvas");
      [...target].forEach((canvas) => {
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
  ctx.font = `${fontSize}px ${fontFamily}`;
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
  // let object = box.shadowRoot.querySelector("svg");
  // let text = object.querySelector("text");
  // text.textContent = kanji;
  // text.setAttribute("font-family", fontFamily);
  // if (loadCanvas) {
  //   text.setAttribute("fill", "lightgray");
  //   text.setAttribute("font-weight", 900);
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
          clearCount += 1;
          problemBox.shadowRoot.querySelector(".guard").style.height = "100%";
          const next = problemBox.nextElementSibling;
          if (next) {
            const voiceOff = document.getElementById("voiceOn")
              .classList.contains("d-none");
            if (!voiceOff) {
              const hira = words[clearCount].split("|")[1];
              loopVoice(hira, repeatCount);
            }
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
  const pad = new signaturePad(canvas, {
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
  const markerPad = new signaturePad(markerCanvas, {
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

async function loadGoogleFonts(fontFamily) {
  const problemText = words.flat().map((str) => str.split("|")[0]).join("");
  const text = [...new Set(problemText)].join("");
  const params = new URLSearchParams();
  params.set("family", fontFamily);
  params.set("text", text);
  params.set("display", "swap");
  googleFontsURL.search = params;

  const response = await fetch(googleFontsURL);
  const css = await response.text();
  const matchUrls = css.match(/url\(.+?\)/g);
  for (const url of matchUrls) {
    const font = new FontFace(fontFamily, url);
    await font.load();
    document.fonts.add(font);
  }
}

async function initWords() {
  const num = 5;
  const targetGrades = [];
  const targetKanjis = [];
  Array.from(kanjis).forEach((kanji) => {
    const grade = jkat.getGrade(kanji);
    if (grade >= 0) {
      targetGrades.push(grade);
      targetKanjis.push(kanji);
    }
  });
  const promises = targetGrades.map((grade) => fetchJson(grade));
  const data = await Promise.all(promises);
  const words = [];
  if (targetKanjis.length == 1) {
    const kanji = targetKanjis[0];
    const onkun = data[0][kanji].shift();
    const problems = shuffle(data[0][kanji]);
    words.push(onkun, ...problems.slice(0, num));
  } else {
    data.forEach((datum, i) => {
      const kanji = targetKanjis[i];
      datum[kanji].shift();
      const problems = shuffle(datum[kanji]);
      words.push(problems[0]);
    });
  }
  return words;
}

function initDrill() {
  const tegakiPads = [];
  words.forEach((word) => {
    const pads = loadProblem(word);
    tegakiPads.push(pads);
  });
  document.getElementById("problems").children[0]
    .shadowRoot.querySelector(".guard").style.height = "0";
  globalThis.addEventListener("resize", () => {
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
  });
}

function initQuery() {
  const params = new URLSearchParams(location.search);
  kanjis = params.get("q") || "学";
}

async function initFonts() {
  let fontURL = localStorage.getItem("touch-shodo-font");
  if (!fontURL) fontURL = defaultFontURL.toString();
  try {
    const url = new URL(fontURL);
    if (url.host == googleFontsURL.host) {
      fontFamily = url.searchParams.get("family");
      await loadGoogleFonts(fontFamily);
    } else {
      fontFamily = "abc";
      const fontFace = new FontFace(fontFamily, `url(${fontURL})`);
      await fontFace.load();
      document.fonts.add(fontFace);
    }
  } catch (err) {
    console.log(err);
  }
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
initQuery();
const words = await initWords();
await initFonts();
const globalCSS = getGlobalCSS();
initDrill();

document.getElementById("toggleDarkMode").onclick = toggleDarkMode;
document.getElementById("hint").onclick = toggleHint;
document.getElementById("toggleScroll").onclick = toggleScroll;
document.getElementById("toggleVoice").onclick = toggleVoice;
document.getElementById("reportButton").onclick = report;
document.addEventListener("pointerdown", unlockAudio, { once: true });
document.addEventListener("keydown", unlockAudio, { once: true });
