git init
git add .
git commit -m $(date)
git branch -m master gh-pages
git remote add origin git@github.com:kamino-space/MibandWeb.git
git push origin gh-pages -f