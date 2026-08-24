# @telecrypt-io/ui

This is the framework-neutral shared foundation for TeleCrypt UI code.
It currently contains two deliberately independent exports:

- `product.css` — the shared product stylesheet consumed by Storage Web and Plan.
- `logo-mark.png` — the shared TeleCrypt mark consumed by website surfaces.

The package contains only these explicit exports. Service-specific layout and branding remain in
each consumer.

## Integration and verification

Storage retains `src/theme.css` as its cascade entry point. Storage vendors the exact stylesheet from
an immutable exact source release at
`src/vendor/telecrypt-ui/product.css`; it imports that local file directly, so
the Storage release is self-contained and has neither a runtime npm dependency
nor Vite alias wiring. Its `PROVENANCE.json` records the exact current release
and canonical shared-UI commit vendored by that consumer.

Plan has no frontend package manager, so Controlplane embeds
a vendored `internal/plan/assets/product.css`. That file must remain
byte-identical to this package's `src/product.css`; Plan-specific layout stays in
its separate embedded `plan.css`.

The package checksum manifest and each consumer's automated provenance check own
byte-level identity. Each consumer still needs an operator-run visual regression
against its exact tagged interface release.

## Release contract

This repository deliberately remains `private: true` as an npm package: consumers vendor
reviewed files from an immutable exact Git tag. The tag-only workflow packages the exact
five-file tarball once and publishes it as the sole GitHub Release asset; it does not publish to
the npm registry. It creates or resumes one draft Release, verifies its immutable metadata and
exact downloaded bytes, then publishes it. A rerun may resume only the same exact draft Release
and its already-verified asset; any pre-existing published Release is refused so a publication
cannot silently adopt an earlier artifact.
Tags use `v<major>.<minor>.<patch>`. A tag must match `package.json`, and the
verification workflow checks the canonical CSS, mark hashes, package contents, and tests before
the release job runs. Before enabling the release job, the repository administrator must enforce
protected, non-force-movable release tags and GitHub immutable releases. The workflow performs
strict checks immediately before and after GitHub operations, but those API calls are not an atomic
tag-and-release transaction; the administrator must treat the repository settings as a release
precondition.

## License

TeleCrypt-authored source in this repository is licensed under [BUSL-1.1](./LICENSE). Vendored
consumer assets retain their existing source and license notices.
