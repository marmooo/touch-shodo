import { basename } from "jsr:@std/path";
import { expandGlobSync } from "jsr:@std/fs";
import { convert } from "npm:fontconv@0.0.3";
import { JKAT } from "npm:@marmooo/kanji@0.0.8";

async function buildPreview() {
  const text = "臨機応変疾風迅雷明鏡止水一糸不乱伝家宝刀奇想天外";
  for (const file of expandGlobSync("fonts/*.ttf", { globstar: true })) {
    const ttf = Deno.readFileSync(file.path);
    const woff2 = await convert(ttf, ".woff2", { text, removeLigatures: true });
    const name = basename(file.path).split(".")[0];
    const outPath = `src/fonts/${name}-preview.woff2`;
    Deno.writeFileSync(outPath, woff2);
  }
}

async function buildWoff2() {
  const hirakanas = "ぁあぃいぅうぇえぉおかがきぎくぐけげこごさざしじすずせぜそぞただちぢっつづてでとどなにぬねのはばぱひびぴふぶぷへべぺほぼぽまみむめもゃやゅゆょよらりるれろゎわゐゑをんゔァアィイゥウェエォオカガキギクグケゲコゴサザシジスズセゼソゾタダチヂッツヅテデトドナニヌネノハバパヒビピフブプヘベペホボポマミムメモャヤュユョヨラリルレロヮワヰヱヲンヴヵ";
  const kanjis = JKAT.slice(0, 10).flat().join("");
  const text = hirakanas + kanjis;
  for (const file of expandGlobSync("fonts/*.ttf", { globstar: true })) {
    const ttf = Deno.readFileSync(file.path);
    const woff2 = await convert(ttf, ".woff2", { text, removeLigatures: true });
    const name = basename(file.path).split(".")[0];
    const outPath = `src/fonts/${name}.woff2`;
    Deno.writeFileSync(outPath, woff2);
  }
}

await buildPreview();
await buildWoff2();
