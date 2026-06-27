#!/bin/bash

BACKUP=/workspaces/psoulc/.home-backup

if [ -d "$BACKUP/claude-projects" ]; then
  mkdir -p ~/.claude
  cp -r "$BACKUP/claude-projects" ~/.claude/projects
  echo "✓ Claude memory restored"
fi

if [ -d "$BACKUP/gstack" ]; then
  cp -r "$BACKUP/gstack" ~/.gstack
  echo "✓ gstack state restored"
fi

if [ -d "$BACKUP/gbrain" ]; then
  cp -r "$BACKUP/gbrain" ~/.gbrain
  echo "✓ GBrain restored"
fi

if [ ! -d ~/.claude/skills/gstack ]; then
  mkdir -p ~/.claude/skills
  git clone https://github.com/garrytan/gstack.git ~/.claude/skills/gstack 2>/dev/null || echo "⚠ gstack clone failed — run manually: cd ~/.claude/skills/gstack && ./setup"
  if [ -d ~/.claude/skills/gstack ]; then
    (cd ~/.claude/skills/gstack && ./setup) || echo "⚠ gstack setup failed — run manually"
  fi
fi

cd /workspaces/psoulc && npm install || echo "⚠ npm install failed — run manually: cd /workspaces/psoulc && npm install"
echo "✓ done"
