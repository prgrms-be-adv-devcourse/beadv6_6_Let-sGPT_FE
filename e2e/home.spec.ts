import { expect, test } from "@playwright/test";

test("홈 화면이 서비스 제목을 보여준다", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Let'sGPT" })).toBeVisible();
});

test("상품 탭으로 이동할 수 있다", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "상품" }).click();
  await expect(page).toHaveURL(/\/products/);
});
