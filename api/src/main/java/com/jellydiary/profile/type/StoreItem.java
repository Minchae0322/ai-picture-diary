package com.jellydiary.profile.type;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

/**
 * 09 상점 카탈로그. 항목 수가 적고 가격·재고가 없어 마스터 테이블을 만들지 않았다 - 서버가 목록을 내려주므로
 * 앱은 여전히 하드코딩하지 않는다(09 화면 문서 6장).
 *
 * <p>ponytail: 결제나 개별 구매가 생기면 그때 tb_store_item 으로 옮긴다. 지금은 enum 이 정확히 필요한 만큼이다.
 */
public enum StoreItem {
    JELLY(StoreCategory.THEME, "Jelly", "기본", false),
    NIGHT_JELLY(StoreCategory.THEME, "Night Jelly", "밤의 젤리", true),
    MINT_SODA(StoreCategory.THEME, "Mint Soda", "청량한 민트", false),
    LAVENDER(StoreCategory.THEME, "Lavender", "라벤더 드림", true),

    JELLY_BEAR(StoreCategory.CHARACTER, "젤리곰", "기본", false),
    STAR_CANDY(StoreCategory.CHARACTER, "별사탕", "Plus 전용", true),
    CLOUDY_FRIEND(StoreCategory.CHARACTER, "구름이", "Plus 전용", true),
    SPROUT(StoreCategory.CHARACTER, "새싹", "Plus 전용", true);

    public static final StoreItem DEFAULT_THEME = JELLY;
    public static final StoreItem DEFAULT_CHARACTER = JELLY_BEAR;

    private final StoreCategory category;
    private final String displayName;
    private final String description;
    private final boolean plusOnly;

    StoreItem(StoreCategory category, String displayName, String description, boolean plusOnly) {
        this.category = category;
        this.displayName = displayName;
        this.description = description;
        this.plusOnly = plusOnly;
    }

    public static Optional<StoreItem> byCode(String code) {
        return Arrays.stream(values()).filter(item -> item.name().equals(code)).findFirst();
    }

    public static List<StoreItem> of(StoreCategory category) {
        return Arrays.stream(values()).filter(item -> item.category == category).toList();
    }

    public StoreCategory category() {
        return category;
    }

    public String displayName() {
        return displayName;
    }

    public String description() {
        return description;
    }

    public boolean plusOnly() {
        return plusOnly;
    }

    /** 무료 항목은 누구나, Plus 항목은 구독자만. 구독 상태는 서버가 보관한 값만 믿는다. */
    public boolean isUsableBy(boolean plus) {
        return !plusOnly || plus;
    }
}
