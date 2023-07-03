import { SteelDiameter } from "./steel.ts";
import { checkPoints, isSafe, Param, V_c, V_s } from "./mod.ts";

/** かぶり (mm)
 *
 * 固定値とする
 */
const c = 52;

/** 初期パラメタ */
const param0: Omit<Param, "x"> = {
  b2: 0.45,
  b4: 0.30,
  c,
  phi: 19.1,
  hs: 2,
  m: 8,
  n: 4,
};

let minVs = V_s(param0);
let minVc = V_c(param0);
/** [0][0]が両方最小、[0][1]がコンクリート最小、[1][0]が鉄筋最小 [1][1]が初期パラメタ */
const minParams: Omit<Param, "x">[][] = [[param0, param0], [param0, param0]];
// 主鉄筋にD13は採用しない
for (const phi of ([15.9, 19.1, 22.2] as SteelDiameter[])) {
  // 1cm刻みで増やす
  for (let bm = Math.ceil((2 * c + phi) / 10) / 100; bm < 0.7; bm += 0.01) {
    // 1cm刻みで増やす
    for (let bs = 0; bs < bm - (2 * c + phi) / 1000; bs += 0.01) {
      // 1cm刻みで増やす
      for (let hs = 0.5; hs <= 4.0; hs += 0.01) {
        for (const n of [3, 4, 5, 6]) {
          // 主鉄筋の制約条件
          //  主鉄筋間隔と配力鉄筋量で決まる
          for (
            let m = Math.max(n, 3);
            m <= (phi === 15.9 ? 15 : phi === 19.1 ? 10 : 7);
            m++
          ) {
            if (m % n !== 0) continue;
            const param: Omit<Param, "x"> = {
              phi,
              hs,
              b2: bm + bs,
              b4: bm - bs,
              c,
              m,
              n,
            };
            // 一番短いところで確定する
            if (!checkPoints(param).every((x) => isSafe({ x, ...param }))) {
              continue;
            }

            // 最小値だったら更新する
            const vs = V_s(param);
            const vc = V_c(param);
            if (minVc > vc) {
              minVc = vc;
              minParams[0][1] = param;
              if (minVs > vs) {
                minVs = vs;
                minParams[1][1] = param;
                minParams[1][0] = param;
              }
            } else if (minVs > vs) {
              minVs = vs;
              minParams[1][0] = param;
            }
            break;
          }
        }
      }
    }
  }
}
const view = (p: Omit<Param, "x">) => [
  p.b2.toPrecision(3),
  p.b4.toPrecision(3),
  p.hs.toPrecision(3),
  p.phi,
  p.m,
  p.n,
  V_c(p),
  V_s(p),
];
console.table({
  head: ["b2", "b4", "hs", "phi", "m", "n", "V_c", "V_s"],
  default: view(minParams[0][0]),
  minVc: view(minParams[0][1]),
  minVs: view(minParams[1][0]),
  min: view(minParams[1][1]),
});
