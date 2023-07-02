/** 公称直径 単位はmm */
export type SteelDiameter = 12.7 | 15.9 | 19.1 | 22.2;

/** 公称断面積 単位はmm^2 */
export type SteelArea = 126.7 | 198.6 | 286.5 | 387.1;
/** 与えられた公称直径に対応する公称断面積を返す
 *
 * @param diameter 公称直径 (mm)
 * @return 公称断面積 (mm^2)
 */

export const steelArea = (diameter: SteelDiameter): SteelArea => {
  switch (diameter) {
    case 12.7:
      return 126.7;
    case 15.9:
      return 198.6;
    case 19.1:
      return 286.5;
    case 22.2:
      return 387.1;
  }
};
