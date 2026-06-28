import { waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { useAuthStore } from "@/features/auth/store/authStore";
import { useActiveSellerStore } from "../store/activeSellerStore";
import { switchActiveSeller } from "./sellers.queries";

describe("활성 스토어 전환 (SSOT + 판매자 토큰 선재발급)", () => {
  beforeEach(() => {
    useAuthStore.setState({
      accessToken: "mock-access-token",
      sellerToken: null,
      sellerTokenStoreId: null,
      sellerTokenExpiresAt: null,
    });
    useActiveSellerStore.setState({ activeSellerId: null });
  });
  afterEach(() => {
    useAuthStore.getState().clear();
    useActiveSellerStore.setState({ activeSellerId: null });
  });

  it("전환 시 activeSellerId 가 즉시 바뀌고 그 스토어 범위 토큰이 선재발급된다", async () => {
    switchActiveSeller("s-2");

    // 전환은 즉시(동기) 반영.
    expect(useActiveSellerStore.getState().activeSellerId).toBe("s-2");

    // 토큰은 선재발급(비동기)되어 해당 스토어 범위로 채워진다.
    await waitFor(() => {
      expect(useAuthStore.getState().sellerToken).toBe("mock-seller-token:s-2");
      expect(useAuthStore.getState().sellerTokenStoreId).toBe("s-2");
    });
  });

  it("다른 스토어로 다시 전환하면 토큰이 새 스토어 범위로 재발급된다", async () => {
    switchActiveSeller("s-1");
    await waitFor(() => expect(useAuthStore.getState().sellerToken).toBe("mock-seller-token:s-1"));

    switchActiveSeller("s-2");
    expect(useActiveSellerStore.getState().activeSellerId).toBe("s-2");
    await waitFor(() => expect(useAuthStore.getState().sellerToken).toBe("mock-seller-token:s-2"));
  });
});
