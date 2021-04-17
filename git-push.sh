# Make executable with chmod +x <<filename.sh>>
echo $repoID
echo $pwd
CURRENTDIR=${pwd}
echo $CURRENTDIR
PROJECT_PATH="/$HOME/projects/seo-testing$repoID"

cd "$PROJECT_PATH"

# git actions
git add .
git commit -m 'seo testing'
git push origin master --force
