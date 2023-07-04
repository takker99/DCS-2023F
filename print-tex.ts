import { SteelDiameter } from "./steel.ts";
import {
  As,
  beta_d,
  beta_p,
  checkPoints,
  d,
  F_M1,
  F_M2,
  F_V1,
  F_V2,
  f_vvcd,
  F_w,
  j,
  l,
  Md1,
  Md2,
  Mud,
  n,
  P,
  sigma_s,
  Vcd,
  Vd1,
  Vd2,
  w,
} from "./mod.ts";
import {
  Command,
  EnumType,
} from "https://deno.land/x/cliffy@v0.25.7/command/mod.ts";

const steelType = new EnumType<SteelDiameter>([12.7, 15.9, 19.1, 22.2]);
type TableType = "moment" | "shear" | "crack" | "total";
const tableType = new EnumType<TableType>([
  "moment",
  "shear",
  "crack",
  "total",
]);

const { options: param, args: [table] } = await new Command()
  .name("print-tex")
  .description("擁壁の安全性の検討結果をTeXのテーブル形式で返す")
  .version("v0.1.0")
  .type("steel", steelType)
  .type("table-type", tableType)
  .option("--b2 <b2:number>", "擁壁の下端の幅(m)", { required: true })
  .option("--b4 <b4:number>", "擁壁の上端の幅(m)", { required: true })
  .option("--phi <phi:steel>", "鉄筋径(mm)", { required: true })
  .option("-c, --c <c:number>", "かぶり(mm)", { default: 52 })
  .option("--hs <hs:number>", "鉄筋端(m)", { default: 2 })
  .option("-m, --m <m:number>", "鉄筋の下部の本数", { default: 8 })
  .option("-n, --n <n:number>", "鉄筋の上部の本数", { default: 4 })
  .arguments("<table:table-type>")
  .parse(Deno.args);

const points = checkPoints(param);
switch (table) {
  case "moment":
    // 必要な検討箇所だけ残す
    points.splice(4, 3);
    points.splice(1, 2);
    console.log(
      String.raw`\begin{tabular}{${"c".repeat(points.length + 2)}}
  \toprule
  \multicolumn{2}{c}{$x(\si{m})$} & ${
        points.map((x) => `$\\num{${x.toPrecision(3)}}$`).join(" & ")
      }\\
  \midrule
  \multicolumn{2}{c}{$A_s(\si{mm^2})$} & ${
        points.map((x) => `$\\num{${As({ x, ...param }).toFixed(0)}}$`)
          .join(" & ")
      }\\
  \multicolumn{2}{c}{$d(\si{mm})$} & ${
        points.map((x) => `$\\num{${d({ x, ...param }).toPrecision(3)}}$`)
          .join(" & ")
      }\\
  \multicolumn{2}{c}{$p$} & ${
        points.map((x) => `$\\num{${P({ x, ...param }).toPrecision(3)}}$`)
          .join(" & ")
      }\\
  \multicolumn{2}{c}{$M_{ud}(\si{kN\cdot m})$} & ${
        points.map((x) => `$\\num{${Mud({ x, ...param }).toPrecision(3)}}$`)
          .join(" & ")
      }\\
  \midrule
  常時 & $\gamma_iM_d(\si{kN\cdot m})$ & ${
        points.map((x) =>
          `$\\num{${(1.15 * Md1({ x, ...param })).toPrecision(3)}}$`
        )
          .join(" & ")
      }\\
   & $\gamma_i\frac{M_d}{M_{ud}}$ & ${
        points.map((x) => `$\\num{${F_M1({ x, ...param }).toPrecision(3)}}$`)
          .join(" & ")
      }\\
  \midrule
  地震時 & $\gamma_iM_d(\si{kN\cdot m})$ & ${
        points.map((x) => `$\\num{${Md2({ x, ...param }).toPrecision(3)}}$`)
          .join(" & ")
      }\\
   & $\gamma_i\frac{M_d}{M_{ud}}$ & ${
        points.map((x) => `$\\num{${F_M2({ x, ...param }).toPrecision(3)}}$`)
          .join(" & ")
      }\\
  \bottomrule
\end{tabular}`,
    );
    break;
  case "shear":
    // 必要な検討箇所だけ残す
    points.splice(0, 1);
    points.splice(1, 1);
    points.splice(3, 2);
    console.log(
      String.raw`\begin{tabular}{${"c".repeat(points.length + 2)}}
  \toprule
  \multicolumn{2}{c}{$x(\si{m})$} & ${
        points.map((x) => `$\\num{${x.toPrecision(3)}}$`).join(" & ")
      }\\
  \midrule
  \multicolumn{2}{c}{$d(\si{mm})$} & ${
        points.map((x) => `$\\num{${d({ x, ...param }).toPrecision(3)}}$`)
          .join(" & ")
      }\\
  \multicolumn{2}{c}{$\beta_d$} & ${
        points.map((x) =>
          `$\\num{${(beta_d({ x, ...param })).toPrecision(3)}}$`
        )
          .join(" & ")
      }\\
  \multicolumn{2}{c}{$\beta_p$} & ${
        points.map((x) =>
          `$\\num{${(beta_p({ x, ...param })).toPrecision(3)}}$`
        )
          .join(" & ")
      }\\
  \multicolumn{2}{c}{$f_{vvcd}(\si{N\cdot{mm}^{-2}})$} & ${
        points.map((x) => `$\\num{${f_vvcd({ x, ...param }).toPrecision(3)}}$`)
          .join(" & ")
      }\\
  \multicolumn{2}{c}{$V_{cd}(\si{kN\cdot m^{-1}})$} & ${
        points.map((x) => `$\\num{${Vcd({ x, ...param }).toPrecision(3)}}$`)
          .join(" & ")
      }\\
  \midrule
  常時 & $M_d(\si{kN\cdot m})$ & ${
        points.map((x) => `$\\num{${Md1({ x, ...param }).toPrecision(3)}}$`)
          .join(" & ")
      }\\
   & $\gamma_iV_d(\si{kN\cdot m^{-1}})$ & ${
        points.map((x) =>
          `$\\num{${(1.15 * Vd1({ x, ...param })).toPrecision(3)}}$`
        )
          .join(" & ")
      }\\
   & $\gamma_i\frac{V_d}{V_{cd}}$ & ${
        points.map((x) => `$\\num{${F_V1({ x, ...param }).toPrecision(3)}}$`)
          .join(" & ")
      }\\
  \midrule
  地震時 & $M_d(\si{kN\cdot m})$ & ${
        points.map((x) => `$\\num{${Md2({ x, ...param }).toPrecision(3)}}$`)
          .join(" & ")
      }\\
   & $\gamma_iV_d(\si{kN\cdot m^{-1}})$ & ${
        points.map((x) => `$\\num{${(Vd2({ x, ...param })).toPrecision(3)}}$`)
          .join(" & ")
      }\\
   & $\gamma_i\frac{V_d}{V_{cd}}$ & ${
        points.map((x) => `$\\num{${F_V2({ x, ...param }).toPrecision(3)}}$`)
          .join(" & ")
      }\\
  \bottomrule
\end{tabular}`,
    );
    break;
  case "crack":
    // 剪断力の検討箇所を省く
    points.splice(1, 1);
    console.log(
      String.raw`\begin{tabular}{${"c".repeat(points.length + 1)}}
  \toprule
  $x(\si{m})$ & ${
        points.map((x) => `$\\num{${x.toPrecision(3)}}$`).join(" & ")
      }\\
  \midrule
  $M_d(\si{kN\cdot m})$ & ${
        points.map((x) =>
          `$\\num{${(Md1({ x, ...param }) / 1.15).toPrecision(3)}}$`
        ).join(" & ")
      }\\
  \midrule
  $np$ & ${
        points.map((x) => `$\\num{${(n * P({ x, ...param })).toPrecision(3)}}$`)
          .join(" & ")
      }\\
  $k$ & ${
        points.map((x) =>
          `$\\num{${(3 * (1 - j({ x, ...param }))).toPrecision(3)}}$`
        )
          .join(" & ")
      }\\
  $j$ & ${
        points.map((x) => `$\\num{${j({ x, ...param }).toPrecision(3)}}$`)
          .join(" & ")
      }\\
  $A_s(\si{mm^2})$ & ${
        points.map((x) => `$\\num{${As({ x, ...param }).toFixed(0)}}$`)
          .join(" & ")
      }\\
  $d(\si{mm})$ & ${
        points.map((x) => `$\\num{${d({ x, ...param }).toPrecision(3)}}$`)
          .join(" & ")
      }\\
  $\sigma_s(\si{N\cdot{mm}^{-1}})$ & ${
        points.map((x) => `$\\num{${sigma_s({ x, ...param }).toPrecision(3)}}$`)
          .join(" & ")
      }\\
  \midrule
  $l(\si{mm})$ & ${
        points.map((x) => `$\\num{${l({ x, ...param }).toPrecision(3)}}$`)
          .join(" & ")
      }\\
  $w(\si{mm})$ & ${
        points.map((x) => `$\\num{${w({ x, ...param }).toPrecision(3)}}$`)
          .join(" & ")
      }\\
  $w/w_a$ & ${
        points.map((x) => `$\\num{${F_w({ x, ...param }).toPrecision(3)}}$`)
          .join(" & ")
      }\\
  \bottomrule
\end{tabular}`,
    );
    break;
  case "total":
    console.log(
      String.raw`\begin{tabular}{${"c".repeat(points.length + 1)}}
  \toprule
  $x(\si{m})$ & ${
        points.map((x) => `$\\num{${x.toPrecision(3)}}$`).join(" & ")
      }\\
  \midrule
   地震時$\gamma_i\frac{M_d}{M_{ud}}$ & ${
        points.map((x) => `$\\num{${F_M2({ x, ...param }).toPrecision(3)}}$`)
          .join(" & ")
      }\\
   地震時$\gamma_i\frac{V_d}{V_{cd}}$ & ${
        points.map((x) => `$\\num{${F_V2({ x, ...param }).toPrecision(3)}}$`)
          .join(" & ")
      }\\
  $w/w_a$ & ${
        points.map((x) => `$\\num{${F_w({ x, ...param }).toPrecision(3)}}$`)
          .join(" & ")
      }\\
  \bottomrule
\end{tabular}`,
    );
    break;
}
