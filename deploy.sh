#!/usr/bin/env bash

mkdir tmp

cp -R .git tmp

cd tmp

git fetch
git checkout gh-pages
git pull

rm -rf ./*

git add .
git commit -m "rm"

cp -R ../dist/* ./
cp ../dist/index.html ./index.html
cp ../.gitignore ./

git add .
git commit -m "deploy $(date)"

git status
git push origin gh-pages

cd ../
rm -rf tmp