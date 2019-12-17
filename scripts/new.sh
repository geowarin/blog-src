
echo "Enter article file name (ex: hello-world):"
read -r title
hugo new "post/$(date +%Y)/$(date -u +"%Y-%m-%d")-$title.md"
idea "content/post/$(date +%Y)/$(date -u +"%Y-%m-%d")-$title.md"
