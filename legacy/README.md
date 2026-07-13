# legacy/ — k3s 전환으로 폐기된 FE 배포 자산

> 2026-07-13 이동. BE 리포의 k3s + ArgoCD GitOps 컷오버(2026-07-09)로 FE 배포도
> 더 이상 이 경로로 이루어지지 않는다. 히스토리·참고용으로만 보존.
> 현재 FE 배포의 단일 소스는 BE 리포의 `k8s/kustomization.yaml`(이미지 SHA 핀)
> + `.github/workflows/deploy.yml`(ArgoCD 수렴 확인)이다.

| 파일 | 원래 역할 | 폐기 이유 |
|---|---|---|
| `deploy.yml` | FE CI 성공 시 `ec2-fe` 러너가 `:latest` 이미지를 pull해 `openat-nginx` 컨테이너로 직접 재기동 (compose 시절 방식) | BE `k8s/30-frontend.yaml` Deployment + ArgoCD auto-sync로 대체. **여기 있으면 GitHub이 워크플로로 인식하지 않아 자동 비활성** |

**알려진 잔재 (이번 정리 범위 밖, 후속 확인 필요)**:
- `ec2-fe-runner`(EC2 `semi`)는 등록이 유지된 채 online 상태 — 더 이상 매치되는 워크플로가 없어 idle이 됨. 필요 없다면 러너 등록 해제는 별도 작업.
- `semi` 위에 `openat-nginx`라는 이름으로 떠 있을 수 있는 구 컨테이너 정리도 별도 작업.
