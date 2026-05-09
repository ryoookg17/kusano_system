import { allSchoolData } from "@shared/schools";

export const SCHOOL_LIST = allSchoolData;

export const AREA_MAP: Record<string, string> = {
    "nagasaki": "長崎市",
    "isahaya": "諫早市",
    "omura": "大村市",
    "nishisonogi": "西彼杵郡",
    "special": "特別支援（地域なし）"
};

export const TYPE_MAP: Record<string, string> = {
    "elementary": "小学校",
    "junior": "中学校",
    "high": "高校",
    "special": "特別支援"
};

/**
 * 学校名から市区と種別を判定します
 */
export function getSchoolCategory(schoolName: string) {
    // 特別支援学校を先に判定
    if (SCHOOL_LIST.special.includes(schoolName)) {
        return { type: "特別支援", area: "特別支援（地域なし）" };
    }

    // 小・中・高をループで検索
    const types = ["elementary", "junior", "high"] as const;
    const areas = ["nagasaki", "isahaya", "omura", "nishisonogi"] as const;

    for (const type of types) {
        for (const area of areas) {
            const list = (SCHOOL_LIST[type] as any)[area];
            if (list && list.includes(schoolName)) {
                return { 
                    type: TYPE_MAP[type], 
                    area: AREA_MAP[area] 
                };
            }
        }
    }

    return { type: "未分類", area: "未分類" };
}
