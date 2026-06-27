const footerLinks = ["이용약관", "개인정보처리방침", "고객센터"];

/** 전 화면 공통 하단 영역(앱 셸) — 미니멀 에디토리얼 푸터. */
export function SiteFooter() {
  return (
    <footer className="border-border border-t">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-serif text-xl leading-none tracking-tight">openAt</p>
            <p className="mt-3 max-w-xs text-muted-foreground text-sm">한정판 드롭, 가장 먼저.</p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-muted-foreground text-sm">
            {footerLinks.map((label) => (
              <span key={label} className="transition-colors hover:text-foreground">
                {label}
              </span>
            ))}
          </nav>
        </div>
        <p className="mt-10 text-muted-foreground text-xs">© 2026 openAt. All rights reserved.</p>
      </div>
    </footer>
  );
}
