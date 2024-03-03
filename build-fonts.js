import { basename } from "https://deno.land/std/path/mod.ts";
import { expandGlobSync } from "https://deno.land/std/fs/expand_glob.ts";
import { ttf2svgFont } from "@marmooo/ttf2svg";
import { JKAT } from "@marmooo/kanji";
import svg2ttf from "svg2ttf";
import ttf2woff2 from "ttf2woff2";

function buildPreview() {
  const chars = "臨機応変疾風迅雷明鏡止水一糸不乱伝家宝刀奇想天外";
  for (const file of expandGlobSync("fonts/*.ttf", { globstar: true })) {
    const svg = ttf2svgFont(file.path, chars);
    const ttf = svg2ttf(svg);
    const woff2 = ttf2woff2(ttf.buffer);

    const name = basename(file.path).split(".")[0];
    const outPath = `src/fonts/${name}-preview.woff2`;
    Deno.writeFileSync(outPath, woff2);
  }
}

function buildWoff2() {
  const hirakanas = "ぁあぃいぅうぇえぉおかがきぎくぐけげこごさざしじすずせぜそぞただちぢっつづてでとどなにぬねのはばぱひびぴふぶぷへべぺほぼぽまみむめもゃやゅゆょよらりるれろゎわゐゑをんゔァアィイゥウェエォオカガキギクグケゲコゴサザシジスズセゼソゾタダチヂッツヅテデトドナニヌネノハバパヒビピフブプヘベペホボポマミムメモャヤュユョヨラリルレロヮワヰヱヲンヴヵ";
  const kanjis = JKAT.slice(0, 10).flat().join("");
  const chars = hirakanas + kanjis;
  for (const file of expandGlobSync("fonts/*.ttf", { globstar: true })) {
    const svg = ttf2svgFont(file.path, chars);
    const ttf = svg2ttf(svg);
    const woff2 = ttf2woff2(ttf.buffer);

    const name = basename(file.path).split(".")[0];
    const outPath = `src/fonts/${name}.woff2`;
    Deno.writeFileSync(outPath, woff2);
  }
}

buildPreview();
buildWoff2();
