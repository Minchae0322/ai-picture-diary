/** 도구마다 선이 남는 방식이 다르다. 굵기·투명도만 바꾸면 전부 같은 펜으로 보인다 */
export type PenTool = 'pencil' | 'colored' | 'marker' | 'highlighter' | 'brush';

export const PEN_TOOLS: Array<{ id: PenTool; label: string }> = [
    { id: 'pencil', label: '연필' },
    { id: 'colored', label: '색연필' },
    { id: 'marker', label: '사인펜' },
    { id: 'highlighter', label: '형광펜' },
    { id: 'brush', label: '붓' },
];

export const PEN_WIDTHS = [2, 5, 10];
