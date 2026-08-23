# @telecrypt-io/ui 0.1.1

This is the framework-neutral shared foundation for TeleCrypt UI code.
It currently contains two deliberately independent exports:

- `product.css` — a byte-for-byte extraction of
  `storage-web-v0.2.0/src/theme.css`. It preserves Storage's existing visual
  interface; it is not a redesign or a new cross-service theme.
- `logo-mark.png` — the original custom TeleCrypt Landing mark, copied without
  modification from `www.telecrypt.io/public/logo-mark.png`.

The Storage favicon is deliberately outside this package. It is not a shared
brand asset, design-token source, or visual reference for Landing or Plan.

## Integration and verification

Storage retains `src/theme.css` as its cascade entry point. Storage vendors the exact stylesheet from
the immutable `v0.1.1` source release at
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

This repository is source-only and deliberately remains `private: true` as an
npm package: consumers vendor reviewed files from the immutable exact `v0.1.1`
Git tag.
Tags use `v<major>.<minor>.<patch>`. A tag must match `package.json`, and the
verification workflow checks the canonical CSS and mark hashes without building
or publishing an artifact.

## License

TeleCrypt-authored source in this repository is licensed under [BUSL-1.1](./LICENSE). Vendored
consumer assets retain their existing source and license notices.
