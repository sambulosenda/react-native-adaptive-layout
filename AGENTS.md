# Notes for AI coding agents

- Read `docs/architecture.md` before editing anything under `ios/` or `src/native/`.
- Public API is `src/index.ts`. Do not add exports without an ADR in `docs/adr`.
- Run `yarn typecheck && yarn lint && yarn test` before proposing changes.
- Native changes cannot be unit-tested here; verify in `example/` on an iPhone Duo simulator and
  describe what you observed.
- Never infer hinge posture from angle. Report OS values or `unknown`.
- Add a changeset (`yarn changeset`) for user-facing changes.
