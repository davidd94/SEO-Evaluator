# Make executable with chmod +x <<filename.sh>>

while getopts ":a:p:" opt; do
  case $opt in
    a) arg_1="$OPTARG"
    ;;
    \?) echo "Invalid option -$OPTARG" >&2
    ;;
  esac
done

CURRENTDIR=${pwd}
PROJECT_PATH="/$HOME/projects/seo-testing$arg_1"

cd "$PROJECT_PATH"

# git actions
git checkout test-branch-$arg_1
git add .
git commit -m 'seo element update'
git push origin test-branch-$arg_1
