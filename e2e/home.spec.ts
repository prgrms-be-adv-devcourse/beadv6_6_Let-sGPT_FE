import { expect, test } from "@playwright/test";

test("홈 헤더에 브랜드 워드마크(openAt)가 보인다", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "openAt" }).first()).toBeVisible();
});

test("Shop 내비로 상품 목록으로 이동한다", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Shop" }).click();
  await expect(page).toHaveURL(/\/products/);
});
