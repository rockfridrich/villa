# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.0-beta.1] - 2026-01-28

### Added

- Independent versioning system for SDK packages
- Automated release scripts with `./scripts/sdk-release.sh`
- Version compatibility matrix documentation
- Enhanced CI/CD pipeline for independent package publishing
- Villa hub compatibility engine specification

### Changed

- Decoupled SDK versioning from monorepo versioning
- Improved package.json scripts for version management
- Updated GitHub Actions workflow to support multiple package releases

### Fixed

- Cross-package dependency management during releases
