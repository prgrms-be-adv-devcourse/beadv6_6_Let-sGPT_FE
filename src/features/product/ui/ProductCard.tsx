import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import type { Product } from "../model/product.schema";

const priceFormatter = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: "KRW",
});

/** 상품 1건을 표현하는 순수 프레젠테이션 컴포넌트(데이터 페칭 없음). */
export function ProductCard({ product }: { product: Product }) {
  return (
    <Card data-testid="product-card">
      <CardHeader>
        <CardTitle>{product.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">
          {priceFormatter.format(product.priceAmount)}
        </p>
      </CardContent>
    </Card>
  );
}
