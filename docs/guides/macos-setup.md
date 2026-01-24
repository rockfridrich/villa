# macOS Development Setup Guide

This guide walks you through setting up your macOS development environment for Villa.

## Installing Homebrew

Homebrew is the package manager for macOS. Open Terminal and run the installation script:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

After installation, follow the instructions shown to add Homebrew to your PATH.

## Installing Node.js

Villa requires Node.js version 20 or higher. Install it with Homebrew:

```bash
brew install node@20
```

Verify the installation:

```bash
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x or higher
```

## Installing Claude Code CLI

Claude Code is the AI-assisted development tool that powers Villa's specs-driven workflow:

```bash
npm install -g @anthropic-ai/claude-code
```

Set your API key as an environment variable by adding to your shell configuration file (.zshrc or .bash_profile):

```bash
export ANTHROPIC_API_KEY="your-api-key-here"
```

## Installing Git

Git is likely already installed, but if not:

```bash
brew install git
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

## Cloning and Running

Clone the repository and install dependencies:

```bash
git clone https://github.com/rockfridrich/villa.git
cd villa
npm install
cp .env.example .env.local
npm run dev
```

The application will be available at http://localhost:3000.

## Starting Claude Code

Start a Claude Code session in the project directory:

```bash
claude
```

Claude will read the project configuration and be ready to help with development tasks.
