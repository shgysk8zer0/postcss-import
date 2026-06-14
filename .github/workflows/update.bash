# git checkout -b feature/ci-harden
cp ~/GitHub/polyfills/.nvmrc .nvmrc
cp ~/GitHub/polyfills/.npmrc .npmprc
cp ~/GitHub/polyfills/.github/workflows/ * .github/workflows/
cp ~/GitHub/polyfills/.github/SECURITY.md .github/SECURITY.md
cp ~/GitHub/polyfills/.github/CONTRIBUTING.md .github/CONTRIBUTING.md
nvm use
