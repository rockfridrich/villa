# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.0-beta.1] - 2026-01-28

### Added

- Independent versioning system for SDK React package
- Automated release scripts with `./scripts/sdk-release.sh`
- Version compatibility matrix with core SDK
- Enhanced CI/CD pipeline for independent publishing

### Changed

- Decoupled React bindings versioning from monorepo
- Improved package.json scripts for version management
- Updated peer dependency management for SDK core updates

### Fixed

- Automatic peer dependency updates during SDK core releases
