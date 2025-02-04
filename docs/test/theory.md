# 테스트 코드

- 테스팅은 소프트웨어가 예상한대로 실행되는지 검증하고 확인하는 과정
  - 코드를 작성해서 코드를 테스팅

## 중요성

- QA: 미리 버그를 발견해서 프로덕션 환경에서 문제가 생기는 것을 방지
- 더욱 빠른 리팩터링: 변경한 코드가 기존 로직에서 문제를 일으킬 경우 미리 알 수 있다.
- 문서화 역할: 테스트 자체가 코드가 어떻게 작동해야하는지 설명하는 하나의 문서 역할을 한다.
- 코드 로직 검증 자동화: 테스트 코드를 실행해서 로직 검증을 자동화하여 직접 프로그램을 테스트할 필요가 없어진다.

# Mock / Stub / Fake

테스트할 때 의존성을 해결하는 방법이 다양하게 존재한다.  
모든 의존성을 그대로 사용하는 테스트도 존재하지만 그런 테스트는 너무 무겁고 오래걸리므로 일반적으로 디펜던시를 각자의 객체로 스왑하고 사용한다.

### Mock

- Mock은 상호작용을 검증하는 객체
- 행위 검증(메서드 호출 횟수, 파라미터 등을 확인)

### Stub

- Stub은 함수나 객체의 간소화된 버전으로 미리 정의된 값을 반환
- 값 검증

### Fake

- Fake는 실제 객체를 간소하게 구현한 형태이다. 복잡한 객체의 작동방식을 최소화하여 구현한 형태.
- 실제 객체는 너무 헤비하지만 Stub보다는 현실적인 작동이 필요할 때 많이 사용

# Mock Function

- mockFn.mockImplementation(fn): mock 함수의 구현체 변경
- mockFn.mockReturnThis(): mock 함수가 호출될 때마다 this를 반환하도록 설정
- mockFn.mockReturnValue(value): mock 함수가 호출될 때마다 특정 값을 반환하도록 설정
- mockFn.mockResolvedValue(value): mock 함수가 호출될 때 Promise가 특정 값으로 Resolve 되도록 한다.
- mockFn.mockRejectedValue(value): mock 함수가 호출될 때 Promise가 특정 값으로 Reject 되도록 설정한다.

- mockFn.mockClear(): mock 함수의 호출 기록, 반환값을 지운다 (상태 초기화)
- mockFn.mockReset(): mockClear + mock 함수를 빈 함수로 대체
- mockFn.mockRestore(): mockReset + mock 함수를 원래 구현체로 복원