#!/bin/zsh
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
cd /Users/newton/documento/dooh/dooh-frontend
open http://localhost:3000
npm run dev
echo "Prima ENTER para fechar."
read
