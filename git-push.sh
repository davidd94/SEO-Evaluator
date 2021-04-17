# Make executable with chmod +x <<filename.sh>>
CURRENTDIR=${pwd}
echo "WTF"
PROJECT_PATH="/$HOME/projects/seo-testing$repoID"

cd "$PROJECT_PATH"

# git actions
git add .
git commit -m 'seo testing'
git push origin master --force
