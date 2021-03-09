# Make executable with chmod +x <<filename.sh>>

CURRENTDIR=${pwd}
PROJECT_PATH="/$HOME/projects/seo-testing"

cd "$PROJECT_PATH"

# git actions
git add .
git commit -m 'seo testing'
git push origin master --force
