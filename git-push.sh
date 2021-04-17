# Make executable with chmod +x <<filename.sh>>

while getopts ":a:p:" opt; do
  case $opt in
    a) arg_1="$OPTARG"
    ;;
    p) p_out="$OPTARG"
    ;;
    \?) echo "Invalid option -$OPTARG" >&2
    ;;
  esac
done

CURRENTDIR=${pwd}
PROJECT_PATH="/$HOME/projects/seo-testing$arg_1"

cd "$PROJECT_PATH"

# create .git
git init
git remote add origin https://github.com/davidd94/seo-testing$arg_1.git

# git actions
git add .
git commit -m 'seo testing'
git push origin master --force
