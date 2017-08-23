#!/usr/bin/env bash
npm run build

mkdir tmp

cp -R ./dist/* tmp
cp .gitignore ./tmp
cp -R .git tmp

cd tmp
git checkout gh-pages
git add .
git commit -m "deploy $(date)"
git push origin gh-pages
cd ../
rm -rf tmp