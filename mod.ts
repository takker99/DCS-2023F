import { steelArea, SteelDiameter } from "./steel.ts";

// 安全係数
const gamma_a = 1;
const gamma_f = 1.15;
const gamma_b = 1.15;
const gamma_s = 1;
const gamma_c = 1.3;

// 設計強度
/** コンクリートの設計基準強度 (N/mm^2) */
const f_ck = 30;
/** 鉄筋の降伏強度の特性値 (N/mm^2) */
const f_yk = 345;
/** コンクリートの設計圧縮強度 (N/mm^2) */
const f_cd = f_ck / gamma_c;
/** 鉄筋の設計降伏強度の特性値 (N/mm^2) */
const f_yd = f_yk / gamma_s;
/** 鉄筋とコンクリートの付着強度 (N/mm^2) */
const f_bod = 0.28 * (f_ck) ** (2 / 3) / gamma_c;

/** 水平震度 */
const kh = 0.2;

// 変更不能な擁壁条件

/** 擁壁の高さ (m) */
const h1 = 4.5;
/** 擁壁の単位幅 (mm) */
const b = 1000;
/** 擁壁の単位体積重量 (kN/m3) */
const w0 = 24;

// 変更不能な外力条件

/** 裏込め土の単位体積重量 (kN/m3) */
const w1 = 17;
const beta1 = 0.5 * (1 / 6) * Math.PI;
const beta2 = 0;
/** 分布上載荷重 (kN/m2) */
const q0 = 12;
/** 常時Coulomb主働土圧係数 */
const k1 = 0.321;
/** 地震時Coulomb主働土圧係数 */
const k2 = 0.52;

/** 変更対象のパラメタ */
export interface Param {
  /** 縦方向の位置 (m) */
  x: number;
  /** 擁壁下端の幅 (m) */
  b2: number;
  /** 擁壁上端の幅 (m) */
  b4: number;
  /** かぶり (mm) */
  c: number;
  /** 主鉄筋の公称直径 (mm) */
  phi: SteelDiameter;
  /** 鉄筋の本数が変化する位置 */
  hs: number;

  /** 下部の鉄筋本数 */
  m: number;
  /** 上部の鉄筋本数 */
  n: number;
}

// 主鉄筋の引張側定着に基づく検討位置

/** 基本定着長 (mm) */
const l_d = (p: Pick<Param, "phi">): number =>
  0.25 * 0.6 * p.phi * (f_yd / f_bod);

/** 定着長の検討断面高さ (m)*/
const x1 = (p: Omit<Param, "x">): number =>
  ((p1) => p1.x - d(p1))({
    ...p,
    x: p.hs - l_d(p) / 1000,
  });

/** 位置xでの主鉄筋の断面積 (mm2) */
const As = (p: Param): number => (p.x < x1(p) ? p.m : p.n) * steelArea(p.phi);

/** 位置xでの主鉄筋間隔 (mm) */
const cs = (p: Param): number => p.x < x1(p) ? b / p.m : b / p.n;

/** 主鉄筋比 */
const P = (p: Param): number => As(p) / (b * 1000 * d(p));

/** x=0mでの断面有効高さ (m) */
const d0 = (p: Param): number => p.b2 - (p.c + 0.5 * p.phi) / 1000;

/** 断面有効高さ (m) */
const d = (p: Param): number => d0(p) - (p.b2 - p.b4) / h1 * p.x;

// 断面力の算定

/** (kN/m3) */
const Vd1a = gamma_a * gamma_f * k1 * (1 / 2) * w1 * Math.cos(beta1);
/** (kN/m2) */
const Vd1b = gamma_a * gamma_f * k1 * q0 * Math.cos(beta1);

/** 常時作用曲げmoment (kN) */
const Md1 = ({ x }: Param) =>
  (1 / 3) * Vd1a * (h1 - x) ** 3 +
  (1 / 2) * Vd1b * (h1 - x) ** 2;
/** 常時作用剪断力 (kN/m) */
const Vd1 = (p: Param) =>
  Vd1a * (h1 - p.x) ** 2 +
  Vd1b * (h1 - p.x) -
  (p.b2 - p.b4) / h1 * (Md1(p) / d(p));

/** (kN/m3) */
const Vd2a = ({ b2, b4 }: Param): number =>
  gamma_a * gamma_f * (1 / 2) * (
    k2 * w1 * Math.cos(beta2) +
    kh * w0 * (b2 - b4) / h1
  );
/** (kN/m2) */
const Vd2b = ({ b4 }: Param): number =>
  gamma_a * gamma_f * (
    k2 * q0 * Math.cos(beta2) +
    kh * w0 * b4
  );

/** 地震時作用曲げmoment (kN) */
const Md2 = (p: Param): number =>
  (1 / 3) * Vd2a(p) * (h1 - p.x) ** 3 +
  (1 / 2) * Vd2b(p) * (h1 - p.x) ** 2;
/** 地震時作用剪断力 (kN/m) */
const Vd2 = (p: Param) =>
  Vd2a(p) * (h1 - p.x) ** 2 +
  Vd2b(p) * (h1 - p.x) -
  (p.b2 - p.b4) / h1 * (Md2(p) / d(p));

/** 設計単位幅曲げ耐力 (kN) */
const Mud = (p: Param): number =>
  As(p) * f_yd * d(p) * (1 - 0.6 * P(p) * (f_yd / f_cd)) / gamma_b / b;

/** (N/mm2) */
const f_vcd = 0.20 * (f_cd) ** (1 / 3);
const beta_d = (p: Param): number => Math.min((1 / d(p)) ** 0.25, 1.5);
const beta_p = (p: Param): number => Math.min((100 * P(p)) ** (1 / 3), 1.5);
/** 設計斜めひび割れ強度 (N/mm2) */
const f_vvcd = (p: Param): number => beta_d(p) * beta_p(p) * f_vcd;
/** 設計単位幅剪断耐力 (kN/m) */
const Vcd = (p: Param): number => f_vvcd(p) * 1000 * d(p) / 1.3;

/** young率比 */
const n = 7.1;
/** 鉄筋のYoung率 (kN/mm2) */
const E_s = 200;
const j = (p: Param): number =>
  1 - (-n * P(p) + ((n * P(p) + 1) ** 2 - 1) ** 0.5) / 3;

/** 鉄筋応力 (kN/mm^2) */
const sigma_s = (p: Param): number =>
  b * Md1(p) / (gamma_a * gamma_f * As(p) * 1000 * d(p) * j(p));
/** 許容ひび割れ幅 (mm) */
const wa = ({ c }: Param): number => 0.005 * c;
/** ひび割れ幅 (mm) */
const w = (p: Param): number =>
  (4 * p.c + 0.7 * (cs(p) - p.phi)) * (sigma_s(p) / E_s);

/** 常時曲げ検討 */
export const F_M1 = (p: Param): number => 1.15 * Md1(p) / Mud(p);
/** 地震時曲げ検討 */
export const F_M2 = (p: Param): number => Md2(p) / Mud(p);
/** 常時剪断検討 */
export const F_V1 = (p: Param): number => 1.15 * Vd1(p) / Vcd(p);
/** 地震時剪断検討 */
export const F_V2 = (p: Param): number => Vd2(p) / Vcd(p);
/** 曲げひび割れ検討 */
export const F_w = (p: Param): number => w(p) / wa(p);

/** 曲げ, 剪断, ひび割れすべてで安全なら`true`を返す */
export const isSafe = (p: Param): boolean =>
  Math.max(F_M1(p), F_M2(p), F_V1(p), F_V2(p), F_w(p)) <= 1.0;

/** 単位幅鉄筋量 (mm^2)
 *
 * 長さ2mの下部鉄筋が8本, 長さ4.5mの上部鉄筋が4本
 *
 * 配力鉄筋量も考慮する
 */
export const V_s = (p: Omit<Param, "x">): number =>
  steelArea(p.phi) * (p.hs * p.m + (h1 - p.hs) * p.n) / (b / 1000);
// 幅1mあたりで計算
// 鉄筋間隔が250mm
+steelArea(12.7) * (1000 * h1) / 250;

/** 単位幅コンクリート量 (mm^2) */
export const V_c = (p: Omit<Param, "x">): number =>
  0.5 * (p.b2 + p.b4) * h1 * 10 ** 6 - V_s(p);

/** 検討位置 */
export const checkPoints = (
  p: Omit<Param, "x">,
): [number, number, number, number, number, number, number] => [
  0,
  p.b2 / 2,
  1,
  x1(p),
  2,
  3,
  4,
];
