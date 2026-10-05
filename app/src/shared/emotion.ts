/**
 * 감정 9종. 서버 enum(diary.Emotion)과 1:1이고 표시명·그림은 프론트가 매핑한다(api-design 5장).
 * 커뮤니티·캘린더·그래프가 같은 어휘를 써야 해서 feature 가 아니라 shared 에 둔다.
 *
 * **감정을 과일 캐릭터로 표현한다.** 한때 날씨 6종(맑음·비·눈 ...)이었으나 감정 9종으로 바꿨다.
 * 날씨는 은유를 한 겹 더 거치는 데다 6칸이 감정을 담기에 좁았다.
 *
 * 그림이 정체성을 나른다 - 색이 아니다. 과일 색을 범주 색으로 쓰면 빨강이 셋이라
 * (체리 energetic / 딸기 happy / 토마토 soso) 색만으로는 구분되지 않는다.
 * 그래서 `emotionColor` 는 **장식용 색조**일 뿐이고, 뜻은 항상 그림이나 라벨이 전한다(dataviz).
 */

export type Emotion =
  | 'HAPPY'
  | 'ENERGETIC'
  | 'SOSO'
  | 'SHY'
  | 'EMBARRASSED'
  | 'TIRED'
  | 'SAD'
  | 'DEPRESSED'
  | 'ANGRY';

/** 밝은 쪽에서 어두운 쪽으로. 06 그래프의 세로축 순서이자 칩이 놓이는 순서다 */
export const EMOTIONS: Emotion[] = [
  'HAPPY',
  'ENERGETIC',
  'SOSO',
  'SHY',
  'EMBARRASSED',
  'TIRED',
  'SAD',
  'DEPRESSED',
  'ANGRY',
];

export const EMOTION_LABEL: Record<Emotion, string> = {
  HAPPY: '행복한',
  ENERGETIC: '활기찬',
  SOSO: '무난한',
  SHY: '부끄러운',
  EMBARRASSED: '황당한',
  TIRED: '피곤한',
  /** 가지는 지정받지 못해 나머지와 같은 꼴로 맞췄다 */
  SAD: '슬픈',
  DEPRESSED: '우울한',
  ANGRY: '화난',
};

/** 어떤 과일인지. 라벨 옆에 덧붙이지 않고, 문서와 접근성 설명에서만 쓴다 */
export const EMOTION_FRUIT: Record<Emotion, string> = {
  HAPPY: '딸기',
  ENERGETIC: '체리',
  SOSO: '토마토',
  SHY: '복숭아',
  EMBARRASSED: '당근',
  TIRED: '아보카도',
  SAD: '가지',
  DEPRESSED: '블루베리',
  ANGRY: '키위',
};

/**
 * 손그림 캐릭터. 투명 배경 PNG 512x512 로, 원본 1080 JPEG 에서 바깥 흰색만
 * flood fill 로 지우고 가장자리는 흰색을 언매트해 테두리가 남지 않게 만들었다.
 * 아이콘이 아니라 그림이라 `Icon.tsx` 가 아니라 자산으로 둔다.
 */
export const EMOTION_IMAGE: Record<Emotion, number> = {
  HAPPY: require('@assets/images/emotions/happy.png'),
  ENERGETIC: require('@assets/images/emotions/energetic.png'),
  SOSO: require('@assets/images/emotions/soso.png'),
  SHY: require('@assets/images/emotions/shy.png'),
  EMBARRASSED: require('@assets/images/emotions/embarrassed.png'),
  TIRED: require('@assets/images/emotions/tired.png'),
  SAD: require('@assets/images/emotions/sad.png'),
  DEPRESSED: require('@assets/images/emotions/depressed.png'),
  ANGRY: require('@assets/images/emotions/angry.png'),
};

/** 서버가 준 문자열이 9종 밖이면 화면이 깨지지 않게 null 로 떨어뜨린다. */
export function toEmotion(value: string | null | undefined): Emotion | null {
  return value && (EMOTIONS as string[]).includes(value) ? (value as Emotion) : null;
}

/** 그림만으로는 스크린리더가 읽을 것이 없다 - 라벨을 따로 준다(ui-fundamentals 접근성). */
export function emotionLabel(emotion: Emotion | null): string {
  return emotion ? EMOTION_LABEL[emotion] : '기록 없음';
}
