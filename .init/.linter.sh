#!/bin/bash
cd /home/kavia/workspace/code-generation/mysteryforge-103681-eff0a964/suspect_finder_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

